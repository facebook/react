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
var headEl;

var transform = require('jstransform').transform;
var visitors = require('./fbtransform/visitors').transformVisitors;
var transform = transform.bind(null, visitors.react);
var docblock = require('jstransform/src/docblock');


exports.transform = transform;

exports.exec = function(code) {
  return eval(transform(code).code);
};

if (typeof window === "undefined" || window === null) {
  return;
}
headEl = document.getElementsByTagName('head')[0];

var run = exports.run = function(code) {
  var jsx = docblock.parseAsObject(docblock.extract(code)).jsx;

  var functionBody = jsx ? transform(code).code : code;
  var scriptEl = document.createElement('script');

  scriptEl.text = functionBody;
  headEl.appendChild(scriptEl);
};

var load = exports.load = function(url, callback) {
  var xhr;
  xhr = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP')
                             : new XMLHttpRequest();

  // Disable async since we need to execute scripts in the order they are in the
  // DOM to mirror normal script loading.
  xhr.open('GET', url, false);
  if ('overrideMimeType' in xhr) {
    xhr.overrideMimeType('text/plain');
  }
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 0 || xhr.status === 200) {
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
  var scripts = document.getElementsByTagName('script');
  
  // Array.prototype.slice cannot be used on NodeList on IE8
  var jsxScripts = [];
  for (var i = 0; i < scripts.length; i++) {
    if (scripts.item(i).type === 'text/jsx') {
      jsxScripts.push(scripts.item(i));
    }
  }
  
  console.warn("You are using the in-browser JSX transformer. Be sure to precompile your JSX for production - http://facebook.github.io/react/docs/tooling-integration.html#jsx");

  jsxScripts.forEach(function(script) {
    if (script.src) {
      load(script.src);
    } else {
      run(script.innerHTML);
    }
  });
};

if (window.addEventListener) {
  window.addEventListener('DOMContentLoaded', runScripts, false);
} else {
  window.attachEvent('onload', runScripts);
}
