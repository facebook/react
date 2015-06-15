/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var colors = require('./colors');
var fs = require('graceful-fs');
var path = require('path');
var Q = require('q');

var DEFAULT_CONFIG_VALUES = {
  cacheDirectory: path.resolve(__dirname, '..', '..', '.haste_cache'),
  coverageCollector: require.resolve('../IstanbulCollector'),
  globals: {},
  moduleFileExtensions: ['js', 'json'],
  moduleLoader: require.resolve('../HasteModuleLoader/HasteModuleLoader'),
  preprocessorIgnorePatterns: [],
  modulePathIgnorePatterns: [],
  testDirectoryName: '__tests__',
  testEnvironment: require.resolve('../JSDomEnvironment'),
  testEnvData: {},
  testFileExtensions: ['js'],
  testPathDirs: ['<rootDir>'],
  testPathIgnorePatterns: ['/node_modules/'],
  testReporter: require.resolve('../IstanbulTestReporter'),
  testRunner: require.resolve('../jasmineTestRunner/jasmineTestRunner'),
  noHighlight: false,
};

function _replaceRootDirTags(rootDir, config) {
  switch (typeof config) {
    case 'object':
      if (config instanceof RegExp) {
        return config;
      }

      if (Array.isArray(config)) {
        return config.map(function(item) {
          return _replaceRootDirTags(rootDir, item);
        });
      }

      if (config !== null) {
        var newConfig = {};
        for (var configKey in config) {
          newConfig[configKey] =
            configKey === 'rootDir'
            ? config[configKey]
            : _replaceRootDirTags(rootDir, config[configKey]);
        }
        return newConfig;
      }
      break;
    case 'string':
      if (!/^<rootDir>/.test(config)) {
        return config;
      }

      return pathNormalize(path.resolve(
        rootDir,
        './' + path.normalize(config.substr('<rootDir>'.length))
      ));
  }
  return config;
}

function escapeStrForRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Given the coverage info for a single file (as output by
 * CoverageCollector.js), return an array whose entries are bools indicating
 * whether anything on the line could have been covered and was, or null if the
 * line wasn't measurable (like empty lines, declaration keywords, etc).
 *
 * For example, for the following coverage info:
 *
 * COVERED:     var a = [];
 * NO CODE:
 * COVERED:     for (var i = 0; i < a.length; i++)
 * NOT COVERED:   console.log('hai!');
 *
 * You'd get an array that looks like this:
 *
 * [true, null, true, false]
 */
function getLineCoverageFromCoverageInfo(coverageInfo) {
  var coveredLines = {};
  coverageInfo.coveredSpans.forEach(function(coveredSpan) {
    var startLine = coveredSpan.start.line;
    var endLine = coveredSpan.end.line;
    for (var i = startLine - 1; i < endLine; i++) {
      coveredLines[i] = true;
    }
  });

  var uncoveredLines = {};
  coverageInfo.uncoveredSpans.forEach(function(uncoveredSpan) {
    var startLine = uncoveredSpan.start.line;
    var endLine = uncoveredSpan.end.line;
    for (var i = startLine - 1; i < endLine; i++) {
      uncoveredLines[i] = true;
    }
  });

  var sourceLines = coverageInfo.sourceText.trim().split('\n');

  return sourceLines.map(function(line, lineIndex) {
    if (uncoveredLines[lineIndex] === true) {
      return false;
    } else if (coveredLines[lineIndex] === true) {
      return true;
    } else {
      return null;
    }
  });
}

/**
 * Given the coverage info for a single file (as output by
 * CoverageCollector.js), return the decimal percentage of lines in the file
 * that had any coverage info.
 *
 * For example, for the following coverage info:
 *
 * COVERED:     var a = [];
 * NO CODE:
 * COVERED:     for (var i = 0; i < a.length; i++)
 * NOT COVERED:   console.log('hai');
 *
 * You'd get: 2/3 = 0.666666
 */
function getLinePercentCoverageFromCoverageInfo(coverageInfo) {
  var lineCoverage = getLineCoverageFromCoverageInfo(coverageInfo);
  var numMeasuredLines = 0;
  var numCoveredLines = lineCoverage.reduce(function(counter, lineIsCovered) {
    if (lineIsCovered !== null) {
      numMeasuredLines++;
      if (lineIsCovered === true) {
        counter++;
      }
    }
    return counter;
  }, 0);

  return numCoveredLines / numMeasuredLines;
}

function normalizeConfig(config) {
  var newConfig = {};

  // Assert that there *is* a rootDir
  if (!config.hasOwnProperty('rootDir')) {
    throw new Error('No rootDir config value found!');
  }

  config.rootDir = pathNormalize(config.rootDir);

  // Normalize user-supplied config options
  Object.keys(config).reduce(function(newConfig, key) {
    var value;
    switch (key) {
      case 'collectCoverageOnlyFrom':
        value = Object.keys(config[key]).reduce(function(normObj, filePath) {
          filePath = pathNormalize(path.resolve(
            config.rootDir,
            _replaceRootDirTags(config.rootDir, filePath)
          ));
          normObj[filePath] = true;
          return normObj;
        }, {});
        break;

      case 'testPathDirs':
        value = config[key].map(function(scanDir) {
          return pathNormalize(path.resolve(
            config.rootDir,
            _replaceRootDirTags(config.rootDir, scanDir)
          ));
        });
        break;

      case 'cacheDirectory':
      case 'scriptPreprocessor':
      case 'setupEnvScriptFile':
      case 'setupTestFrameworkScriptFile':
        value = pathNormalize(path.resolve(
          config.rootDir,
          _replaceRootDirTags(config.rootDir, config[key])
        ));
        break;

      case 'preprocessorIgnorePatterns':
      case 'testPathIgnorePatterns':
      case 'modulePathIgnorePatterns':
      case 'unmockedModulePathPatterns':
        // _replaceRootDirTags is specifically well-suited for substituting
        // <rootDir> in paths (it deals with properly interpreting relative path
        // separators, etc).
        //
        // For patterns, direct global substitution is far more ideal, so we
        // special case substitutions for patterns here.
        value = config[key].map(function(pattern) {
          return pattern.replace(/<rootDir>/g, config.rootDir);
        });
        break;

      case 'collectCoverage':
      case 'coverageCollector':
      case 'globals':
      case 'moduleLoader':
      case 'name':
      case 'persistModuleRegistryBetweenSpecs':
      case 'rootDir':
      case 'setupJSLoaderOptions':
      case 'setupJSTestLoaderOptions':
      case 'setupJSMockLoaderOptions':
      case 'testDirectoryName':
      case 'testEnvData':
      case 'testFileExtensions':
      case 'testReporter':
      case 'moduleFileExtensions':
      case 'noHighlight':
        value = config[key];
        break;

      default:
        throw new Error('Unknown config option: ' + key);
    }
    newConfig[key] = value;
    return newConfig;
  }, newConfig);

  // If any config entries weren't specified but have default values, apply the
  // default values
  Object.keys(DEFAULT_CONFIG_VALUES).reduce(function(newConfig, key) {
    if (!newConfig[key]) {
      newConfig[key] = DEFAULT_CONFIG_VALUES[key];
    }
    return newConfig;
  }, newConfig);

  // Fill in some default values for node-haste config
  newConfig.setupJSLoaderOptions = newConfig.setupJSLoaderOptions || {};
  newConfig.setupJSTestLoaderOptions = newConfig.setupJSTestLoaderOptions || {};
  newConfig.setupJSMockLoaderOptions = newConfig.setupJSMockLoaderOptions || {};

  if (!newConfig.setupJSTestLoaderOptions.extensions) {
    newConfig.setupJSTestLoaderOptions.extensions =
      newConfig.testFileExtensions.map(_addDot);
  }

  if (!newConfig.setupJSLoaderOptions.extensions) {
    newConfig.setupJSLoaderOptions.extensions = uniqueStrings(
      newConfig.moduleFileExtensions.map(_addDot).concat(
        newConfig.setupJSTestLoaderOptions.extensions
      )
    );
  }

  if (!newConfig.setupJSMockLoaderOptions.extensions) {
    newConfig.setupJSMockLoaderOptions.extensions =
      newConfig.setupJSLoaderOptions.extensions;
  }

  return _replaceRootDirTags(newConfig.rootDir, newConfig);
}

function _addDot(ext) {
  return '.' + ext;
}

function uniqueStrings(set) {
  var newSet = [];
  var has = {};
  set.forEach(function (item) {
    if (!has[item]) {
      has[item] = true;
      newSet.push(item);
    }
  });
  return newSet;
}

function pathNormalize(dir) {
  return path.normalize(dir.replace(/\\/g, '/')).replace(/\\/g, '/');
}

function loadConfigFromFile(filePath) {
  var fileDir = path.dirname(filePath);
  return Q.nfcall(fs.readFile, filePath, 'utf8').then(function(fileData) {
    var config = JSON.parse(fileData);
    if (!config.hasOwnProperty('rootDir')) {
      config.rootDir = fileDir;
    } else {
      config.rootDir = path.resolve(fileDir, config.rootDir);
    }
    return normalizeConfig(config);
  });
}

function loadConfigFromPackageJson(filePath) {
  var pkgJsonDir = path.dirname(filePath);
  return Q.nfcall(fs.readFile, filePath, 'utf8').then(function(fileData) {
    var packageJsonData = JSON.parse(fileData);
    var config = packageJsonData.jest;
    config.name = packageJsonData.name;
    if (!config.hasOwnProperty('rootDir')) {
      config.rootDir = pkgJsonDir;
    } else {
      config.rootDir = path.resolve(pkgJsonDir, config.rootDir);
    }
    return normalizeConfig(config);
  });
}

var _contentCache = {};
function readAndPreprocessFileContent(filePath, config) {
  var cacheRec;
  var mtime = fs.statSync(filePath).mtime;
  if (_contentCache.hasOwnProperty(filePath)) {
    cacheRec = _contentCache[filePath];
    if (cacheRec.mtime.getTime() === mtime.getTime()) {
      return cacheRec.content;
    }
  }

  var fileData = fs.readFileSync(filePath, 'utf8');

  // If the file data starts with a shebang remove it (but leave the line empty
  // to keep stack trace line numbers correct)
  if (fileData.substr(0, 2) === '#!') {
    fileData = fileData.replace(/^#!.*/, '');
  }

  if (config.scriptPreprocessor &&
      !config.preprocessorIgnorePatterns.some(function(pattern) {
        return pattern.test(filePath);
      })) {
    try {
      fileData = require(config.scriptPreprocessor).process(
        fileData,
        filePath,
        {}, // options
        [], // excludes
        config
      );
    } catch (e) {
      e.message = config.scriptPreprocessor + ': ' + e.message;
      throw e;
    }
  }
  _contentCache[filePath] = cacheRec = {mtime: mtime, content: fileData};
  return cacheRec.content;
}

function runContentWithLocalBindings(contextRunner, scriptContent, scriptPath,
                                     bindings) {
  var boundIdents = Object.keys(bindings);
  try {
    var wrapperFunc = contextRunner(
      '(function(' + boundIdents.join(',') + '){' +
      scriptContent +
      '\n})',
      scriptPath
    );
  } catch (e) {
    e.message = scriptPath + ': ' + e.message;
    throw e;
  }

  var bindingValues = boundIdents.map(function(ident) {
    return bindings[ident];
  });

  try {
    wrapperFunc.apply(null, bindingValues);
  } catch (e) {
    e.message = scriptPath + ': ' + e.message;
    throw e;
  }
}

/**
 * Given a test result, return a human readable string representing the
 * failures.
 *
 * @param {Object} testResult
 * @param {boolean} color true if message should include color flags
 * @return {String}
 */
function formatFailureMessage(testResult, color) {
  var colorize = color ? colors.colorize : function (str) { return str; };
  var ancestrySeparator = ' \u203A ';
  var descBullet = colorize('\u25cf ', colors.BOLD);
  var msgBullet = '  - ';
  var msgIndent = msgBullet.replace(/./g, ' ');

  return testResult.testResults.filter(function (result) {
    return result.failureMessages.length !== 0;
  }).map(function(result) {
    var failureMessages = result.failureMessages.map(function (errorMsg) {
      // Filter out q and jasmine entries from the stack trace.
      // They're super noisy and unhelpful
      errorMsg = errorMsg.split('\n').filter(function(line) {
        if (/^\s+at .*?/.test(line)) {
          // Extract the file path from the trace line
          var filePath = line.match(/(?:\(|at (?=\/))(.*):[0-9]+:[0-9]+\)?$/);
          if (filePath
              && STACK_TRACE_LINE_IGNORE_RE.test(filePath[1])) {
            return false;
          }
        }
        return true;
      }).join('\n');

      return msgBullet + errorMsg.replace(/\n/g, '\n' + msgIndent);
    }).join('\n');

    var testTitleAncestry = result.ancestorTitles.map(function(title) {
      return colorize(title, colors.BOLD);
    }).join(ancestrySeparator) + ancestrySeparator;

    return descBullet + testTitleAncestry + result.title + '\n' +
      failureMessages;
  }).join('\n');
}

function formatMsg(msg, color, _config) {
  _config = _config || {};
  if (_config.noHighlight) {
    return msg;
  }
  return colors.colorize(msg, color);
}

// A RegExp that matches paths that should not be included in error stack traces
// (mostly because these paths represent noisy/unhelpful libs)
var STACK_TRACE_LINE_IGNORE_RE = new RegExp('^(?:' + [
    path.resolve(__dirname, '..', 'node_modules', 'q'),
    path.resolve(__dirname, '..', 'vendor', 'jasmine')
].join('|') + ')');


exports.escapeStrForRegex = escapeStrForRegex;
exports.formatMsg = formatMsg;
exports.getLineCoverageFromCoverageInfo = getLineCoverageFromCoverageInfo;
exports.getLinePercentCoverageFromCoverageInfo =
  getLinePercentCoverageFromCoverageInfo;
exports.loadConfigFromFile = loadConfigFromFile;
exports.loadConfigFromPackageJson = loadConfigFromPackageJson;
exports.normalizeConfig = normalizeConfig;
exports.pathNormalize = pathNormalize;
exports.readAndPreprocessFileContent = readAndPreprocessFileContent;
exports.runContentWithLocalBindings = runContentWithLocalBindings;
exports.formatFailureMessage = formatFailureMessage;
