var fs = require('fs');
var obj = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
obj.files.forEach(function(file) {
  if (file.type == 'server_js') {
    fs.writeFileSync(file.name + '.gs', file.source);
  } else if (file.type == 'html') {
    fs.writeFileSync(file.name + '.html', file.source);
  }
});
