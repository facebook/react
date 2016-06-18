'use strict';

let analytics = require('./analytics');
let gulp = require('gulp');
let gzip = require('gulp-gzip');
let merge2 = require('merge2');
let path = require('path');
let Stream = require('stream');

// Keys are a text description of compressionLevel.
// Values are "gzipOptions" passed to gzip.
// We report one `analytics.bundleSize` event
// * each file in `glob`
// * each entry in `_gzipConfigs`.
const _gzipConfigs = {
  'uncompressed': null,
  'gzip level=1': {level: 1},  // code.angular.js
  'gzip level=2': {level: 2},  // github pages, most common
  'gzip level=6': {level: 6},  // default gzip level
  'gzip level=9': {level: 9}   // max gzip level
};

const _defaultOptions = {
  // @type {Object<string, number>}
  // - Key(s) must match one of `_gzipConfigs` keys.
  // - Values are the max size (in bytes) allowed for that configuration.
  failConditions: {},
  prefix: '',
  // @type {Array<string>|boolean}
  // Entries must match one of `_gzipConfigs` keys. These values will be
  // printed to the screen.
  // If this is the boolean value `true`, will print all to screen.
  printToConsole: ['gzip level=6'],
  reportAnalytics: true
};

// `glob` is a string representing a glob of files.
// options is an object containing zero or more of
// - printToConsole: Write debug to console. Default: false.
// - reportAnalytics: Report to Google Analytics. Default: true.
function reportSize(glob, options) {
  options = options || {};
  for (const key in _defaultOptions) {
    if (!options.hasOwnProperty(key)) {
      options[key] = _defaultOptions[key];
    }
  }
  var errStream = _checkConfig(options);
  if (errStream) {
    return errStream;
  }

  const allStreams = [];
  for (const compressionLevel in _gzipConfigs) {
    if (_gzipConfigs.hasOwnProperty(compressionLevel)) {
      let stream = gulp.src(glob);
      if (_gzipConfigs[compressionLevel]) {
        stream = stream.pipe(gzip({gzipOptions: _gzipConfigs[compressionLevel]}));
      }
      allStreams.push(stream.on('data', checkFileSizeFactory(compressionLevel)));
    }
  }

  let didRun = false;
  var errs = [];
  return merge2(allStreams, {end: false})
      .on('queueDrain', function() {
        if (errs.length) {
          errs.unshift(`Failed with ${errs.length} error(s).`);
          this.emit('error', new Error(errs.join('\n   ')));
        }
        if (!didRun) {
          this.emit('error', new Error(`No file found for pattern "${glob}".`));
        }
        this.emit('end');
      });

  function checkFileSizeFactory(compressionLevel) {
    return function checkFileSize(file) {
      if (file.isNull()) return;
      didRun = true;
      var filePath = path.basename(file.path).replace('\.gz', '');
      if (options.prefix) {
        filePath = path.join(options.prefix, filePath);
      }
      const fileLen = file.contents.length;
      if (options.reportAnalytics) {
        analytics.bundleSize(filePath, fileLen, compressionLevel);
      }
      if (_shouldPrint(options, compressionLevel)) {
        console.log(`  ${filePath} => ${fileLen} bytes (${compressionLevel})`)
      }
      if (options.failConditions.hasOwnProperty(compressionLevel)) {
        if (options.failConditions[compressionLevel] < fileLen) {
          errs.push(`Max size for "${compressionLevel}" is ` +
                    `${options.failConditions[compressionLevel]}, but the size is now ${fileLen}.`);
        }
      }
    }
  }
}

function _shouldPrint(options, compressionLevel) {
  const printAll = typeof options.printToConsole == 'boolean' && options.printToConsole;
  return printAll || options.printToConsole.indexOf(compressionLevel) >= 0;
}

// Returns an error stream if the fail conditions are not provided property.
// Returns `null` if everything is fine.
function _checkConfig(config) {
  for (const key in config.failConditions) {
    if (config.failConditions.hasOwnProperty(key)) {
      if (!_gzipConfigs.hasOwnProperty(key)) {
        var stream = new Stream();
        stream.emit(
            'error',
            new Error(`failCondition for "${key}" will not be tested. Check _gzipConfigs.`));
        stream.emit('end');
        return stream;
      }
    }
  }
  if (typeof config.printToConsole != 'boolean') {
    for (var i = 0; i < config.printToConsole.length; ++i) {
      const key = config.printToConsole[i];
      if (!_gzipConfigs.hasOwnProperty(key)) {
        var stream = new Stream();
        stream.emit(
            'error',
            new Error(`Incorrect value "${key}" in printToConsole. Check _gzipConfigs.`));
        stream.emit('end');
        return stream;
      }
    }
  }
  return null;
}

module.exports = reportSize;
