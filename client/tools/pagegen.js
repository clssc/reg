/**
 * @fileoverview Web page generator for Westside Chinese School registration.
 * This code is supposed to be run using node.js. Usage:
 *   node pagegen.js
 *      --template=<template> Options, the template to process
 *      --css=<CSS> Optional, the CSS file to include
 *      --js=<JS> Optional, the JS file to include
 *      --outputdir=<output path> Optional, default to where the template is
 * Limitation:
 * 1. All localizable resources must be in DIV, and the DIV can have only one
 *    attribute data-name.
 * 2. All message files must be in the same directory as templates and named
 *    with .txt extension
 * 3. Supports only three languages: EN (English), TC (Traditional Chinese),
 *    SC (Simplified Chinese)
 *
 * @author Arthur Hsu (arthurhsu@westsidechineseschool.org)
 */
var path = require('path');
var fs = require('fs');
var nopt = require('nopt');
var minify = require('html-minifier').minify;
var templateParser = require('./template.js');

var knownOpts = {
  'templates': [String, null],
  'outputdir': [path, null],
  'nominify': Boolean,
  'help': [null]
};
var args = nopt(knownOpts);

function argsCheck() {
  if (args.hasOwnProperty('help')) {
    console.log('Usage: node pagegen.js');
    console.log('  --templates=<template> The templates to process, comma separated.');
    console.log('  --outputdir=<output path> Optional, default to build/');
    console.log('  --nominify Optional, will not minify HTML if specified');
    console.log('  --help Display usage');
    process.exit(1);
  }
}


function main() {
  argsCheck();
  var templatePath = args.template ? args.template :
      '../resources/main.html,' +
      '../resources/selector.html,' +
      '../resources/returning.html,' +
      '../resources/manual.html';
  var templates = templatePath.split(',');

  var outputDir = path.resolve(path.join(__dirname, '../build'));
  if (args.outputdir) {
    outputDir = path.resolve(__dirname, args.outputdir);
  }
  if (!fs.existsSync(outputDir)) {
    // Attempt to create dir with best efforts.
    fs.mkdirSync(outputDir);
  }

  templates.forEach(function(filePath) {
    var templatePath = path.resolve(path.join(__dirname, filePath));
    var parsedContents =
        templateParser.parseHtml(templatePath);
    var LANG = templateParser.LANG;

    var basename = path.basename(templatePath);
    basename = basename.substring(0, basename.indexOf('.htm'));
    var extname = path.extname(templatePath);
    for (var i = 0; i < LANG.length; ++i) {
      var filePath = path.join(outputDir, basename + '-' + LANG[i] + extname);
      var contents = args.nominify ? parsedContents[i] :
          minify(parsedContents[i], {
            removeAttributeQuotes: true,
            removeComments: true,
            collapseWhitespace: true
          });
      fs.writeFileSync(filePath, contents, {encoding: 'utf8'});
    }
  });
}

main();
