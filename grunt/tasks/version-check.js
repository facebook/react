'use strict';

var grunt = require('grunt');


// Check that the version we're exporting is the same one we expect in the
// package. This is not an ideal way to do this, but makes sure that we keep
// them in sync.
var reactVersionExp = /\bReact\.version\s*=\s*['"]([^'"]+)['"];/;

module.exports = function() {
  var reactVersion = reactVersionExp.exec(
    grunt.file.read('./src/browser/ui/React.js')
  )[1];
  var npmReactVersion = grunt.file.readJSON('./npm-react/package.json').version;
  var reactToolsVersion = grunt.config.data.pkg.version;

  if (reactVersion !== reactToolsVersion) {
    grunt.log.error(
      'React version does not match react-tools version. Expected %s, saw %s',
      reactToolsVersion,
      reactVersion
    );
    return false;
  }
  if (npmReactVersion !== reactToolsVersion) {
    grunt.log.error(
      'npm-react version does not match react-tools veersion. Expected %s, saw %s',
      reactToolsVersion,
      npmReactVersion
    );
    return false;
  }
};
