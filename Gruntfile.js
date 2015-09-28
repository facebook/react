'use strict';

var assign = require('object-assign');
var path = require('path');

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

  function spawnGulp(args, opts, done) {
    grunt.util.spawn({
      // This could be more flexible (require.resolve & lookup bin in package)
      // but if it breaks we'll fix it then.
      cmd: path.join('node_modules', '.bin', 'gulp'),
      args: args,
      opts: assign({stdio: 'inherit'}, opts),
    }, function(err, result, code) {
      if (err) {
        grunt.fail.fatal('Something went wrong running gulp: ', result);
      }
      done(code === 0);
    });
  }

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
    // Use gulp here.
    spawnGulp(['react:clean'], null, this.async());
  });

  // Register jsx:normal and :release tasks.
  grunt.registerMultiTask('jsx', require('./grunt/tasks/jsx'));

  // Our own browserify-based tasks to build a single JS file build.
  grunt.registerMultiTask('browserify', require('./grunt/tasks/browserify'));

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
    'build-modules',
    'version-check',
    'browserify:basic',
  ]);
  grunt.registerTask('build:addons', [
    'build-modules',
    'browserify:addons',
  ]);
  grunt.registerTask('build:min', [
    'build-modules',
    'version-check',
    'browserify:min',
  ]);
  grunt.registerTask('build:addons-min', [
    'build-modules',
    'browserify:addonsMin',
  ]);
  grunt.registerTask('build:npm-react', [
    'version-check',
    'build-modules',
    'npm-react:release',
  ]);
  grunt.registerTask('build:react-dom', require('./grunt/tasks/react-dom'));

  grunt.registerTask('test', ['jest']);
  grunt.registerTask('npm:test', ['build', 'npm:pack']);

  grunt.registerTask('jest', require('./grunt/tasks/jest'));

  // Optimized build task that does all of our builds. The subtasks will be run
  // in order so we can take advantage of that and only run build-modules once.
  grunt.registerTask('build', [
    'delete-build-modules',
    'build-modules',
    'version-check',
    'browserify:basic',
    'browserify:addons',
    'browserify:min',
    'browserify:addonsMin',
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

  grunt.registerTask('build-modules', function() {
    spawnGulp(['react:modules'], null, this.async());
  });

  // The default task - build - to keep setup easy.
  grunt.registerTask('default', ['build']);
};
