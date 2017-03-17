'use strict';

var grunt = require('grunt');

var BOWER_PATH = '../react-bower/';
var BOWER_GLOB = [BOWER_PATH + '*.{js}'];
var BOWER_FILES = [
  'react.js',
  'react.min.js',
  'react-dom.js',
  'react-dom.min.js',
  'react-dom-server.js',
  'react-dom-server.min.js',
];

var VERSION;
var VERSION_STRING;

function _gitCommitAndTag(cwd, commitMsg, tag, cb) {
  // `git add *` to make sure we catch untracked files
  // `git add -u` to make sure we remove deleted files
  // `git commit -m {commitMsg}`
  // `git tag -a {tag}`
  var opts = {cwd: cwd};
  var gitAddAll = {
    cmd: 'git',
    args: ['add', '*'],
    opts: opts,
  };
  var gitAddDel = {
    cmd: 'git',
    args: ['add', '-u'],
    opts: opts,
  };
  var gitCommit = {
    cmd: 'git',
    args: ['commit', '-m', commitMsg],
    opts: opts,
  };
  var gitTag = {
    cmd: 'git',
    args: ['tag', tag],
    opts: opts,
  };
  grunt.util.spawn(gitAddAll, function() {
    grunt.util.spawn(gitAddDel, function() {
      grunt.util.spawn(gitCommit, function() {
        if (tag) {
          grunt.util.spawn(gitTag, cb);
        } else {
          cb();
        }
      });
    });
  });
}

function setup() {
  if (!grunt.file.exists(BOWER_PATH)) {
    grunt.log.error('Make sure you have the react-bower repository checked ' +
                    'out at ../react-bower');
    return false;
  }

  VERSION = grunt.config.data.pkg.version;
  VERSION_STRING = 'v' + VERSION;
}

function bower() {
  var done = this.async();

  // clean out the bower folder in case we're removing files
  var files = grunt.file.expand(BOWER_GLOB);
  files.forEach(function(file) {
    grunt.file.delete(file, {force: true});
  });

  // Now copy over build files
  BOWER_FILES.forEach(function(file) {
    grunt.file.copy('build/' + file, BOWER_PATH + file);
  });

  // Commit and tag the repo
  _gitCommitAndTag(BOWER_PATH, VERSION_STRING, VERSION_STRING, done);
}

function docs() {
  grunt.file.copy('build/react.js', 'docs/js/react.js');
  grunt.file.copy('build/react-dom.js', 'docs/js/react-dom.js');
}

function msg() {
  // Just output a friendly reminder message for the rest of the process
  grunt.log.subhead('Release *almost* complete...');
  var steps = [
    'Still todo:',
    '* push this repo with tags',
    '* push bower repo with tags',
    '* run `npm-publish` in rrm',
    '* create release on github',
    '* for a major release, update docs branch variable in Travis CI',
    '* announce it on FB/Twitter/mailing list',
  ];
  steps.forEach(function(ln) {
    grunt.log.writeln(ln);
  });
}


module.exports = {
  setup: setup,
  bower: bower,
  docs: docs,
  msg: msg,
};
