/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

/**
 * TODO: This file has grown into a monster. It really needs to be refactored
 *       into smaller pieces. One of the best places to start would be to move a
 *       bunch of the logic that exists here into node-haste.
 *
 *       Relatedly: It's time we vastly simplify node-haste.
 */

var fs = require('graceful-fs');
var hasteLoaders = require('node-haste/lib/loaders');
var moduleMocker = require('../lib/moduleMocker');
var NodeHaste = require('node-haste/lib/Haste');
var os = require('os');
var path = require('path');
var Q = require('q');
var resolve = require('resolve');
var utils = require('../lib/utils');

var COVERAGE_STORAGE_VAR_NAME = '____JEST_COVERAGE_DATA____';

var NODE_PATH = process.env.NODE_PATH;

var IS_PATH_BASED_MODULE_NAME = /^(?:\.\.?\/|\/)/;

var NODE_CORE_MODULES = {
  assert: true,
  buffer: true,
  child_process: true, // jshint ignore:line
  cluster: true,
  console: true,
  constants: true,
  crypto: true,
  dgram: true,
  dns: true,
  domain: true,
  events: true,
  freelist: true,
  fs: true,
  http: true,
  https: true,
  module: true,
  net: true,
  os: true,
  path: true,
  punycode: true,
  querystring: true,
  readline: true,
  repl: true,
  smalloc: true,
  stream: true,
  string_decoder: true, // jshint ignore:line
  sys: true,
  timers: true,
  tls: true,
  tty: true,
  url: true,
  util: true,
  vm: true,
  zlib: true
};

var VENDOR_PATH = path.resolve(__dirname, '../../vendor');

var _configUnmockListRegExpCache = null;

function _buildLoadersList(config) {
  return [
    new hasteLoaders.ProjectConfigurationLoader(),
    new hasteLoaders.JSTestLoader(config.setupJSTestLoaderOptions),
    new hasteLoaders.JSMockLoader(config.setupJSMockLoaderOptions),
    new hasteLoaders.JSLoader(config.setupJSLoaderOptions),
    new hasteLoaders.ResourceLoader()
  ];
}

function _constructHasteInst(config, options) {
  var HASTE_IGNORE_REGEX = new RegExp(
    config.modulePathIgnorePatterns.length > 0
    ? config.modulePathIgnorePatterns.join('|')
    : '$.'  // never matches
  );

  if (!fs.existsSync(config.cacheDirectory)) {
    fs.mkdirSync(config.cacheDirectory);
  }

  return new NodeHaste(
    _buildLoadersList(config),
    (config.testPathDirs || []),
    {
      ignorePaths: function(path) {
        return path.match(HASTE_IGNORE_REGEX);
      },
      version: JSON.stringify(config),
      useNativeFind: true,
      maxProcesses: os.cpus().length,
      maxOpenFiles: options.maxOpenFiles || 100
    }
  );
}

function _getCacheFilePath(config) {
  return path.join(config.cacheDirectory, 'cache-' + config.name);
}

function Loader(config, environment, resourceMap) {
  this._config = config;
  this._coverageCollectors = {};
  this._currentlyExecutingModulePath = '';
  this._environment = environment;
  this._explicitShouldMock = {};
  this._explicitlySetMocks = {};
  this._isCurrentlyExecutingManualMock = null;
  this._mockMetaDataCache = {};
  this._nodeModuleProjectConfigNameToResource = null;
  this._resourceMap = resourceMap;
  this._reverseDependencyMap = null;
  this._shouldAutoMock = true;
  this._configShouldMockModuleNames = {};

  if (config.collectCoverage) {
    this._CoverageCollector = require(config.coverageCollector);
  }

  if (_configUnmockListRegExpCache === null) {
    // Node must have been run with --harmony in order for WeakMap to be
    // available prior to version 0.12
    if (typeof WeakMap !== 'function') {
      throw new Error(
        'Please run node with the --harmony flag! jest requires WeakMap ' +
        'which is only available with the --harmony flag in node < v0.12'
      );
    }

    _configUnmockListRegExpCache = new WeakMap();
  }

  if (!config.unmockedModulePathPatterns
      || config.unmockedModulePathPatterns.length === 0) {
    this._unmockListRegExps = [];
  } else {
    this._unmockListRegExps = _configUnmockListRegExpCache.get(config);
    if (!this._unmockListRegExps) {
      this._unmockListRegExps = config.unmockedModulePathPatterns
        .map(function(unmockPathRe) {
          return new RegExp(unmockPathRe);
        });
      _configUnmockListRegExpCache.set(config, this._unmockListRegExps);
    }
  }

  this.resetModuleRegistry();
}

Loader.loadResourceMap = function(config, options) {
  options = options || {};

  var deferred = Q.defer();
  try {
    _constructHasteInst(config, options).update(
      _getCacheFilePath(config),
      function(resourceMap) {
        deferred.resolve(resourceMap);
      }
    );
  } catch (e) {
    deferred.reject(e);
  }

  return deferred.promise;
};

Loader.loadResourceMapFromCacheFile = function(config, options) {
  options = options || {};

  var deferred = Q.defer();
  try {
    var hasteInst = _constructHasteInst(config, options);
    hasteInst.loadMap(
      _getCacheFilePath(config),
      function(err, map) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(map);
        }
      }
    );
  } catch (e) {
    deferred.reject(e);
  }

  return deferred.promise;
};

/**
 * Given the path to a module: Read it from disk (synchronously) and
 * evaluate it's constructor function to generate the module and exports
 * objects.
 *
 * @param string modulePath
 * @return object
 */
Loader.prototype._execModule = function(moduleObj) {
  var modulePath = moduleObj.__filename;

  var moduleContent =
    utils.readAndPreprocessFileContent(modulePath, this._config);

  moduleObj.require = this.constructBoundRequire(modulePath);

  var moduleLocalBindings = {
    'module': moduleObj,
    'exports': moduleObj.exports,
    'require': moduleObj.require,
    '__dirname': path.dirname(modulePath),
    '__filename': modulePath,
    'global': this._environment.global,
    'jest': this._builtInModules['jest-runtime'](modulePath).exports
  };

  var onlyCollectFrom = this._config.collectCoverageOnlyFrom;
  var shouldCollectCoverage =
    this._config.collectCoverage === true && !onlyCollectFrom
    || (onlyCollectFrom && onlyCollectFrom[modulePath] === true);

  if (shouldCollectCoverage) {
    if (!this._coverageCollectors.hasOwnProperty(modulePath)) {
      this._coverageCollectors[modulePath] =
        new this._CoverageCollector(moduleContent, modulePath);
    }
    var collector = this._coverageCollectors[modulePath];
    moduleLocalBindings[COVERAGE_STORAGE_VAR_NAME] =
      collector.getCoverageDataStore();
    moduleContent = collector.getInstrumentedSource(COVERAGE_STORAGE_VAR_NAME);
  }

  var lastExecutingModulePath = this._currentlyExecutingModulePath;
  this._currentlyExecutingModulePath = modulePath;

  var origCurrExecutingManualMock = this._isCurrentlyExecutingManualMock;
  this._isCurrentlyExecutingManualMock = modulePath;

  utils.runContentWithLocalBindings(
    this._environment.runSourceText.bind(this._environment),
    moduleContent,
    modulePath,
    moduleLocalBindings
  );

  this._isCurrentlyExecutingManualMock = origCurrExecutingManualMock;
  this._currentlyExecutingModulePath = lastExecutingModulePath;
};

Loader.prototype._generateMock = function(currPath, moduleName) {
  var modulePath = this._moduleNameToPath(currPath, moduleName);

  if (!this._mockMetaDataCache.hasOwnProperty(modulePath)) {
    // This allows us to handle circular dependencies while generating an
    // automock
    this._mockMetaDataCache[modulePath] = moduleMocker.getMetadata({});

    // In order to avoid it being possible for automocking to potentially cause
    // side-effects within the module environment, we need to execute the module
    // in isolation. This accomplishes that by temporarily clearing out the
    // module and mock registries while the module being analyzed is executed.
    //
    // An example scenario where this could cause issue is if the module being
    // mocked has calls into side-effectful APIs on another module.
    var origMockRegistry = this._mockRegistry;
    var origModuleRegistry = this._moduleRegistry;
    this._mockRegistry = {};
    this._moduleRegistry = {};

    var moduleExports = this.requireModule(currPath, moduleName);

    // Restore the "real" module/mock registries
    this._mockRegistry = origMockRegistry;
    this._moduleRegistry = origModuleRegistry;

    this._mockMetaDataCache[modulePath] = moduleMocker.getMetadata(
      moduleExports
    );
  }

  return moduleMocker.generateFromMetadata(
    this._mockMetaDataCache[modulePath]
  );
};

Loader.prototype._getDependencyPathsFromResource = function(resource) {
  var dependencyPaths = [];
  for (var i = 0; i < resource.requiredModules.length; i++) {
    var requiredModule = resource.requiredModules[i];

    // *facepalm* node-haste is pretty clowny
    if (resource.getModuleIDByOrigin) {
      requiredModule =
        resource.getModuleIDByOrigin(requiredModule) || requiredModule;
    }

    try {
      var moduleID = this._getNormalizedModuleID(resource.path, requiredModule);
    } catch(e) {
      console.warn(
        'Could not find a `' + requiredModule + '` module while analyzing ' +
        'dependencies of `' + resource.id + '`'
      );
      continue;
    }

    dependencyPaths.push(this._getRealPathFromNormalizedModuleID(moduleID));
  }
  return dependencyPaths;
};

Loader.prototype._getResource = function(resourceType, resourceName) {
  var resource = this._resourceMap.getResource(resourceType, resourceName);

  // TODO: Fix this properly in node-haste, not here :(
  if (resource === undefined && resourceType === 'JS' && /\//.test(resourceName)
      && !/\.js$/.test(resourceName)) {
    resource = this._resourceMap.getResource(
      resourceType,
      resourceName + '.js'
    );
  }

  return resource;
};

Loader.prototype._getNormalizedModuleID = function(currPath, moduleName) {
  var moduleType;
  var mockAbsPath = null;
  var realAbsPath = null;

  if (this._builtInModules.hasOwnProperty(moduleName)) {
    moduleType = 'builtin';
    realAbsPath = moduleName;
  } else if (NODE_CORE_MODULES.hasOwnProperty(moduleName)) {
    moduleType = 'node';
    realAbsPath = moduleName;
  } else {
    moduleType = 'user';

    // If this is a path-based module name, resolve it to an absolute path and
    // then see if there's a node-haste resource for it (so that we can extract
    // info from the resource, like whether its a mock, or a
    if (IS_PATH_BASED_MODULE_NAME.test(moduleName)
        || (this._getResource('JS', moduleName) === undefined
            && this._getResource('JSMock', moduleName) === undefined)) {
      var absolutePath = this._moduleNameToPath(currPath, moduleName);
      if (absolutePath === undefined) {
        throw new Error(
          'Cannot find module \'' + moduleName + '\' from \'' + currPath + '\''
        );
      }

      // See if node-haste is already aware of this resource. If so, we need to
      // look up if it has an associated manual mock.
      var resource = this._resourceMap.getResourceByPath(absolutePath);
      if (resource) {
        if (resource.type === 'JS') {
          realAbsPath = absolutePath;
        } else if (resource.type === 'JSMock') {
          mockAbsPath = absolutePath;
        }
        moduleName = resource.id;
      }
    }

    if (realAbsPath === null) {
      var moduleResource = this._getResource('JS', moduleName);
      if (moduleResource) {
        realAbsPath = moduleResource.path;
      }
    }

    if (mockAbsPath === null) {
      var mockResource = this._getResource('JSMock', moduleName);
      if (mockResource) {
        mockAbsPath = mockResource.path;
      }
    }
  }

  return [moduleType, realAbsPath, mockAbsPath].join(':');
};

Loader.prototype._getRealPathFromNormalizedModuleID = function(moduleID) {
  return moduleID.split(':')[1];
};

/**
 * Given a module name and the current file path, returns the normalized
 * (absolute) module path for said module. Relative-path CommonJS require()s
 * such as `require('./otherModule')` need to be looked up with context of
 * the module that's calling require()
 *
 * Also contains special case logic for built-in modules, in which it just
 * returns the module name.
 *
 * @param string currPath The path of the file that is attempting to
 *                            resolve the module
 * @param string moduleName The name of the module to be resolved
 * @return string
 */
Loader.prototype._moduleNameToPath = function(currPath, moduleName) {
  if (this._builtInModules.hasOwnProperty(moduleName)) {
    return moduleName;
  }

  // Relative-path CommonJS require()s such as `require('./otherModule')`
  // need to be looked up with context of the module that's calling
  // require().
  if (IS_PATH_BASED_MODULE_NAME.test(moduleName)) {
    // Normalize the relative path to an absolute path
    var modulePath = path.resolve(currPath, '..', moduleName);

    var ext, i;
    var extensions = this._config.moduleFileExtensions;

    // http://nodejs.org/docs/v0.10.0/api/all.html#all_all_together
    // LOAD_AS_FILE #1
    if (fs.existsSync(modulePath) &&
        fs.statSync(modulePath).isFile()) {
      return modulePath;
    }
    // LOAD_AS_FILE #2+
    for (i = 0; i < extensions.length; i++) {
      ext = '.' + extensions[i];
      if (fs.existsSync(modulePath + ext) &&
          fs.statSync(modulePath + ext).isFile()) {
        return modulePath + ext;
      }
    }
    // LOAD_AS_DIRECTORY
    if (fs.existsSync(modulePath) &&
        fs.statSync(modulePath).isDirectory()) {

      // LOAD_AS_DIRECTORY #1
      var packagePath = path.join(modulePath, 'package.json');
      if (fs.existsSync(packagePath)) {
        var packageData = require(packagePath);
        if (packageData.main) {
          var mainPath = path.join(modulePath, packageData.main);
          if (fs.existsSync(mainPath)) {
            return mainPath;
          }
        }
      }

      // The required path is a valid directory, but there's no matching
      // js file at the same path. So look in the directory for an
      // index.js file.
      var indexPath = path.join(modulePath, 'index');
      for (i = 0; i < extensions.length; i++) {
        ext = '.' + extensions[i];
        if (fs.existsSync(indexPath + ext) &&
            fs.statSync(indexPath + ext).isFile()) {
          return indexPath + ext;
        }
      }
    }
  } else {
    var resource = this._getResource('JS', moduleName);
    if (!resource) {
      return this._nodeModuleNameToPath(
        currPath,
        moduleName
      );
    }
    return resource.path;
  }
};

Loader.prototype._nodeModuleNameToPath = function(currPath, moduleName) {
  // Handle module names like require('jest/lib/util')
  var subModulePath = null;
  var moduleProjectPart = moduleName;
  if (/\//.test(moduleName)) {
    var projectPathParts = moduleName.split('/');
    moduleProjectPart = projectPathParts.shift();
    subModulePath = projectPathParts.join('/');
  }

  var resolveError = null;
  var exts = this._config.moduleFileExtensions
    .map(function(ext){
      return '.' + ext;
    });
  try {
    if (NODE_PATH) {
      return resolve.sync(moduleName, {
        paths: NODE_PATH.split(path.delimiter),
        basedir: path.dirname(currPath),
        extensions: exts
      });
    } else {
      return resolve.sync(moduleName, {
        basedir: path.dirname(currPath),
        extensions: exts
      });
    }
  } catch (e) {
    // Facebook has clowny package.json resolution rules that don't apply to
    // regular Node rules. Until we can make ModuleLoaders more pluggable
    // (so that FB can have a custom ModuleLoader and all the normal people can
    // have a normal ModuleLoader), we catch node-resolution exceptions and
    // fall back to some custom resolution logic before throwing the error.
    resolveError = e;
  }

  // Memoize the project name -> package.json resource lookup map
  if (this._nodeModuleProjectConfigNameToResource === null) {
    this._nodeModuleProjectConfigNameToResource = {};
    var resources =
      this._resourceMap.getAllResourcesByType('ProjectConfiguration');
    resources.forEach(function(res) {
      this._nodeModuleProjectConfigNameToResource[res.data.name] = res;
    }.bind(this));
  }

  // Get the resource for the package.json file
  var resource = this._nodeModuleProjectConfigNameToResource[moduleProjectPart];
  if (!resource) {
    throw resolveError;
  }

  // Make sure the resource path is above the currPath in the fs path
  // tree. If so, just use node's resolve
  var resourceDirname = path.dirname(resource.path);
  var currFileDirname = path.dirname(currPath);
  if (resourceDirname.indexOf(currFileDirname) > 0) {
    throw resolveError;
  }

  if (subModulePath === null) {
    subModulePath =
      resource.data.hasOwnProperty('main')
      ? resource.data.main
      : 'index.js';
  }

  return this._moduleNameToPath(
    resource.path,
    './' + subModulePath
  );
};

/**
 * Indicates whether a given module is mocked per the current state of the
 * module loader. When a module is "mocked", that means calling
 * `requireModuleOrMock()` for the module will return the mock version
 * rather than the real version.
 *
 * @param string currPath The path of the file that is attempting to
 *                            resolve the module
 * @param string moduleName The name of the module to be resolved
 * @return bool
 */
Loader.prototype._shouldMock = function(currPath, moduleName) {
  var moduleID = this._getNormalizedModuleID(currPath, moduleName);
  if (this._builtInModules.hasOwnProperty(moduleName)) {
    return false;
  } else if (this._explicitShouldMock.hasOwnProperty(moduleID)) {
    return this._explicitShouldMock[moduleID];
  } else if (NODE_CORE_MODULES[moduleName]) {
    return false;
  } else if (this._shouldAutoMock) {

    // See if the module is specified in the config as a module that should
    // never be mocked
    if (this._configShouldMockModuleNames.hasOwnProperty(moduleName)) {
      return this._configShouldMockModuleNames[moduleName];
    } else if (this._unmockListRegExps.length > 0) {
      this._configShouldMockModuleNames[moduleName] = true;

      var manualMockResource =
        this._getResource('JSMock', moduleName);
      try {
        var modulePath = this._moduleNameToPath(currPath, moduleName);
      } catch(e) {
        // If there isn't a real module, we don't have a path to match
        // against the unmockList regexps. If there is also not a manual
        // mock, then we throw because this module doesn't exist anywhere.
        //
        // However, it's possible that someone has a manual mock for a
        // non-existant real module. In this case, we should mock the module
        // (because we technically can).
        //
        // Ideally this should never happen, but we have some odd
        // pre-existing edge-cases that rely on it so we need it for now.
        //
        // I'd like to eliminate this behavior in favor of requiring that
        // all module environments are complete (meaning you can't just
        // write a manual mock as a substitute for a real module).
        if (manualMockResource) {
          return true;
        }
        throw e;
      }
      var unmockRegExp;

      // Never mock the jasmine environment.
      if (modulePath.indexOf(VENDOR_PATH) === 0) {
        return false;
      }

      this._configShouldMockModuleNames[moduleName] = true;
      for (var i = 0; i < this._unmockListRegExps.length; i++) {
        unmockRegExp = this._unmockListRegExps[i];
        if (unmockRegExp.test(modulePath)) {
          return this._configShouldMockModuleNames[moduleName] = false;
        }
      }
      return this._configShouldMockModuleNames[moduleName];
    }
    return true;
  } else {
    return false;
  }
};

Loader.prototype.constructBoundRequire = function(sourceModulePath) {
  var boundModuleRequire = this.requireModuleOrMock.bind(
    this,
    sourceModulePath
  );

  boundModuleRequire.resolve = function(moduleName) {
    var ret = this._moduleNameToPath(sourceModulePath, moduleName);
    if (!ret) {
      throw new Error('Module(' + moduleName + ') not found!');
    }
    return ret;
  }.bind(this);
  boundModuleRequire.generateMock = this._generateMock.bind(
    this,
    sourceModulePath
  );
  boundModuleRequire.requireMock = this.requireMock.bind(
    this,
    sourceModulePath
  );
  boundModuleRequire.requireActual = this.requireModule.bind(
    this,
    sourceModulePath
  );

  return boundModuleRequire;
};

/**
 * Returns a map from modulePath -> coverageInfo, where coverageInfo is of the
 * structure returned By CoverageCollector.extractRuntimeCoverageInfo()
 */
Loader.prototype.getAllCoverageInfo = function() {
  if (!this._config.collectCoverage) {
    throw new Error(
      'config.collectCoverage was not set, so no coverage info has been ' +
      '(or will be) collected!'
    );
  }

  var coverageInfo = {};
  for (var filePath in this._coverageCollectors) {
    coverageInfo[filePath] =
      this._coverageCollectors[filePath].extractRuntimeCoverageInfo();
  }
  return coverageInfo;
};

Loader.prototype.getCoverageForFilePath = function(filePath) {
  if (!this._config.collectCoverage) {
    throw new Error(
      'config.collectCoverage was not set, so no coverage info has been ' +
      '(or will be) collected!'
    );
  }

  return (
    this._coverageCollectors.hasOwnProperty(filePath)
    ? this._coverageCollectors[filePath].extractRuntimeCoverageInfo()
    : null
  );
};

/**
 * Given the path to some file, find the path to all other files that it
 * *directly* depends on.
 *
 * @param {String} modulePath Absolute path to the module in question
 * @return {Array<String>} List of paths to files that the given module directly
 *                         depends on.
 */
Loader.prototype.getDependenciesFromPath = function(modulePath) {
  var resource = this._resourceMap.getResourceByPath(modulePath);
  if (!resource) {
    throw new Error('Unknown modulePath: ' + modulePath);
  }

  if (resource.type === 'ProjectConfiguration'
      || resource.type === 'Resource') {
    throw new Error(
      'Could not extract dependency information from this type of file!'
    );
  }

  return this._getDependencyPathsFromResource(resource);
};

/**
 * Given the path to some module, find all other files that *directly* depend on
 * it.
 *
 * @param {String} modulePath Absolute path to the module in question
 * @return {Array<String>} List of paths to files that directly depend on the
 *                         given module path.
 */
Loader.prototype.getDependentsFromPath = function(modulePath) {
  if (this._reverseDependencyMap === null) {
    var resourceMap = this._resourceMap;
    var reverseDepMap = this._reverseDependencyMap = {};
    var allResources = resourceMap.getAllResources();
    for (var resourceID in allResources) {
      var resource = allResources[resourceID];
      if (resource.type === 'ProjectConfiguration'
          || resource.type === 'Resource') {
        continue;
      }

      var dependencyPaths = this._getDependencyPathsFromResource(resource);
      for (var i = 0; i < dependencyPaths.length; i++) {
        var requiredModulePath = dependencyPaths[i];
        if (!reverseDepMap.hasOwnProperty(requiredModulePath)) {
          reverseDepMap[requiredModulePath] = {};
        }
        reverseDepMap[requiredModulePath][resource.path] = true;
      }
    }
  }

  var reverseDeps = this._reverseDependencyMap[modulePath];
  return reverseDeps ? Object.keys(reverseDeps) : [];
};

/**
 * Given a module name, return the mock version of said module.
 *
 * @param string currPath The path of the file that is attempting to
 *                        resolve the module
 * @param string moduleName The name of the module to be resolved
 * @return object
 */
Loader.prototype.requireMock = function(currPath, moduleName) {
  var moduleID = this._getNormalizedModuleID(currPath, moduleName);

  if (this._explicitlySetMocks.hasOwnProperty(moduleID)) {
    return this._explicitlySetMocks[moduleID];
  }

  // Look in the node-haste resource map
  var manualMockResource = this._getResource('JSMock', moduleName);
  var modulePath;
  if (manualMockResource) {
    modulePath = manualMockResource.path;
  } else {
    modulePath = this._moduleNameToPath(currPath, moduleName);

    // If the actual module file has a __mocks__ dir sitting immediately next to
    // it, look to see if there is a manual mock for this file in that dir.
    //
    // The reason why node-haste isn't good enough for this is because
    // node-haste only handles manual mocks for @providesModules well. Otherwise
    // it's not good enough to disambiguate something like the following
    // scenario:
    //
    // subDir1/MyModule.js
    // subDir1/__mocks__/MyModule.js
    // subDir2/MyModule.js
    // subDir2/__mocks__/MyModule.js
    //
    // Where some other module does a relative require into each of the
    // respective subDir{1,2} directories and expects a manual mock
    // corresponding to that particular MyModule.js file.
    var moduleDir = path.dirname(modulePath);
    var moduleFileName = path.basename(modulePath);
    var potentialManualMock = path.join(moduleDir, '__mocks__', moduleFileName);
    if (fs.existsSync(potentialManualMock)) {
      manualMockResource = true;
      modulePath = potentialManualMock;
    }
  }

  if (this._mockRegistry.hasOwnProperty(modulePath)) {
    return this._mockRegistry[modulePath];
  }

  if (manualMockResource) {
    var moduleObj = {
      exports: {},
      __filename: modulePath
    };
    this._execModule(moduleObj);
    this._mockRegistry[modulePath] = moduleObj.exports;
  } else {
    // Look for a real module to generate an automock from
    this._mockRegistry[modulePath] = this._generateMock(
      currPath,
      moduleName
    );
  }

  return this._mockRegistry[modulePath];
};

/**
 * Given a module name, return the *real* (un-mocked) version of said
 * module.
 *
 * @param string currPath The path of the file that is attempting to
 *                        resolve the module
 * @param string moduleName The name of the module to be resolved
 * @param bool bypassRegistryCache Whether we should read from/write to the
 *                                 module registry. Fuck this arg.
 * @return object
 */
Loader.prototype.requireModule = function(currPath, moduleName,
                                          bypassRegistryCache) {
  var modulePath;
  var moduleID = this._getNormalizedModuleID(currPath, moduleName);

  // I don't like this behavior as it makes the module system's mocking
  // rules harder to understand. Would much prefer that mock state were
  // either "on" or "off" -- rather than "automock on", "automock off",
  // "automock off -- but there's a manual mock, so you get that if you ask
  // for the module and one doesnt exist", or "automock off -- but theres a
  // useAutoMock: false entry in the package.json -- and theres a manual
  // mock -- and the module is listed in the unMockList in the test config
  // -- soooo...uhh...fuck I lost track".
  //
  // To simplify things I'd like to move to a system where tests must
  // explicitly call .mock() on a module to recieve the mocked version if
  // automocking is off. If a manual mock exists, that is used. Otherwise
  // we fall back to the automocking system to generate one for you.
  //
  // The only reason we're supporting this in jest for now is because we
  // have some tests that depend on this behavior. I'd like to clean this
  // up at some point in the future.
  var manualMockResource = null;
  var moduleResource = null;
  moduleResource = this._getResource('JS', moduleName);
  manualMockResource = this._getResource('JSMock', moduleName);
  if (!moduleResource
      && manualMockResource
      && manualMockResource.path !== this._isCurrentlyExecutingManualMock
      && this._explicitShouldMock[moduleID] !== false) {
    modulePath = manualMockResource.path;
  }

  if (!modulePath) {
    modulePath = this._moduleNameToPath(currPath, moduleName);
  }

  if (NODE_CORE_MODULES[moduleName]) {
    return require(moduleName);
  }

  // Always natively require the jasmine runner.
  if (modulePath.indexOf(VENDOR_PATH) === 0) {
    return require(modulePath);
  }

  if (!modulePath) {
    throw new Error(
      'Cannot find module \'' + moduleName + '\' from \'' + currPath +
      '\''
    );
  }

  var moduleObj;
  if (modulePath && this._builtInModules.hasOwnProperty(modulePath)) {
    moduleObj = this._builtInModules[modulePath](currPath);
  }

  if (!moduleObj && !bypassRegistryCache) {
    moduleObj = this._moduleRegistry[modulePath];
  }
  if (!moduleObj) {
    // We must register the pre-allocated module object first so that any
    // circular dependencies that may arise while evaluating the module can
    // be satisfied.
    moduleObj = {
      __filename: modulePath,
      exports: {}
    };

    if (!bypassRegistryCache) {
      this._moduleRegistry[modulePath] = moduleObj;
    }

    // Good ole node...
    if (path.extname(modulePath) === '.json') {
      moduleObj.exports = this._environment.global.JSON.parse(fs.readFileSync(
        modulePath,
        'utf8'
      ));
    } else if(path.extname(modulePath) === '.node') {
      // Just do a require if it is a native node module
      moduleObj.exports = require(modulePath);
    } else {
      this._execModule(moduleObj);
    }
  }

  return moduleObj.exports;
};

/**
 * Given a module name, return either the real module or the mock version of
 * that module -- depending on the mocking state of the loader (and, perhaps
 * the mocking state for the requested module).
 *
 * @param string currPath The path of the file that is attempting to
 *                        resolve the module
 * @param string moduleName The name of the module to be resolved
 * @return object
 */
Loader.prototype.requireModuleOrMock = function(currPath, moduleName) {
  if (this._shouldMock(currPath, moduleName)) {
    return this.requireMock(currPath, moduleName);
  } else {
    return this.requireModule(currPath, moduleName);
  }
};

Loader.prototype.getJestRuntime = function(dir) {
    return this._builtInModules['jest-runtime'](dir).exports;
};

/**
 * Clears all cached module objects. This allows one to reset the state of
 * all modules in the system. It will reset (read: clear) the export objects
 * for all evaluated modules and mocks.
 *
 * @return void
 */
Loader.prototype.resetModuleRegistry = function() {
  this._mockRegistry = {};
  this._moduleRegistry = {};
  this._builtInModules = {
    'jest-runtime': function(currPath) {
      var jestRuntime = {
        exports: {
          addMatchers: function(matchers) {
            var jasmine = this._environment.global.jasmine;
            var spec = jasmine.getEnv().currentSpec;
            spec.addMatchers(matchers);
          }.bind(this),

          autoMockOff: function() {
            this._shouldAutoMock = false;
            return jestRuntime.exports;
          }.bind(this),

          autoMockOn: function() {
            this._shouldAutoMock = true;
            return jestRuntime.exports;
          }.bind(this),

          clearAllTimers: function() {
            this._environment.fakeTimers.clearAllTimers();
          }.bind(this),

          currentTestPath: function() {
            return this._environment.testFilePath;
          }.bind(this),

          dontMock: function(moduleName) {
            var moduleID = this._getNormalizedModuleID(currPath, moduleName);
            this._explicitShouldMock[moduleID] = false;
            return jestRuntime.exports;
          }.bind(this),

          getTestEnvData: function() {
            var frozenCopy = {};
            // Make a shallow copy only because a deep copy seems like
            // overkill..
            Object.keys(this._config.testEnvData).forEach(function(key) {
              frozenCopy[key] = this._config.testEnvData[key];
            }, this);
            Object.freeze(frozenCopy);
            return frozenCopy;
          }.bind(this),

          genMockFromModule: function(moduleName) {
            return this._generateMock(
              this._currentlyExecutingModulePath,
              moduleName
            );
          }.bind(this),

          genMockFunction: function() {
            return moduleMocker.getMockFunction();
          },

          mock: function(moduleName) {
            var moduleID = this._getNormalizedModuleID(currPath, moduleName);
            this._explicitShouldMock[moduleID] = true;
            return jestRuntime.exports;
          }.bind(this),

          resetModuleRegistry: function() {
            var globalMock;
            for (var key in this._environment.global) {
              globalMock = this._environment.global[key];
              if ((typeof globalMock === 'object' && globalMock !== null)
                  || typeof globalMock === 'function') {
                globalMock._isMockFunction && globalMock.mockClear();
              }
            }

            if (this._environment.global.mockClearTimers) {
              this._environment.global.mockClearTimers();
            }

            this.resetModuleRegistry();

            return jestRuntime.exports;
          }.bind(this),

          runAllTicks: function() {
            this._environment.fakeTimers.runAllTicks();
          }.bind(this),

          runAllTimers: function() {
            this._environment.fakeTimers.runAllTimers();
          }.bind(this),

          runOnlyPendingTimers: function() {
            this._environment.fakeTimers.runOnlyPendingTimers();
          }.bind(this),

          setMock: function(moduleName, moduleExports) {
            var moduleID = this._getNormalizedModuleID(currPath, moduleName);
            this._explicitShouldMock[moduleID] = true;
            this._explicitlySetMocks[moduleID] = moduleExports;
            return jestRuntime.exports;
          }.bind(this),

          useFakeTimers: function() {
            this._environment.fakeTimers.useFakeTimers();
          }.bind(this),

          useRealTimers: function() {
            this._environment.fakeTimers.useRealTimers();
          }.bind(this)
        }
      };

      // This is a pretty common API to use in many tests, so this is just a
      // shorter alias to make it less annoying to type out each time.
      jestRuntime.exports.genMockFn = jestRuntime.exports.genMockFunction;

      return jestRuntime;
    }.bind(this),

    // This is a legacy API that will soon be deprecated.
    // Don't use it for new stuff as it will go away soon!
    'node-haste': function() {
      return {
        exports: {
          // Do not use this API -- it is deprecated and will go away very soon!
          getResourceMap: function() {
            return this._resourceMap;
          }.bind(this)
        }
      };
    }.bind(this),

    // This is a legacy API that will soon be deprecated.
    // Don't use it for new stuff as it will go away soon!
    'mocks': function(currPath) {
      var mocks = {
        exports: {
          generateFromMetadata: moduleMocker.generateFromMetadata,
          getMetadata: moduleMocker.getMetadata,
          getMockFunction: function() {
            return this.requireModule(
              currPath,
              'jest-runtime'
            ).genMockFn();
          }.bind(this),
        }
      };
      mocks.exports.getMockFn = mocks.exports.getMockFunction;
      return mocks;
    }.bind(this),

    // This is a legacy API that will soon be deprecated.
    // Don't use it for new stuff as it will go away soon!
    'mock-modules': function(currPath) {
      var mockModules = {
        exports: {
          dontMock: function(moduleName) {
            this.requireModule(
              currPath,
              'jest-runtime'
            ).dontMock(moduleName);
            return mockModules.exports;
          }.bind(this),

          mock: function(moduleName) {
            this.requireModule(
              currPath,
              'jest-runtime'
            ).mock(moduleName);
            return mockModules.exports;
          }.bind(this),

          autoMockOff: function() {
            this.requireModule(
              currPath,
              'jest-runtime'
            ).autoMockOff();
            return mockModules.exports;
          }.bind(this),

          autoMockOn: function() {
            this.requireModule(
              currPath,
              'jest-runtime'
            ).autoMockOn();
            return mockModules.exports;
          }.bind(this),

          // TODO: This is such a bad name, we should rename it to
          //       `resetModuleRegistry()` -- or anything else, really
          dumpCache: function() {
            this.requireModule(
              currPath,
              'jest-runtime'
            ).resetModuleRegistry();
            return mockModules.exports;
          }.bind(this),

          setMock: function(moduleName, moduleExports) {
            this.requireModule(
              currPath,
              'jest-runtime'
            ).setMock(moduleName, moduleExports);
            return mockModules.exports;
          }.bind(this),

          // wtf is this shit?
          hasDependency: function(moduleAName, moduleBName) {
            var traversedModules = {};

            var self = this;
            function _recurse(moduleAName, moduleBName) {
              traversedModules[moduleAName] = true;
              if (moduleAName === moduleBName) {
                return true;
              }
              var moduleAResource = self._getResource('JS', moduleAName);
              return !!(
                moduleAResource
                && moduleAResource.requiredModules
                && moduleAResource.requiredModules.some(function(dep) {
                  return !traversedModules[dep] && _recurse(dep, moduleBName);
                })
              );
            }

            return _recurse(moduleAName, moduleBName);
          }.bind(this),

          generateMock: function(moduleName) {
            return this.requireModule(
              currPath,
              'jest-runtime'
            ).genMockFromModule(moduleName);
          }.bind(this),

          useActualTimers: function() {
            this.requireModule(
              currPath,
              'jest-runtime'
            ).useActualTimers();
          }.bind(this),

          /**
           * Load actual module without reading from or writing to module
           * exports registry. This method's name is devastatingly misleading.
           * :(
           */
          loadActualModule: function(moduleName) {
            return this.requireModule(
              this._currentlyExecutingModulePath,
              moduleName,
              true // yay boolean args!
            );
          }.bind(this)
        }
      };
      return mockModules;
    }.bind(this)
  };
};

module.exports = Loader;
