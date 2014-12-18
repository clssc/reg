var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var minify = require('html-minifier').minify;
var uglify = require('uglify-js').minify;
var CleanCSS = require('clean-css');


var DIST_FILES = [
  'common.css',
  'logo.png',
  'index.html',
  'main.js',
];

function minifyAndCp(source, target) {
  var sourceFile = path.resolve(source);
  var targetFile = path.resolve(target);
  var contents = fs.readFileSync(sourceFile, {encoding: 'utf8'});
  var ext = path.extname(source);

  var minified = contents;
  if (ext == '.html' || ext == '.htm') {
    minified = minify(contents, {
      removeAttributeQuotes: true,
      removeComments: true,
      collapseWhitespace: true
    });
  } else if (ext == '.js') {
    minified = uglify(sourceFile).code;
  } else if (ext == '.css') {
    minified = new CleanCSS().minify(contents);
  }
  fs.writeFileSync(targetFile, minified);
}

gulp.task('default', function() {
  console.log('Usage:');
  console.log('  gulp build    Builds the web site under build/');
});

gulp.task('build', function(callback) {
  var pageGenPath = path.join(path.resolve(__dirname), 'tools/pagegen.js');
  exec('node ' + pageGenPath, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    DIST_FILES.forEach(function(file) {
      minifyAndCp('resources/' + file, 'build/' + file);
    });
    callback(err);
  });
});
