'use strict';

var devEngines = require('../package').devEngines;

var assert = require('assert');
var exec = require('child_process').exec;
var semver = require('semver');
var f = require('util').format;

if (devEngines.node !== undefined) {
  // First check that devEngines are valid semver
  assert(
    semver.validRange(devEngines.node),
    f('devEngines.node (%s) is not a valid semver range', devEngines.node)
  );
  // Then actually check that our version satisfies
  var nodeVersion = process.versions.node;
  assert(
    semver.satisfies(nodeVersion, devEngines.node),
    f('Current node version is not supported for development, expected "%s" to satisfy "%s".', nodeVersion, devEngines.node)
  );
}

if (devEngines.npm !== undefined) {
  // First check that devEngines are valid semver
  assert(
    semver.validRange(devEngines.npm),
    f('devEngines.npm (%s) is not a valid semver range', devEngines.npm)
  );

  // Then actually check that our version satisfies
  exec('npm --version', function(err, stdout, stderr) {
    assert(err === null, f('Failed to get npm version... %s'), stderr);

    var npmVersion = stdout.trim();
    assert(
      semver.satisfies(npmVersion, devEngines.npm),
      f('Current npm version is not supported for development, expected "%s" to satisfy "%s".', npmVersion, devEngines.npm)
    );
  });
}
