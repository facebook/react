'use strict';

var assert = require("assert");
var grunt = require("grunt");
var spawn = grunt.util.spawn;
var semver = require("semver");
var MIN_VERSION = "1.9.0";
var phantomjs = require("phantomjs").path;

function checkVersion(error, result, code) {
  if (error) {
    throw error;
  }
  assert.strictEqual(code, 0);

  var version = result.stdout;

  assert.ok(
    semver.valid(version),
    "Invalid PhantomJS version: " + version
  );

  assert.ok(
    semver.gte(version, MIN_VERSION),
    "PhantomJS v" + version + " too old; need to install " +
      "v" + MIN_VERSION + " or higher."
  );
}

function run(config, done) {
  var args = [
    config.harness,
    "--port", config.port
  ];

  if (config.debug) {
    args.push("--debug");
  }

  args.push("--tests");
  var tests = grunt.file.expand({
    nonull: true,
    cwd: "src"
  }, config.tests || []).forEach(function(file) {
    args.push(file.replace(/\.js$/i, ""));
  });

  var child = spawn({
    cmd: phantomjs,
    args: args
  }, done);

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
}

module.exports = function() {
  var config = this.data;
  var done = this.async();

  spawn({
    cmd: phantomjs,
    args: ["--version"]
  }, function(error, result, code) {
    checkVersion(error, result, code);
    run(config, done);
  });
};
