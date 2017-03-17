'use strict';

var path = require('path');

var GULP_EXE = 'gulp';
if (process.platform === 'win32') {
  GULP_EXE += '.cmd';
}

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: require('./grunt/config/browserify'),
    npm: require('./grunt/config/npm'),
    clean: [
      './build',
      './*.gem',
      './docs/_site',
      './examples/shared/*.js',
      '.module-cache',
    ],
    'compare_size': require('./grunt/config/compare_size'),
  });

  function spawnGulp(args, opts, done) {

    grunt.util.spawn({
      // This could be more flexible (require.resolve & lookup bin in package)
      // but if it breaks we'll fix it then.
      cmd: path.join('node_modules', '.bin', GULP_EXE),
      args: args,
      opts: Object.assign({stdio: 'inherit'}, opts),
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

  grunt.registerTask('eslint', function() {
    // Use gulp here.
    spawnGulp(['eslint'], null, this.async());
  });

  grunt.registerTask('lint', ['eslint']);

  grunt.registerTask('flow', function() {
    // Use gulp here.
    spawnGulp(['flow'], null, this.async());
  });

  grunt.registerTask('delete-build-modules', function() {
    // Use gulp here.
    spawnGulp(['react:clean'], null, this.async());
  });

  // Our own browserify-based tasks to build a single JS file build.
  grunt.registerMultiTask('browserify', require('./grunt/tasks/browserify'));

  grunt.registerMultiTask('npm', require('./grunt/tasks/npm'));

  var npmReactTasks = require('./grunt/tasks/npm-react');
  grunt.registerTask('npm-react:release', npmReactTasks.buildRelease);
  grunt.registerTask('npm-react:pack', npmReactTasks.packRelease);

  var npmReactDOMTasks = require('./grunt/tasks/npm-react-dom');
  grunt.registerTask('npm-react-dom:release', npmReactDOMTasks.buildRelease);
  grunt.registerTask('npm-react-dom:pack', npmReactDOMTasks.packRelease);

  var npmReactNativeTasks = require('./grunt/tasks/npm-react-native');
  grunt.registerTask('npm-react-native:release', npmReactNativeTasks.buildRelease);
  grunt.registerTask('npm-react-native:pack', npmReactNativeTasks.packRelease);

  var npmReactTestRendererTasks = require('./grunt/tasks/npm-react-test');
  grunt.registerTask('npm-react-test:release', npmReactTestRendererTasks.buildRelease);
  grunt.registerTask('npm-react-test:pack', npmReactTestRendererTasks.packRelease);

  var npmReactNoopRendererTasks = require('./grunt/tasks/npm-react-noop');
  grunt.registerTask('npm-react-noop:release', npmReactNoopRendererTasks.buildRelease);
  grunt.registerTask('npm-react-noop:pack', npmReactNoopRendererTasks.packRelease);

  grunt.registerTask('version-check', function() {
    // Use gulp here.
    spawnGulp(['version-check'], null, this.async());
  });

  grunt.registerTask('build:basic', [
    'build-modules',
    'version-check',
    'browserify:basic',
  ]);
  grunt.registerTask('build:min', [
    'build-modules',
    'version-check',
    'browserify:min',
  ]);
  grunt.registerTask('build:dom', [
    'build-modules',
    'version-check',
    'browserify:dom',
  ]);
  grunt.registerTask('build:dom-min', [
    'build-modules',
    'version-check',
    'browserify:domMin',
  ]);
  grunt.registerTask('build:dom-server', [
    'build-modules',
    'version-check',
    'browserify:domServer',
  ]);
  grunt.registerTask('build:dom-server-min', [
    'build-modules',
    'version-check',
    'browserify:domServerMin',
  ]);
  grunt.registerTask('build:dom-fiber', [
    'build-modules',
    'version-check',
    'browserify:domFiber',
  ]);
  grunt.registerTask('build:dom-fiber-min', [
    'build-modules',
    'version-check',
    'browserify:domFiberMin',
  ]);
  grunt.registerTask('build:npm-react', [
    'version-check',
    'build-modules',
    'npm-react:release',
  ]);

  var jestTasks = require('./grunt/tasks/jest');
  grunt.registerTask('jest:normal', jestTasks.normal);
  grunt.registerTask('jest:coverage', jestTasks.coverage);

  grunt.registerTask('test', ['jest:normal']);
  grunt.registerTask('npm:test', ['build', 'npm:pack']);

  // Optimized build task that does all of our builds. The subtasks will be run
  // in order so we can take advantage of that and only run build-modules once.
  grunt.registerTask('build', [
    'delete-build-modules',
    'build-modules',
    'version-check',
    'browserify:basic',
    'browserify:min',
    'browserify:dom',
    'browserify:domMin',
    'browserify:domServer',
    'browserify:domServerMin',
    'browserify:domFiber',
    'browserify:domFiberMin',
    'npm-react:release',
    'npm-react:pack',
    'npm-react-dom:release',
    'npm-react-dom:pack',
    'npm-react-native:release',
    'npm-react-native:pack',
    'npm-react-test:release',
    'npm-react-test:pack',
    'npm-react-noop:release',
    'npm-react-noop:pack',
    'compare_size',
  ]);

  // Automate the release!
  var releaseTasks = require('./grunt/tasks/release');
  grunt.registerTask('release:setup', releaseTasks.setup);
  grunt.registerTask('release:bower', releaseTasks.bower);
  grunt.registerTask('release:docs', releaseTasks.docs);
  grunt.registerTask('release:msg', releaseTasks.msg);

  grunt.registerTask('release', [
    'release:setup',
    'clean',
    'build',
    'release:bower',
    'release:docs',
    'release:msg',
  ]);

  grunt.registerTask('build-modules', function() {
    spawnGulp(['react:modules'], null, this.async());
  });

  // The default task - build - to keep setup easy.
  grunt.registerTask('default', ['build']);
};
