var path = require('path');
var fs = require('fs');

module.exports = function(dir, files) {
  var filename = 'main_test.dart';
  var imports = [
    '@TestOn("browser")',
    'import "package:guinness2/guinness2.dart";'];
  var executes = [];

  files.forEach(function(match) {
    var varName = match.replace(/[\/.]/g, '_');
    imports.push('import "' + match + '" as ' + varName +';');
    executes.push('  ' + varName + '.main();');
  });

  var output = imports.join('\n') + '\n\nmain() {\n' + executes.join('\n') + '\n}';

  fs.writeFileSync(path.join(dir, filename), output);
  return filename;
};
