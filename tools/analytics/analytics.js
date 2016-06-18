'use strict';

let execSync = require('child_process').execSync;
let fs = require('fs');

let minimist;
try {
  minimist = require('minimist');
} catch (e) {
  minimist = function(){ return {projects: ""}; };
}

let path = require('path');
let os = require('os');
let ua;

try {
  ua = require('universal-analytics');
} catch(e) {
  // ignore errors due to invoking analytics before the first npm install
}

const analyticsFile = path.resolve(path.join(__dirname, '..', '..', '.build-analytics'));
const analyticsId = "UA-8594346-17"; // Owned by the Angular account
const analyticsOptions = {
  https: true,
  debug: false
};

let cid = fs.existsSync(analyticsFile) ? fs.readFileSync(analyticsFile, 'utf-8') : null;
let visitor;

if (ua) {
  if (cid) {
    visitor = ua(analyticsId, cid, analyticsOptions);
  } else {
    visitor = ua(analyticsId, analyticsOptions);
    cid = visitor.cid;
    fs.writeFileSync(analyticsFile, cid, 'utf-8');
  }
}

// https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
let customParams = {
  // OS Platform (darwin, win32, linux)
  cd1: os.platform(),
  // Node.js Version (v4.1.2)
  cd2: process.version,
  // npm Version (2.14.7)
  cd10: getNpmVersion(),
  // TypeScript Version (1.6.2)
  cd3: getTypeScriptVersion(),
  // Dart Version
  cd11: getDartVersion(),
  // Dev Environment
  cd4: process.env.TRAVIS ? 'Travis CI' : 'Local Dev',
  // Travis - Pull Request?
  cd5: (process.env.TRAVIS_PULL_REQUEST == 'true') ? 'true' : 'false',
  // Travis - Branch Name (master)
  cd6: process.env.TRAVIS_BRANCH,
  // Travis - Repo Slug  (angular/angular)
  cd7: process.env.TRAVIS_REPO_SLUG,
  // Travis - Job ID (1, 2, 3, 4, ...)
  cd12: process.env.TRAVIS_JOB_NUMBER ? process.env.TRAVIS_JOB_NUMBER.split('.')[1] : undefined,
  // HW - CPU Info
  cd8: `${os.cpus().length} x ${os.cpus()[0].model}`,
  // HW - Memory Info
  cd9: `${Math.round(os.totalmem()/1024/1024/1024)}GB`,
  // gulp --projects (angular2)
  cd13: minimist(process.argv.slice(2)).projects
};



function getTypeScriptVersion() {
  try {
    return require('typescript').version;
  } catch (e) {
    return 'unknown';
  }
}


function getNpmVersion() {
  try {
    return execSync('npm -v').toString().replace(/\s/, '');
  } catch (e) {
    return 'unknown';
  }
}


function getDartVersion() {
  try {
    return execSync('dart --version 2>&1').toString().replace(/.+: (\S+) [\s\S]+/, '$1')
  } catch (e) {
    return 'unknown';
  }
}


function recordEvent(eventType, actionCategory, actionName, duration, label) {
  // if universal-analytics is not yet installed, don't bother doing anything (e.g. when tracking initial npm install)
  // build-analytics will however store the starting timestamp, so at least we can record the success/error event with duration
  if (!ua) return;

  if (duration) {
    duration = Math.round(duration);
  }

  switch (eventType) {
    case 'start':
      visitor.
        event(actionCategory, actionName + ' (start)', label, null, customParams).
        send();
      break;
    case 'success':
      visitor.
        event(actionCategory, actionName, label, duration, customParams).
        timing(actionCategory, actionName, duration, label, customParams).
        send();
      break;
    case 'error':
      visitor.
        event(actionCategory, actionName + ' (errored)', label, duration, customParams).
        timing(actionCategory, actionName, duration, label, customParams).
        send();
      break;
    default:
      throw new Error(`unknown event type "${eventType}"`);
  }
}


module.exports = {

  installStart: (actionName) => {
    recordEvent('start', 'install', actionName);
  },

  installSuccess: (actionName, duration) => {
    recordEvent('success', 'install', actionName, duration);
  },

  installError: (actionName, duration) => {
    recordEvent('error', 'install', actionName, duration);
  },

  buildStart: (actionName) => {
    recordEvent('start', 'build', actionName);
  },

  buildSuccess: (actionName, duration) => {
    recordEvent('success', 'build', actionName, duration);
  },

  buildError: (actionName, duration) => {
    recordEvent('error', 'build', actionName, duration);
  },

  ciStart: (actionName) => {
    recordEvent('start', 'ci', actionName);
  },

  ciSuccess: (actionName, duration) => {
    recordEvent('success', 'ci', actionName, duration);
  },

  ciError: (actionName, duration) => {
    recordEvent('error', 'ci', actionName, duration);
  },

  bundleSize: (filePath, sizeInBytes, compressionLevel) => {
    recordEvent('success', 'payload', compressionLevel, sizeInBytes, filePath);
  }
};
