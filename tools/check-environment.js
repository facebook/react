/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
   !!!                                                                                   !!!
   !!!  This file is special in that it must be able to execute with wrong Node version  !!!
   !!!  or even when node_modules are missing.                                           !!!
   !!!                                                                                   !!!
   !!!  Do not depend on Node4+ features or presence of npm packages here.               !!!
   !!!                                                                                   !!!
   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */

'use strict';

var exec = require('child_process').exec;
var checkNodeModules;
var semver;


var issues = [];

// coarse Node version check
if (Number.parseInt(process.version[1], 10) < 5) {
  issues.push("Angular 2 build currently requires Node 5. Use nvm to update your node version.");
}

try {
  semver = require('semver');
} catch(e) {
  issues.push("Looks like you are missing some npm dependencies. Run: npm install");
}

if (issues.length) {
  printWarning(issues);
  console.error("Your environment doesn't provide the prerequisite dependencies.\n" +
                "Please fix the issues listed above and then rerun the gulp command.\n" +
                "Check out https://github.com/angular/angular/blob/master/DEVELOPER.md for more info.");
  process.exit(1);
}

// wrap in try/catch in case someone requires from within that file
try {
  checkNodeModules = require('./npm/check-node-modules.js');
} catch(e) {
  issues.push("Looks like you are missing some npm dependencies. Run: npm install");
  throw e;
} finally {
  // print warnings and move on, the next steps will likely fail, but hey, we warned them.
  printWarning(issues);
}


function checkEnvironment(reqs) {

  exec('npm --version', function(e, stdout) {
    var foundNpmVersion = semver.clean(stdout);
    var foundNodeVersion = process.version;
    var issues = [];


    if (!semver.satisfies(foundNodeVersion, reqs.requiredNodeVersion)) {
      issues.push('You are running unsupported node version. Found: ' + foundNodeVersion +
        ' Expected: ' + reqs.requiredNodeVersion + '. Use nvm to update your node version.');
    }

    if (!semver.satisfies(foundNpmVersion, reqs.requiredNpmVersion)) {
      issues.push('You are running unsupported npm version. Found: ' + foundNpmVersion +
        ' Expected: ' + reqs.requiredNpmVersion + '. Run: npm update -g npm');
    }

    if (!checkNodeModules()) {
      issues.push('Your node_modules directory is stale or out of sync with npm-shrinkwrap.json. Run: npm install');
    }

    printWarning(issues);
  });
}

function printWarning(issues) {
  if (!issues.length) return;

  console.warn('');
  console.warn(Array(110).join('!'));
  console.warn('!!!  Your environment is not in a good shape. Following issues were found:');
  issues.forEach(function(issue) {console.warn('!!!   - ' + issue);});
  console.warn(Array(110).join('!'));
  console.warn('');

  if (process.env.CI) {
    process.exit(1);
  }
}


module.exports = checkEnvironment;
