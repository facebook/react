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
/* jshint browser: true */
/* jslint evil: true */

'use strict';
var runScripts;

var transform = require('./fbtransform/lib/transform').transform;
var visitors = require('./fbtransform/visitors').transformVisitors;
var transform = transform.bind(null, visitors.react);
var docblock = require('./fbtransform/lib/docblock');

exports.transform = transform;
exports.exec = function(code) {
  return eval(transform(code));
};
var run = exports.run = function(code) {
  var moduleName =
    docblock.parseAsObject(docblock.extract(code)).providesModule;
  var jsx =
    docblock.parseAsObject(docblock.extract(code)).jsx;

  window.moduleLoads = (window.moduleLoads || []).concat(moduleName);
  window.startTime = Date.now();
  var functionBody = jsx ? transform(code).code : code;
  Function('require', 'module', 'exports', functionBody)(require, module, exports);
  window.endTime = Date.now();
  require[moduleName] = module.exports;
};

if (typeof window === "undefined" || window === null) {
  return;
}

var load = exports.load = function(url, callback) {
  var xhr;
  xhr = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
  xhr.open('GET', url, false);
  if ('overrideMimeType' in xhr) {
    xhr.overrideMimeType('text/plain');
  }
  xhr.onreadystatechange = function() {
    var _ref;
    if (xhr.readyState === 4) {
      if ((_ref = xhr.status) === 0 || _ref === 200) {
        run(xhr.responseText);
      } else {
        throw new Error("Could not load " + url);
      }
      if (callback) {
        return callback();
      }
    }
  };
  return xhr.send(null);
};

runScripts = function() {
  var jsxes, execute, index, length, s, scripts;
  scripts = document.getElementsByTagName('script');
  jsxes = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = scripts.length; _i < _len; _i++) {
      s = scripts[_i];
      if (s.type === 'text/jsx') {
        _results.push(s);
      }
    }
    return _results;
  })();
  index = 0;
  length = jsxes.length;
  (execute = function(j) {
    var script;
    script = jsxes[j];
    if ((script != null ? script.type : void 0) === 'text/jsx') {
      if (script.src) {
         return load(script.src, execute);
      } else {
        run(script.innerHTML);
        return execute();
      }
    }
  });
  for (var i = 0; i < jsxes.length; i++) {
    execute(i);
  }
  return null;
};

if (window.addEventListener) {
  window.addEventListener('DOMContentLoaded', runScripts, false);
} else {
  window.attachEvent('onload', runScripts);
}
