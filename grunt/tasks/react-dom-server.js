'use strict';

var grunt = require('grunt');
var UglifyJS = require('uglify-js');

var LICENSE_TEMPLATE =
  grunt.file.read('./grunt/data/header-template-extended.txt');

module.exports = function() {
  var templateData = {
    package: 'ReactDOMServer',
    version: grunt.config.data.pkg.version,
  };
  var header = grunt.template.process(
    LICENSE_TEMPLATE,
    {data: templateData}
  );
  var src = grunt.file.read('vendor/react-dom-server.js');
  grunt.file.write(
    'build/react-dom-server.js',
    header + src
  );
  grunt.file.write(
    'build/react-dom-server.min.js',
    header + UglifyJS.minify(src, {fromString: true}).code
  );
};
