// Removes dart2js from pubspec.yaml for faster building
// Usage: node pubspec_for_ddc.js --pubspec-file=PATH_TO_PUBSPEC_YAML

var fs = require('fs');
var yaml = require('js-yaml');
var yargs = require('yargs');

var pubspecFileOpt = 'pubspec-file';
var pubspecFile = yargs
    .demand([pubspecFileOpt])
    .argv[pubspecFileOpt];

var doc = yaml.safeLoad(fs.readFileSync(pubspecFile, 'utf8'));

var transformers = doc['transformers'];
if (transformers) {
  transformers.forEach(function (transformer) {
    var dart2js = transformer['\$dart2js'];
    if (dart2js) {
      dart2js['$exclude'] = [ 'web/**/*' ];
    }
  });
}

fs.writeFileSync(pubspecFile, yaml.safeDump(doc));
