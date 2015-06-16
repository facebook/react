'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsx: require('./grunt/config/jsx'),
    browserify: require('./grunt/config/browserify'),
    populist: require('./grunt/config/populist')(grunt),
    connect: require('./grunt/config/server')(grunt),
    'webdriver-jasmine': require('./grunt/config/webdriver-jasmine'),
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

  grunt.registerTask(
    'download-previous-version',
    require('./grunt/tasks/download-previous-version.js')
  );

  grunt.registerTask('delete-build-modules', function() {
    if (grunt.file.exists('build/modules')) {
      grunt.file.delete('build/modules');
    }
  });

  // Register jsx:normal and :release tasks.
  grunt.registerMultiTask('jsx', require('./grunt/tasks/jsx'));

  // Our own browserify-based tasks to build a single JS file build.
  grunt.registerMultiTask('browserify', require('./grunt/tasks/browserify'));

  grunt.registerMultiTask('populist', require('./grunt/tasks/populist'));

  grunt.registerTask('sauce-tunnel', require('./grunt/tasks/sauce-tunnel'));

  grunt.registerMultiTask('webdriver-jasmine', require('./grunt/tasks/webdriver-jasmine'));

  grunt.registerMultiTask('npm', require('./grunt/tasks/npm'));

  var npmReactTasks = require('./grunt/tasks/npm-react');
  grunt.registerTask('npm-react:release', npmReactTasks.buildRelease);
  grunt.registerTask('npm-react:pack', npmReactTasks.packRelease);

  var npmReactToolsTasks = require('./grunt/tasks/npm-react-tools');
  grunt.registerTask('npm-react-tools:release', npmReactToolsTasks.buildRelease);
  grunt.registerTask('npm-react-tools:pack', npmReactToolsTasks.packRelease);

  var npmReactDOMTasks = require('./grunt/tasks/npm-react-dom');
  grunt.registerTask('npm-react-dom:pack', npmReactDOMTasks.packRelease);

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
  grunt.registerTask('build:withCodeCoverageLogging', [
    'jsx:normal',
    'version-check',
    'browserify:withCodeCoverageLogging',
  ]);
  grunt.registerTask('build:test', [
    'delete-build-modules',
    'test:eslint-rules',
    'jsx:test',
    'version-check',
    'populist:test',
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

  grunt.registerTask('webdriver-phantomjs', require('./grunt/tasks/webdriver-phantomjs'));

  grunt.registerTask('coverage:parse', require('./grunt/tasks/coverage-parse'));

  grunt.registerTask('test:eslint-rules', require('./grunt/tasks/test-eslint-rules'));

  grunt.registerTask('test:webdriver:phantomjs', [
    'connect',
    'webdriver-phantomjs',
    'webdriver-jasmine:local',
  ]);

  grunt.registerTask('test:full', [
    'build:test',
    'build:basic',

    'connect',
    'webdriver-phantomjs',
    'webdriver-jasmine:local',

    'sauce-tunnel',
    'webdriver-jasmine:saucelabs_android',
    'webdriver-jasmine:saucelabs_firefox',
    'webdriver-jasmine:saucelabs_chrome',
  ]);

  grunt.registerTask('test:webdriver:saucelabs', [
    'build:test',
    'build:basic',

    'connect',
    'sauce-tunnel',
    'webdriver-jasmine:saucelabs_' + (process.env.BROWSER_NAME || 'ie8'),
  ]);

  grunt.registerTask('test:webdriver:saucelabs:modern', [
    'build:test',
    'build:basic',

    'connect',
    'sauce-tunnel',
    'webdriver-jasmine:saucelabs_android',
    'webdriver-jasmine:saucelabs_firefox',
    'webdriver-jasmine:saucelabs_chrome',
    'webdriver-jasmine:saucelabs_ie11',
  ]);

  grunt.registerTask('test:webdriver:saucelabs:ie', [
    'build:test',
    'build:basic',

    'connect',
    'sauce-tunnel',
    'webdriver-jasmine:saucelabs_ie8',
    'webdriver-jasmine:saucelabs_ie9',
    'webdriver-jasmine:saucelabs_ie10',
    'webdriver-jasmine:saucelabs_ie11',
  ]);

  grunt.registerTask('test:webdriver:saucelabs:ios', [
    'build:test',
    'build:basic',

    'connect',
    'sauce-tunnel',
    'webdriver-jasmine:saucelabs_ios6_1',
    'webdriver-jasmine:saucelabs_ios5_1',
    'webdriver-jasmine:saucelabs_ios4',
  ]);

  grunt.registerTask('test:coverage', [
    'build:withCodeCoverageLogging',
    'test:webdriver:phantomjs',
    'coverage:parse',
  ]);
  grunt.registerTask('fasttest', function() {
    grunt.task.run('test');
  });
  grunt.registerTask('test', function() {
    if (grunt.option('debug')) {
      grunt.task.run('build:test', 'connect:server:keepalive');
    } else {
      grunt.task.run('build:test', 'test:webdriver:phantomjs');
    }
  });
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
