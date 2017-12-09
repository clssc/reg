var gulp = require('gulp');
var gulpConnect = require('gulp-connect');
var path = require('path');
var fs = require('fs-extra');
var exec = require('child_process').exec;
var nopt = require('nopt');
var minify = require('html-minifier').minify;
var uglify = require('uglify-js').minify;
var CleanCSS = require('clean-css');


var DIST_FILES = [
  'common.css',
  'logo.png',
  'index.html',
  'main.js',
  'returning.js',
  'detect.js'
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
    var contents = fs.readFileSync(sourceFile, {encoding:'utf8'});
    minified = uglify(contents).code;
  } else if (ext == '.css') {
    minified = new CleanCSS().minify(contents).styles;
  }
  fs.writeFileSync(targetFile, minified);
}

gulp.task('default', function() {
  console.log('Usage:');
  console.log('  gulp build    Builds the web site under build/');
  console.log('  gulp clean    Clean previous build');
  console.log('  gulp debug    Builds the web site and run');
});

gulp.task('build', ['clean'], function(callback) {
  var pageGenPath = path.join(path.resolve(__dirname), 'tools/pagegen.js');
  exec('node ' + pageGenPath, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    DIST_FILES.forEach(function(file) {
      minifyAndCp(path.join('resources', file), path.join('build', file));
    });
    callback(err);
  });
});

gulp.task('clean', function() {
  fs.removeSync(path.resolve(__dirname, 'build'));
});

gulp.task('debug_build', ['clean'], function(callback) {
  var pageGenPath = path.join(path.resolve(__dirname), 'tools/pagegen.js');
  exec('node ' + pageGenPath + ' --nominify', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    DIST_FILES.forEach(function(file) {
      if (file != 'detect.js') {
        fs.copySync('resources/' + file, 'build/' + file);
      } else {
        // Must disable detect.js to allow local debugging.
        fs.ensureFileSync('build/' + file);
      }
    });
    callback(err);
  });
});

gulp.task('debug', ['debug_build'], function() {
  var knownOpts = {
    'port': [Number, null]
  };

  var options = nopt(knownOpts);
  var port = options.port || 8000;

  gulpConnect.server({
    livereload: true,
    port: port,
    root: path.resolve(__dirname, 'build')
  });
});
