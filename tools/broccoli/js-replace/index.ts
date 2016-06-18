var fs = require('fs');
var path = require('path');

module.exports = readJs;
function readJs(file: string) {
  var content =
      fs.readFileSync(path.join('tools/broccoli/js-replace', file + '.js'), {encoding: 'utf-8'});
  // TODO(broccoli): we don't really need this, it's here to make the output match the
  // tools/build/html
  return content.substring(0, content.lastIndexOf('\n'));
}
