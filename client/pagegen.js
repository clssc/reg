/**
 * @fileoverview Web page generator for Westside Chinese School registration.
 * This code is supposed to be run using node.js. Usage:
 *   node pagegen.js 
 *      --template=<template> The template to process
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
 *
 * This code requires package nopt.
 */
var path = require('path');
var fs = require('fs');
var nopt = require('nopt');
var templateParser = require('./template.js');

var knownOpts = {
  'template': [path],
  'css': [path, null],
  'js': [path, null],
  'outputdir': [path, null]
};
var args = nopt(knownOpts);

function argsCheck() {
  if (!args.hasOwnProperty('template')) {
    console.log('Usage: node pagegen.js');
    console.log('  --template=<template> The template to process');
    console.log('  --css=<CSS> Optional, the CSS file to include');
    console.log('  --js=<JS> Optional, the JS file to include');
    console.log('  --outputdir=<output path> Optional, default to where' +
      ' the template is');
    process.exit(1);
  }
}


function main() {
  argsCheck();
  var css;
  if (args.css) {
    var cssPath = path.resolve(args.css);
    css = fs.readFileSync(cssPath, {encoding: 'utf8'}).split('\n');
  }
  var js;
  if (args.js) {
    var jsPath = path.resolve(args.js);
    js = fs.readFileSync(jsPath, {encoding: 'utf8'}).split('\n');
  }
  var parsedContents =
      templateParser.parseHtml(path.resolve(args.template), css, js);
  var LANG = templateParser.LANG;
  var outputDir = path.dirname(path.resolve(args.template));
  if (args.outputdir) {
    outputDir = path.resolve(outputDir, args.outputdir);
  }

  var basename = path.basename(args.template);
  basename = basename.substring(0, basename.indexOf('.htm'));
  var extname = path.extname(args.template);
  for (var i = 0; i < LANG.length; ++i) {
    var filePath = path.join(outputDir, basename + '-' + LANG[i] + extname);
    fs.writeFileSync(filePath, parsedContents[i], {encoding: 'utf8'});
  }
}

main();
