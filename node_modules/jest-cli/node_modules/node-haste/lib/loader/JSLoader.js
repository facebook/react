/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var inherits = require('util').inherits;
var path = require('path');
var zlib = require('zlib');

var docblock = require('../parse/docblock');
var extract = require('../parse/extract');
var extractJavelinSymbols = require('../parse/extractJavelinSymbols');
var JS = require('../resource/JS');
var MessageList = require('../MessageList');
var PathResolver = require('../PathResolver');
var ResourceLoader = require('./ResourceLoader');

/**
 * @class Loads and parses JavaScript files
 * Extracts options from the docblock, extracts javelin symbols, calculates
 * gziped network size. Both javalin symbols parsing and network size
 * calculation are off by default due to their perf cost. Use options parameter
 * to switch them on.
 *
 * @extends {ResourceLoader}
 * @param {Object|null} options Object with the following options:
 *                              - networkSize
 *                              - invalidRelativePaths
 *                              - extractSpecialRequires
 */
function JSLoader(options) {
  ResourceLoader.call(this, options);

  if (this.options.networkSize) {
    this.extractExtra = this.extractNetworkSize;
  } else {
    this.extractExtra = function(js, sourceCode, messages, callback) {
      // make async to break long stack traces
      process.nextTick(function() {
        callback(messages, js);
      });
    };
  }
}
inherits(JSLoader, ResourceLoader);
JSLoader.prototype.path = __filename;

JSLoader.prototype.getResourceTypes = function() {
  return [JS];
};

JSLoader.prototype.getExtensions = function() {
  return this.options.extensions || ['.js', '.jsx'];
};


/**
 * Extracts aproximate network size by gziping the source
 * @todo (voloko) why not minify?
 * Off by default due to perf cost
 *
 * @protected
 * @param  {JS}   js
 * @param  {String}   sourceCode
 * @param  {Function} callback
 */
JSLoader.prototype.extractNetworkSize =
  function(js, sourceCode, messages,callback) {
  zlib.gzip(sourceCode, function(err, buffer) {
    js.networkSize = buffer.length;
    callback(messages, js);
  });
};

var spaceRe = /\s+/;
/**
 * Syncronously extracts docblock options from the source
 *
 * @protected
 * @param  {JS}   js
 * @param  {String}   sourceCode
 */
JSLoader.prototype.parseDocblockOptions =
  function(js, sourceCode, messages) {

  var props = docblock.parse(docblock.extract(sourceCode));
  props.forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];
    switch (name) {
      case 'provides':
        js.id = value.split(spaceRe)[0];
        break;
      case 'providesModule':
        js.isModule = true;
        js.id = value.split(spaceRe)[0];
        break;
      case 'providesLegacy':
        js.isRunWhenReady = true;
        js.isLegacy = true;
        js.isModule = true;
        js.id = 'legacy:' + value.split(spaceRe)[0];
        break;
      case 'css':
        value.split(spaceRe).forEach(js.addRequiredCSS, js);
        break;
      case 'requires':
        value.split(spaceRe).forEach(js.addRequiredLegacyComponent, js);
        break;
      case 'javelin':
        // hack to ignore javelin docs (voloko)
        if (js.path.indexOf('/js/javelin/docs/') !== -1) {
          break;
        }
        js.isModule = true;
        js.isJavelin = true;
        js.isRunWhenReady = true;
        break;
      case 'polyfill':
        js.isPolyfill = true;
        if (value.match(/\S/)) {
          js.polyfillUAs = value.split(spaceRe);
        } else {
          js.polyfillUAs = ['all'];
        }
        break;
      case 'runWhenReady_DEPRECATED':
        js.isRunWhenReady = true;
        break;
      case 'jsx':
        // Anything before the first dot.
        // @jsx React.DOM should end up requiring React.
        var match = value && value.match(/^([^\.]+)/);
        js.isJSXEnabled = true;
        js.jsxDOMImplementor = value;
        if (match[0]) {
          js.addRequiredModule(match[0]);
        }
        break;
      case 'permanent':
        js.isPermanent = true;
        break;
      case 'nopackage':
        js.isNopackage = true;
        break;
      case 'option':
      case 'options':
        value.split(spaceRe).forEach(function(key) {
          js.options[key] = true;
        });
        break;
      case 'suggests':
        messages.addClowntownError(js.path, 'docblock',
          '@suggests is deprecated. Simply use the Bootloader APIs.');
        break;
      case 'author':
      case 'deprecated':
        // Support these so Diviner can pick them up.
        break;
      case 'bolt':
        // Used by bolt transformation
        break;
      case 'javelin-installs':
        //  This is used by Javelin to identify installed symbols.
        break;
      case 'param':
      case 'params':
      case 'task':
      case 'return':
      case 'returns':
      case 'access':
        messages.addWarning(js.path, 'docblock',
          "File has a header docblock, but the docblock is class or " +
          "function documentation, not file documentation. Header blocks " +
          "should not have @param, @task, @returns, @access, etc.");
        break;
      case 'nolint':
      case 'generated':
      case 'preserve-header':
      case 'emails':
        // various options
        break;
      case 'layer':
        // This directive is currently used by Connect JS library
        break;
      default:
        messages.addClowntownError(js.path, 'docblock',
          'Unknown directive ' + name);
    }
  });
};


/**
 * Initialize a resource with the source code and configuration
 * Loader can parse, gzip, minify the source code to build the resulting
 * Resource value object
 *
 * @protected
 * @param {String}               path      resource being built
 * @param {ProjectConfiguration} configuration configuration for the path
 * @param {String}               sourceCode
 * @param {Function}             callback
 */
JSLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, messages, callback) {
  var js = new JS(path);
  if (configuration) {
    js.isModule = true;
  }

  this.parseDocblockOptions(js, sourceCode, messages);

  if (js.isJavelin) {
    var data = extractJavelinSymbols(sourceCode);
    js.definedJavelinSymbols = data.defines;
    js.requiredJavelinSymbols = data.requires;
    if (data.id) {
      js.id = data.id;
    }
    if (js.id != 'javelin-magical-init') {
      js.addRequiredModule('javelin-magical-init');
    }
  }

  // resolve module ids through configuration
  if (js.isModule || js.path.indexOf('__browsertests__') !== -1) {
    // require calls outside of modules are not supported
    if (configuration) {
      if (!js.id) {
        js.id = configuration.resolveID(js.path);
      }
    }
    extract.requireCalls(sourceCode).forEach(js.addRequiredModule, js);

    if (this.options.extractSpecialRequires) {
      js.requiredLazyModules =
        extract.requireLazyCalls(sourceCode);
      js.suggests = extract.loadModules(sourceCode);
    }
  } else {
    if (this.options.extractSpecialRequires) {
      js.requiredLazyModules =
        extract.requireLazyCalls(sourceCode);
      js.suggests = extract.loadComponents(sourceCode);
    }
  }
  extract.cxModules(sourceCode).forEach(js.addRequiredCSS, js);
  // call generated function
  this.extractExtra(js, sourceCode, messages, function(m, js) {
    if (js) {
      js.finalize();
    }
    callback(m, js);
  });
};

/**
 * Only match *.js files
 * @param  {String} filePath
 * @return {Boolean}
 */
JSLoader.prototype.matchPath = function(filePath) {
  return this.getExtensions().some(function (ext) {
    return filePath.lastIndexOf(ext) === filePath.length - ext.length;
  });
};


/**
 * Resolving the absolute file path for a `require(x)` call is actually nuanced
 * and difficult to reimplement. Instead, we'll use an implementation based on
 * node's (private) path resolution to ensure that we're compliant with
 * commonJS. This doesn't take into account `providesModule`, so we deal with
 * that separately.  Unfortunately, node's implementation will read files off of
 * the disk that we've likely already pulled in `ProjectConfigurationLoader`
 * etc, so we can't use it directly - we had to factor out the pure logic into
 * `PathResolver.js`.
 *
 * @param {string} requiredText Text inside of require() function call.
 * @param {string} callersPath Path of the calling module.
 * @param {ResourceMap} resourceMap ResourceMap containing project configs and
 * JS resources.
 * @return {string} Absolute path of the file corresponding to requiredText, or
 * null if the module can't be resolved.
 */
function findAbsolutePathForRequired(requiredText, callersPath, resourceMap) {
  var callerData =  {
    id: callersPath,
    paths: resourceMap.getAllInferredProjectPaths(),
    fileName: callersPath
  };
  return PathResolver._resolveFileName(requiredText, callerData, resourceMap);
}

/**
 * Post process is called after the map is updated but before the update task is
 * complete.  `JSLoader` uses `postProcess` to _statically_ resolve
 * dependencies. What this means, is analyzing the argument to `require()` calls
 * in the JS, and determining the _unique_ logical ID of the resource being
 * referred to. This is something that *must* be done in `postProcess`, once
 * every module's ID has been determined, and must be done statically in order
 * to do anything useful with packaging etc.
 *
 * Two modules both might:
 *
 * `require('../path/to.js')`
 *
 * But they end up resolving to two distinct dependencies/IDs, because the
 * calling file is located in a different base directory.
 *
 * @param  {ResourceMap}      map
 * @param  {Array.<Resource>} resources
 * @param  {Function}         callback
 */
JSLoader.prototype.postProcess = function(map, resources, callback) {
  var messages = MessageList.create();
  var isJavelin = false;

  // Required text that doesn't have a '.' at the beginning should always
  // resolve to the same path for a given hasteMap, regardless of which file is
  // calling require, that means that we can optimize the lookup by caching the
  // resolved paths to these modules. If we don't do this *SECONDS* will be
  // spend calling `findAbsolutePathForRequired`. This cache is only valid for
  // non relative require texts. If relative requires ('.') the calling file
  // needs to be taken into consideration and this cache doesn't take that into
  // consideration.
  var nonRelativePathCache = {};

  resources.forEach(function(r) {
    var required = r.requiredModules;

    if (r.isJavelin) {
      isJavelin = true;
    }

    for (var i = 0; i < required.length; i++) {
      var requiredText = required[i];    // require('requiredText')
      var resourceByID = map.getResource('JS', requiredText);
      if (resourceByID) {  // Already requiring by ID - no static
        continue;          // resolution needed.
      }

      // @providesModule and standard require('projectName/path/to.js') would
      // have been caught above - now handle commonJS relative dirs, and
      // package.json main files.
      var beginsWithDot = requiredText.charAt(0) !== '.';
      var textInCache = requiredText in nonRelativePathCache;
      var commonJSResolvedPath = beginsWithDot && textInCache ?
        nonRelativePathCache[requiredText] :
        findAbsolutePathForRequired(requiredText, r.path, map);
      if (beginsWithDot && !textInCache) {
        nonRelativePathCache[requiredText] = commonJSResolvedPath;
      }

      // If not found by ID, we use commonJS conventions for lookup.
      var resolvedResource =
        commonJSResolvedPath &&
        map.getResourceByPath(commonJSResolvedPath);

      // Some modules may not have ids - this is likely a bug - their package's
      // haste roots might be incorrect.
      if (resolvedResource && resolvedResource.id) {
        if (resolvedResource.id !== required[i]) {
          // 'JSTest' files end up here. They don't have this method.
          if (r.recordRequiredModuleOrigin) {
            r.recordRequiredModuleOrigin(required[i], resolvedResource.id);
            required[i] = resolvedResource.id;
          }
        }
      }
    }
  });

  // legacy namespace
  resources.forEach(function(r) {
    var resource, i, required;

    required = r.requiredCSS;
    if (required) {
      for (i = 0; i < required.length; i++) {
        resource = map.getResource('CSS', 'css:' + required[i]);
        if (resource && resource.isModule) {
          required[i] = 'css:' + required[i];
        }
      }
    }

    if (r.isModule) {
      return;
    }

    required = r.requiredLegacyComponents;
    if (required) {
      for (i = 0; i < required.length; i++) {
        resource = map.getResource('JS', 'legacy:' + required[i]);
        if (resource && resource.isLegacy) {
          required[i] = 'legacy:' + required[i];
        }
      }
    }

    required = r.suggests;
    if (required) {
      for (i = 0; i < required.length; i++) {
        resource = map.getResource('JS', 'legacy:' + required[i]);
        if (resource && resource.isLegacy) {
          required[i] = 'legacy:' + required[i];
        }
      }
    }

  });

  // rebuild javelin map
  if (isJavelin) {
    var providesMap = {};
    map.getAllResourcesByType('JS').forEach(function(r) {
      if (r.isJavelin) {
        r.definedJavelinSymbols.forEach(function(s) {
          if (providesMap[s]) {
            messages.addClowntownError(r.path, 'javelin',
            'Javlin symbol ' + s + ' is already defined in ' +
            providesMap[s].path);
            return;
          }
          providesMap[s] = r;
        });
      }
    });
    map.getAllResourcesByType('JS').forEach(function(r) {
      if (r.isJavelin) {
        r.requiredJavelinSymbols.forEach(function(s) {
          var resolved = providesMap[s];
          if (!resolved) {
            messages.addClowntownError(r.path, 'javelin',
            'Javlin symbol ' + s + ' is required but never defined');
            return;
          }
          if (r.requiredModules.indexOf(resolved.id) === -1) {
            r.requiredModules.push(resolved.id);
          }
          if (r.requiredLegacyComponents.indexOf(resolved.id) !== -1) {
            r.requiredLegacyComponents = r.requiredLegacyComponents
              .filter(function(id) { return id !== resolved.id; });
          }
        });
      }
    });
  }

  process.nextTick(function() {
    callback(messages);
  });
};

module.exports = JSLoader;
