var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var DIST_FILES = [
  'common.css',
  'index.html',
  'main.js'
];

function cp(source, target) {
  var sourceFile = path.resolve(source);
  var targetFile = path.resolve(target);
  fs.writeFileSync(targetFile, fs.readFileSync(sourceFile));
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
      cp('resources/' + file, 'build/' + file);
    });
    callback(err);
  });
});
