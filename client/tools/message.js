/**
 * @fileoverview Message file parser for pagegen.js
 * @author Arthur Hsu (arthurhsu@westsidechineseschool.org)
 */
var util = require('./common.js');


/** @enum {number} */
var States = {
  UNKNOWN: 0,
  START_LABEL: 1,
  END_LABEL: 2,
  START_BLOCK: 3,
  END_BLOCK: 4,
  LINE: 5
};


/**
 * @param {number} currentState
 * @param {string} line
 * @return {{
 *   state: number,
 *   label: ?string,
 *   message: ?string
 * }}
 */
function getState(state, line) {
  var result = {
    state: state
  };
  line = line.trim();

  if (line.indexOf('@@start') != -1) {
    result.state = States.START_LABEL;
  } else if (line.indexOf('@@line') != -1) {
    result.state = States.LINE;
    result.message = line.substring(line.indexOf(' ') + 1);
  } else if (line.indexOf('@@endblock') != -1) {
    result.state = States.END_BLOCK;
  } else if (line.indexOf('@@block') != -1) {
    result.state = States.START_BLOCK;
  } else if (line.indexOf('@@end') != -1) {  // must be placed after @endblock
    result.state = States.END_LABEL;
  } else {
    result.message = line;
  }

  result.label = util.extractLabel(line);
  return result;
}


/**
 * @param {!Array.<string>} lines
 * @return {!Object} The message object
 */
function buildMessage(lines) {
  var message = {};

  var validTransitions = {
    0: [1],
    1: [2, 3, 5],
    2: [1, 2],
    3: [3, 4],
    4: [2, 3, 4],
    5: [2, 3, 5]
  };

  var state = States.UNKNOWN;
  var label = null;
  var lang = null;
  for (var i = 0; i < lines.length; ++i) {
    var result = getState(state, lines[i]);
    if (validTransitions[state].indexOf(result.state) == -1) {
      throw new Error('Invalid message file');
    }
    switch (result.state) {
      case States.START_LABEL:
        label = result.label;
        message[label] = {};
        break;

      case States.LINE:
        message[label][result.label] = result.message;
        break;

      case States.END_LABEL:
        label = null;
        break;

      case States.START_BLOCK:
        if (result.label != null) {
          // Beginning of the block
          lang = result.label;
        } else {
          var oldMessage = message[label][lang] || '';
          message[label][lang] = oldMessage + result.message + '\n';
        }
        break;

      case States.END_BLOCK:
        lang = null;
        break;
    }
    state = result.state;
  }

  return message;
}


exports.buildMessage = buildMessage;
