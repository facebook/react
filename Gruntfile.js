'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsx: require('./grunt/config/jsx'),
    npm: require('./grunt/config/npm'),
    clean: [
      './build',
      './*.gem',
      './docs/_site',
      './examples/shared/*.js',
      '.module-cache',
    ],
    /*eslint-disable camelcase */
    compare_size: require('./grunt/config/compare_size'),
    /*eslint-enable camelcase */
  });

  grunt.config.set('compress', require('./grunt/config/compress'));

  // Register jsx:normal and :release tasks.
  grunt.registerMultiTask('jsx', require('./grunt/tasks/jsx'));

  grunt.registerMultiTask('npm', require('./grunt/tasks/npm'));

  var npmReactTasks = require('./grunt/tasks/npm-react');
  grunt.registerTask('npm-react:release', npmReactTasks.buildRelease);
  grunt.registerTask('npm-react:pack', npmReactTasks.packRelease);

  var npmReactDOMTasks = require('./grunt/tasks/npm-react-dom');
  grunt.registerTask('npm-react-dom:release', npmReactDOMTasks.buildRelease);
  grunt.registerTask('npm-react-dom:pack', npmReactDOMTasks.packRelease);

  var npmReactAddonsTasks = require('./grunt/tasks/npm-react-addons');
  grunt.registerTask('npm-react-addons:release', npmReactAddonsTasks.buildReleases);
  grunt.registerTask('npm-react-addons:pack', npmReactAddonsTasks.packReleases);

  grunt.registerTask('version-check', require('./grunt/tasks/version-check'));

  grunt.registerTask('build:basic', [
    // 'build-modules',
    'version-check',
    // 'browserify:basic',
  ]);
  grunt.registerTask('build:addons', [
    // 'build-modules',
    // 'browserify:addons',
  ]);
  grunt.registerTask('build:min', [
    // 'build-modules',
    'version-check',
    // 'browserify:min',
  ]);
  grunt.registerTask('build:addons-min', [
    // 'build-modules',
    // 'browserify:addonsMin',
  ]);
  grunt.registerTask('build:npm-react', [
    'version-check',
    // 'build-modules',
    'npm-react:release',
  ]);
  grunt.registerTask('build:react-dom', require('./grunt/tasks/react-dom'));

  grunt.registerTask('npm:test', ['build', 'npm:pack']);

  // Optimized build task that does all of our builds. The subtasks will be run
  // in order so we can take advantage of that and only run build-modules once.
  grunt.registerTask('build', [
    // 'delete-build-modules',
    // 'build-modules',
    'version-check',
    // 'browserify:basic',
    // 'browserify:addons',
    // 'browserify:min',
    // 'browserify:addonsMin',
    'build:react-dom',
    'npm-react:release',
    'npm-react:pack',
    'npm-react-dom:release',
    'npm-react-dom:pack',
    'npm-react-addons:release',
    'npm-react-addons:pack',
    'compare_size',
  ]);

  // Automate the release!
  var releaseTasks = require('./grunt/tasks/release');
  grunt.registerTask('release:setup', releaseTasks.setup);
  grunt.registerTask('release:bower', releaseTasks.bower);
  grunt.registerTask('release:docs', releaseTasks.docs);
  grunt.registerTask('release:msg', releaseTasks.msg);
  grunt.registerTask('release:starter', releaseTasks.starter);

  grunt.registerTask('release', [
    'release:setup',
    'clean',
    'build',
    'release:bower',
    'release:starter',
    'compress',
    'release:docs',
    'release:msg',
  ]);

  // The default task - build - to keep setup easy.
  grunt.registerTask('default', ['build']);
};
