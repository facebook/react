// Cleans up pubspec.yaml files prior to publishing
// Usage: node pubspec_cleaner.js --pubspec-file=PATH_TO_PUBSPEC_YAML

fs   = require('fs');
yaml = require('js-yaml');
yargs = require('yargs');

var pubspecFileOpt = 'pubspec-file';
var pubspecFile = yargs
    .demand([pubspecFileOpt])
    .argv[pubspecFileOpt];

var doc = yaml.safeLoad(fs.readFileSync(pubspecFile, 'utf8'));

// Pub does not allow publishing with dependency_overrides
delete doc['dependency_overrides'];

// Overwrite temporary values with real values
delete doc['version'];
delete doc['authors'];
delete doc['homepage']

var BASE_PACKAGE_JSON = require('../../package.json');
doc['version'] = BASE_PACKAGE_JSON.version;
doc['homepage'] = BASE_PACKAGE_JSON.homepage;
doc['authors'] = Object.keys(BASE_PACKAGE_JSON.contributors).map(function(name) {
  return BASE_PACKAGE_JSON.contributors[name];
});

if (doc['dependencies'] && doc['dependencies']['angular2']) {
  delete doc['dependencies']['angular2'];
  doc['dependencies']['angular2'] = BASE_PACKAGE_JSON.version;
}

fs.writeFileSync(pubspecFile, yaml.safeDump(doc));
