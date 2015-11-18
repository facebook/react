'use strict';

var grunt = require('grunt');
var UglifyJS = require('uglify-js');

var LICENSE_TEMPLATE =
  grunt.file.read('./grunt/data/header-template-extended.txt');

function build(name, filename) {
  var srcFile = `vendor/${filename}.js`;
  var destFile = `build/${filename}.js`;
  var destFileMin = `build/${filename}.min.js`;
  var templateData = {
    package: name,
    version: grunt.config.data.pkg.version,
  };
  var header = grunt.template.process(
    LICENSE_TEMPLATE,
    {data: templateData}
  );
  var src = grunt.file.read(srcFile);
  var srcMin = UglifyJS.minify(src, {fromString: true}).code;
  grunt.file.write(destFile, header + src);
  grunt.file.write(destFileMin, header + srcMin);
}

module.exports = function() {
  build('ReactDOM', 'react-dom');
  build('ReactDOMServer', 'react-dom-server');
};
