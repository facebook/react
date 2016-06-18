"use strict";

var fs = require('fs');
var path = require('path');

var NPM_SHRINKWRAP_FILE = 'npm-shrinkwrap.json';
var NPM_SHRINKWRAP_CACHED_FILE = 'node_modules/.npm-shrinkwrap.cached.json';
var FS_OPTS = {encoding: 'utf-8'};
var PROJECT_ROOT = path.join(__dirname, '../../');


function checkNodeModules(logOutput, purgeIfStale) {
  var nodeModulesOK = _checkCache(NPM_SHRINKWRAP_FILE, NPM_SHRINKWRAP_CACHED_FILE);

  if (nodeModulesOK) {
    if (logOutput) console.log(':-) npm dependencies are looking good!');
  } else {
    if (logOutput) console.error(':-( npm dependencies are stale or in an in unknown state!');
    if (purgeIfStale) {
      if (logOutput) console.log('    purging...');
      _deleteDir(path.join(PROJECT_ROOT, 'node_modules'));
    }
  }

  return nodeModulesOK;
}


function _checkCache(markerFile, cacheMarkerFile) {
  var absoluteMarkerFilePath = path.join(PROJECT_ROOT, markerFile);
  var absoluteCacheMarkerFilePath = path.join(PROJECT_ROOT, cacheMarkerFile);


  if (!fs.existsSync(absoluteCacheMarkerFilePath)) return false;

  var markerContent = fs.readFileSync(absoluteMarkerFilePath, FS_OPTS);
  var cacheMarkerContent = fs.readFileSync(absoluteCacheMarkerFilePath, FS_OPTS);

  return markerContent == cacheMarkerContent;
}


/**
 * Custom implementation of recursive `rm` because we can't rely on the state of node_modules to
 * pull in existing module.
 */
function _deleteDir(path) {
  if( fs.existsSync(path) ) {
    var subpaths = fs.readdirSync(path);
    subpaths.forEach(function(subpath) {
      var curPath = path + "/" + subpath;
      if(fs.lstatSync(curPath).isDirectory()) {
        _deleteDir(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}


module.exports = checkNodeModules;
