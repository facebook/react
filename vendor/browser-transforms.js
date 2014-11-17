/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* jshint browser: true */
/* jslint evil: true */

'use strict';

var buffer = require('buffer');
var transform = require('jstransform').transform;
var typesSyntax = require('jstransform/visitors/type-syntax');
var visitors = require('./fbtransform/visitors');

var headEl;
var dummyAnchor;
var inlineScriptCount = 0;

// The source-map library relies on Object.defineProperty, but IE8 doesn't
// support it fully even with es5-sham. Indeed, es5-sham's defineProperty
// throws when Object.prototype.__defineGetter__ is missing, so we skip building
// the source map in that case.
var supportsAccessors = Object.prototype.hasOwnProperty('__defineGetter__');

/**
 * Run provided code through jstransform.
 *
 * @param {string} source Original source code
 * @param {object?} options Options to pass to jstransform
 * @return {object} object as returned from jstransform
 */
function transformReact(source, options) {
  // TODO: just use react-tools
  options = options || {};
  var visitorList;
  if (options.harmony) {
    visitorList = visitors.getAllVisitors();
  } else {
    visitorList = visitors.transformVisitors.react;
  }

  if (options.stripTypes) {
    // Stripping types needs to happen before the other transforms
    // unfortunately, due to bad interactions. For example,
    // es6-rest-param-visitors conflict with stripping rest param type
    // annotation
    source = transform(typesSyntax.visitorList, source, options).code;
  }

  return transform(visitorList, source, {
    sourceMap: supportsAccessors && options.sourceMap
  });
}

/**
 * Eval provided source after transforming it.
 *
 * @param {string} source Original source code
 * @param {object?} options Options to pass to jstransform
 */
function exec(source, options) {
  return eval(transformReact(source, options).code);
}

/**
 * This method returns a nicely formated line of code pointing to the exact
 * location of the error `e`. The line is limited in size so big lines of code
 * are also shown in a readable way.
 *
 * Example:
 * ... x', overflow:'scroll'}} id={} onScroll={this.scroll} class=" ...
 * ^
 *
 * @param {string} code The full string of code
 * @param {Error} e The error being thrown
 * @return {string} formatted message
 * @internal
 */
function createSourceCodeErrorMessage(code, e) {
  var sourceLines = code.split('\n');
  var erroneousLine = sourceLines[e.lineNumber - 1];

  // Removes any leading indenting spaces and gets the number of
  // chars indenting the `erroneousLine`
  var indentation = 0;
  erroneousLine = erroneousLine.replace(/^\s+/, function(leadingSpaces) {
    indentation = leadingSpaces.length;
    return '';
  });

  // Defines the number of characters that are going to show
  // before and after the erroneous code
  var LIMIT = 30;
  var errorColumn = e.column - indentation;

  if (errorColumn > LIMIT) {
    erroneousLine = '... ' + erroneousLine.slice(errorColumn - LIMIT);
    errorColumn = 4 + LIMIT;
  }
  if (erroneousLine.length - errorColumn > LIMIT) {
    erroneousLine = erroneousLine.slice(0, errorColumn + LIMIT) + ' ...';
  }
  var message = '\n\n' + erroneousLine + '\n';
  message += new Array(errorColumn - 1).join(' ') + '^';
  return message;
}

/**
 * Actually transform the code.
 *
 * @param {string} code
 * @param {string?} url
 * @param {object?} options
 * @return {string} The transformed code.
 * @internal
 */
function transformCode(code, url, options) {
  try {
    var transformed = transformReact(code, options);
  } catch(e) {
    e.message += '\n    at ';
    if (url) {
      if ('fileName' in e) {
        // We set `fileName` if it's supported by this error object and
        // a `url` was provided.
        // The error will correctly point to `url` in Firefox.
        e.fileName = url;
      }
      e.message += url + ':' + e.lineNumber + ':' + e.column;
    } else {
      e.message += location.href;
    }
    e.message += createSourceCodeErrorMessage(code, e);
    throw e;
  }

  if (!transformed.sourceMap) {
    return transformed.code;
  }

  var map = transformed.sourceMap.toJSON();
  var source;
  if (url == null) {
    source = "Inline JSX script";
    inlineScriptCount++;
    if (inlineScriptCount > 1) {
      source += ' (' + inlineScriptCount + ')';
    }
  } else if (dummyAnchor) {
    // Firefox has problems when the sourcemap source is a proper URL with a
    // protocol and hostname, so use the pathname. We could use just the
    // filename, but hopefully using the full path will prevent potential
    // issues where the same filename exists in multiple directories.
    dummyAnchor.href = url;
    source = dummyAnchor.pathname.substr(1);
  }
  map.sources = [source];
  map.sourcesContent = [code];

  return (
    transformed.code +
    '\n//# sourceMappingURL=data:application/json;base64,' +
    buffer.Buffer(JSON.stringify(map)).toString('base64')
  );
}


/**
 * Appends a script element at the end of the <head> with the content of code,
 * after transforming it.
 *
 * @param {string} code The original source code
 * @param {string?} url Where the code came from. null if inline
 * @param {object?} options Options to pass to jstransform
 * @internal
 */
function run(code, url, options) {
  var scriptEl = document.createElement('script');
  scriptEl.text = transformCode(code, url, options);
  headEl.appendChild(scriptEl);
}

/**
 * Load script from the provided url and pass the content to the callback.
 *
 * @param {string} url The location of the script src
 * @param {function} callback Function to call with the content of url
 * @internal
 */
function load(url, successCallback, errorCallback) {
  var xhr;
  xhr = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP')
                             : new XMLHttpRequest();

  // async, however scripts will be executed in the order they are in the
  // DOM to mirror normal script loading.
  xhr.open('GET', url, true);
  if ('overrideMimeType' in xhr) {
    xhr.overrideMimeType('text/plain');
  }
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 0 || xhr.status === 200) {
        successCallback(xhr.responseText);
      } else {
        errorCallback();
        throw new Error("Could not load " + url);
      }
    }
  };
  return xhr.send(null);
}

/**
 * Loop over provided script tags and get the content, via innerHTML if an
 * inline script, or by using XHR. Transforms are applied if needed. The scripts
 * are executed in the order they are found on the page.
 *
 * @param {array} scripts The <script> elements to load and run.
 * @internal
 */
function loadScripts(scripts) {
  var result = [];
  var count = scripts.length;

  function check() {
    var script, i;

    for (i = 0; i < count; i++) {
      script = result[i];

      if (script.loaded && !script.executed) {
        script.executed = true;
        run(script.content, script.url, script.options);
      } else if (!script.loaded && !script.error && !script.async) {
        break;
      }
    }
  }

  scripts.forEach(function(script, i) {
    var options = {
      sourceMap: true
    };
    if (/;harmony=true(;|$)/.test(script.type)) {
      options.harmony = true
    }
    if (/;stripTypes=true(;|$)/.test(script.type)) {
      options.stripTypes = true;
    }

    // script.async is always true for non-javascript script tags
    var async = script.hasAttribute('async');

    if (script.src) {
      result[i] = {
        async: async,
        error: false,
        executed: false,
        content: null,
        loaded: false,
        url: script.src,
        options: options
      };

      load(script.src, function(content) {
        result[i].loaded = true;
        result[i].content = content;
        check();
      }, function() {
        result[i].error = true;
        check();
      });
    } else {
      result[i] = {
        async: async,
        error: false,
        executed: false,
        content: script.innerHTML,
        loaded: true,
        url: null,
        options: options
      };
    }
  });

  check();
}

/**
 * Find and run all script tags with type="text/jsx".
 *
 * @internal
 */
function runScripts() {
  var scripts = document.getElementsByTagName('script');

  // Array.prototype.slice cannot be used on NodeList on IE8
  var jsxScripts = [];
  for (var i = 0; i < scripts.length; i++) {
    if (/^text\/jsx(;|$)/.test(scripts.item(i).type)) {
      jsxScripts.push(scripts.item(i));
    }
  }

  if (jsxScripts.length < 1) {
    return;
  }

  console.warn(
    'You are using the in-browser JSX transformer. Be sure to precompile ' +
    'your JSX for production - ' +
    'http://facebook.github.io/react/docs/tooling-integration.html#jsx'
  );

  loadScripts(jsxScripts);
}

// Listen for load event if we're in a browser and then kick off finding and
// running of scripts.
if (typeof window !== "undefined" && window !== null) {
  headEl = document.getElementsByTagName('head')[0];
  dummyAnchor = document.createElement('a');

  if (window.addEventListener) {
    window.addEventListener('DOMContentLoaded', runScripts, false);
  } else {
    window.attachEvent('onload', runScripts);
  }
}

module.exports = {
  transform: transformReact,
  exec: exec
};
