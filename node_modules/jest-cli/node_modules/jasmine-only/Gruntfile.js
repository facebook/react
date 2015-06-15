/*global module:false*/
module.exports = function(grunt) {
  require(process.env['LINEMAN_MAIN']).config.grunt.run(grunt);
};
