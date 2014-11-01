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
 * This code requires package yargs.
 */
var path = require('path');
var fs = require('fs');
var argv = require('yargs').argv;
var templateParser = require('./template.js');


function argsCheck() {
  if (!argv.hasOwnProperty('template')) {
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
  if (argv.hasOwnProperty('css')) {
    var cssPath = path.resolve(argv.css);
    css = fs.readFileSync(cssPath, {encoding: 'utf8'}).split('\n');
  }
  var js;
  if (argv.hasOwnProperty('js')) {
    var jsPath = path.resolve(argv.js);
    js = fs.readFileSync(jsPath, {encoding: 'utf8'}).split('\n');
  }
  var parsedContents =
      templateParser.parseHtml(path.resolve(argv.template), css, js);
  var LANG = templateParser.LANG;
  var outputDir = path.dirname(path.resolve(argv.template));
  if (argv.outputdir) {
    outputDir = path.resolve(outputDir, argv.outputdir);
  }

  var basename = path.basename(argv.template);
  basename = basename.substring(0, basename.indexOf('.htm'));
  var extname = path.extname(argv.template);
  for (var i = 0; i < LANG.length; ++i) {
    var filePath = path.join(outputDir, basename + '-' + LANG[i] + extname);
    fs.writeFileSync(filePath, parsedContents[i], {encoding: 'utf8'});
  }
}

main();
