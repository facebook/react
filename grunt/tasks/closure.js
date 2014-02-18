var execSync = require('execSync');

var CLOSURE_CMD = 'java -jar ./vendor/closure/compiler.jar --js_output_file ./build/react.closure.js --externs ./vendor/closure/externs_react.js --compilation_level ADVANCED_OPTIMIZATIONS ./build/modules/*.js';
module.exports = function() {
  var deps = JSON.parse(
    execSync.exec('module-deps ./build/modules/React.js').stdout
  ).map(function(dep) {
    return dep.id;
  });

  if (execSync.exec(CLOSURE_CMD).code !== 0) {
    grunt.log.error('Closure compiler did not exit with status 0');
  }
};