'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsx: require('./grunt/config/jsx'),
    browserify: require('./grunt/config/browserify'),
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

  Object.keys(grunt.file.readJSON('package.json').devDependencies)
    .filter(function(npmTaskName) {
      return npmTaskName.indexOf('grunt-') === 0;
    })
    .filter(function(npmTaskName) {
      return npmTaskName !== 'grunt-cli';
    })
    .forEach(function(npmTaskName) {
      grunt.loadNpmTasks(npmTaskName);
    });

  grunt.registerTask('eslint', require('./grunt/tasks/eslint'));

  grunt.registerTask('lint', ['eslint']);

  grunt.registerTask('delete-build-modules', function() {
    if (grunt.file.exists('build/modules')) {
      grunt.file.delete('build/modules');
    }
  });

  // Register jsx:normal and :release tasks.
  grunt.registerMultiTask('jsx', require('./grunt/tasks/jsx'));

  // Our own browserify-based tasks to build a single JS file build.
  grunt.registerMultiTask('browserify', require('./grunt/tasks/browserify'));

  grunt.registerMultiTask('npm', require('./grunt/tasks/npm'));

  var npmReactTasks = require('./grunt/tasks/npm-react');
  grunt.registerTask('npm-react:release', npmReactTasks.buildRelease);
  grunt.registerTask('npm-react:pack', npmReactTasks.packRelease);

  var npmReactToolsTasks = require('./grunt/tasks/npm-react-tools');
  grunt.registerTask('npm-react-tools:release', npmReactToolsTasks.buildRelease);
  grunt.registerTask('npm-react-tools:pack', npmReactToolsTasks.packRelease);

  var npmReactDOMTasks = require('./grunt/tasks/npm-react-dom');
  grunt.registerTask('npm-react-dom:pack', npmReactDOMTasks.packRelease);

  var npmReactAddonsTasks = require('./grunt/tasks/npm-react-addons');
  grunt.registerTask('npm-react-addons:release', npmReactAddonsTasks.buildReleases);
  grunt.registerTask('npm-react-addons:pack', npmReactAddonsTasks.packReleases);

  var gemReactSourceTasks = require('./grunt/tasks/gem-react-source');
  grunt.registerTask('gem-react-source:release', gemReactSourceTasks.buildRelease);
  grunt.registerTask('gem-react-source:pack', gemReactSourceTasks.packRelease);

  grunt.registerTask('version-check', require('./grunt/tasks/version-check'));

  grunt.registerTask('build:basic', [
    'jsx:normal',
    'version-check',
    'browserify:basic',
  ]);
  grunt.registerTask('build:addons', [
    'jsx:normal',
    'browserify:addons',
  ]);
  grunt.registerTask('build:transformer', [
    'jsx:normal',
    'browserify:transformer',
  ]);
  grunt.registerTask('build:min', [
    'jsx:normal',
    'version-check',
    'browserify:min',
  ]);
  grunt.registerTask('build:addons-min', [
    'jsx:normal',
    'browserify:addonsMin',
  ]);
  grunt.registerTask('build:npm-react', [
    'version-check',
    'jsx:normal',
    'npm-react:release',
  ]);
  grunt.registerTask('build:gem-react-source', [
    'build',
    'gem-react-source:release',
  ]);

  grunt.registerTask('fasttest', function() {
    grunt.task.run('test');
  });
  grunt.registerTask('test', ['jest']);
  grunt.registerTask('npm:test', ['build', 'npm:pack']);

  // Optimized build task that does all of our builds. The subtasks will be run
  // in order so we can take advantage of that and only run jsx:normal once.
  grunt.registerTask('build', [
    'delete-build-modules',
    'jsx:normal',
    'version-check',
    'browserify:basic',
    'browserify:transformer',
    'browserify:addons',
    'browserify:min',
    'browserify:addonsMin',
    'npm-react:release',
    'npm-react:pack',
    'npm-react-tools:release',
    'npm-react-tools:pack',
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
    'gem-react-source:release',
    'gem-react-source:pack',
    'release:bower',
    'release:starter',
    'compress',
    'release:docs',
    'release:msg',
  ]);

  // The default task - build - to keep setup easy.
  grunt.registerTask('default', ['build']);
};
