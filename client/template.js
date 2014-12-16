/**
 * @fileoverview Parses the HTML template and replace contents.
 * @author Arthur Hsu (arthurhsu@westsidechineseschool.org)
 */
var util = require('./common.js');
var messageBuilder = require('./message.js');
var path = require('path');
var fs = require('fs');


/** @const {!Array.<string>} */
var LANG = [ 'en', 'tc', 'sc' ];


/** @enum {number} */
var States = {
  UNKNOWN: 0,
  STARTED: 1,
  REPEAT: 2,
  ENDREPEAT: 3,
  SKIP: 4,
  INCLUDE: 5,
  CSS: 6,
  JS: 7,
  ENDED: 8
};


/**
 * @param {number} state Current state
 * @param {string} rawLine The input line
 * @return {{
 *   state: number,
 *   label: ?string,
 *   line: ?string
 * }}
 */
function getState(state, rawLine) {
  var result = {
    state: state,
    label: null,
    line: rawLine
  };
  var line = rawLine.trim();
  if (line == '<!-- @@start -->') {
    result.state = States.STARTED;
    result.line = null;
  } else if (line == '<!-- @@end -->') {
    result.state = States.ENDED;
    result.line = null;
  } else if (line.indexOf('<!-- @@include') != -1) {
    result.state = States.INCLUDE;
    result.label = util.extractLabel(line);
  } else if (line.indexOf('<!-- @@skip') != -1) {
    result.state = States.SKIP;
    result.label = util.extractLabel(line);
  } else if (line == '<!-- @@css -->') {
    result.state = States.CSS;
    result.line = null;
  } else if (line == '<!-- @@js -->') {
    result.state = States.JS;
    result.line = null;
  } else if (state >= States.STARTED &&
      state < States.ENDED && state != States.REPEAT) {
    result.state = States.STARTED;
  }

  return result;
}


/**
 * @param {string} line
 * @param {string} attr
 * @return {?string} Extracted attribute
 */
function getAttribute(line, attr, token) {
  var data = line.split(/[^A-Za-z0-9_-]/);
  for (var i = 0; i < data.length; ++i) {
    if (data[i] == attr) {
      return data[i + 2];
    }
  }
  return null;
}


/**
 * @param {string} lang
 * @param {!Array.<string>} output Pre-processed output
 * @param {!Object} message Message to expand
 * @return {string} Parsed HTML
 */
function replaceMessage(lang, output, message) {
  var result = [];
  var divLevel = 0;
  for (var i = 0; i < output.length; ++i) {
    var line = output[i];
    var match = line.match(/\s+/);
    var indent = match ? match[0] : '';
    if (line.indexOf('</div>') != -1 && divLevel > 0) {
      divLevel--;
      continue;
    }

    if (line.indexOf('<div') != -1 && line.indexOf('data-name') != -1) {
      // This div needs to be localized.
      if (divLevel > 0) {
        throw new Error('Cannot nest localizable divs');
      }
      divLevel = 1;
      var dataName = getAttribute(line, 'data-name');
      var className = getAttribute(line, 'class');

      var tag = (className == null) ? '<div>' :
          '<div class="' + className + '">';
      if (line.indexOf('</div>') != -1) {
        // Single line
        divLevel = 0;
        result.push(indent + tag + message[dataName][lang] + '</div>');
      } else {
        // Block
        result.push(indent + tag);
        result.push(message[dataName][lang]);
        result.push(indent + '</div>');
      }
      continue;
    }

    if (divLevel == 0) {
      result.push(line);
    }
  }

  return result.join('\n');
}


/**
 * @param {string} file Input file path
 * @param {string} lang
 * @param {!Array.<string>=} opt_css CSS contents to include
 * @param {!Array.<string>=} opt_js JS contents to include
 * @return {string} Parsed HTML
 */
function parseHtmlForOneLang(file, lang, opt_css, opt_js) {
  var lines = fs.readFileSync(file, {encoding: 'utf8'}).split('\n');
  var started = false;
  var output = [];

  var validTransitions = {
    0: [0, 1],
    1: [1, 2, 4, 5, 6, 7, 8],
    2: [2, 3],
    3: [1],
    4: [1],
    5: [1],
    6: [1],
    7: [1],
    8: [8]
  };

  var state = States.UNKNOWN;
  for (var i = 0; i < lines.length; ++i) {
    var toParse = lines[i].replace('@@lang', lang);
    var result = getState(state, toParse);
    if (validTransitions[state].indexOf(result.state) == -1) {
      throw new Error('Invalid template file: ' + file);
    }
    switch (result.state) {
      case States.STARTED:
        if (result.line && result.line.indexOf('@@lang') == -1) {
          output.push(result.line);
        }
        break;

      case States.SKIP:
        var skip = parseInt(result.label);
        i += skip;
        break;

      case States.INCLUDE:
        var myState = state;
        var newFile = path.resolve(
            path.join(path.dirname(file), result.label));
        output = output.concat(parseHtmlForOneLang(newFile, lang));
        result.state = myState;  // Restore state from recursion
        break;

      case States.CSS:
        if (opt_css == undefined) {
          throw new Error('@css specified in ' + file + ' but not provided');
        }
        output = output.concat(opt_css);
        break;

      case States.JS:
        if (opt_js == undefined) {
          throw new Error('@js specified in ' + file + ' but not provided');
        }
        output.push('var lang = \'' + lang + '\';');
        output = output.concat(opt_js);
        break;
    }
    state = result.state;
  }

  var messageFile = path.basename(file);
  messageFile = messageFile.substring(0, messageFile.indexOf('.')) + '.txt';
  var messagePath = path.join(path.dirname(file), messageFile);
  var message = messageBuilder.buildMessage(
      fs.readFileSync(messagePath, 'utf8').split('\n'));

  return replaceMessage(lang, output, message);
}


/**
 * @param {string} file Input file path
 * @param {!Array.<string>=} opt_css CSS contents to include
 * @param {!Array.<string>=} opt_js JS contents to include
 * @return {!Array.<string>} Parsed HTML
 */
function parseHtml(file, opt_css, opt_js) {
  var html = [];
  for (var j = 0; j < LANG.length; ++j) {
    var lang = LANG[j];
    html.push(parseHtmlForOneLang(file, lang, opt_css, opt_js));
  }
  return html;
}


exports.parseHtml = parseHtml;
exports.LANG = LANG;
