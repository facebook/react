#!/usr/bin/env node

/**
 * this script is just a temporary solution to deal with the issue of npm outputting the npm
 * shrinkwrap file in an unstable manner.
 *
 * See: https://github.com/npm/npm/issues/3581
 */

var _ = require('lodash');
var sorted = require('sorted-object');
var fs = require('fs');
var path = require('path');


function cleanModule(moduleRecord, name) {

  // keep `resolve` properties for git dependencies, delete otherwise
  delete moduleRecord.from;
  if (!(moduleRecord.resolved && moduleRecord.resolved.match(/^git(\+[a-z]+)?:\/\//))) {
    delete moduleRecord.resolved;
  }

  _.forEach(moduleRecord.dependencies, function(mod, name) {
    cleanModule(mod, name);
  });
}


//console.log('Reading npm-shrinkwrap.json');
var shrinkwrap = require('../../npm-shrinkwrap.json');

//console.log('Cleaning shrinkwrap object');
cleanModule(shrinkwrap, shrinkwrap.name);

var cleanShrinkwrapPath = path.join(__dirname, '..', '..', 'npm-shrinkwrap.clean.json');
console.log('writing npm-shrinkwrap.clean.json');
fs.writeFileSync(cleanShrinkwrapPath, JSON.stringify(sorted(shrinkwrap), null, 2) + "\n");
