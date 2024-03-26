/**
 * @license React
 * react-dom-server.browser.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('react-dom')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'react-dom'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ReactDOMServer = {}, global.React, global.ReactDOM));
})(this, (function (exports, React, ReactDOM) { 'use strict';

  var ReactVersion = '18.3.0-experimental-8d312589e3-20240228';

  var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

  // by calls to these methods by a Babel plugin.
  //
  // In PROD (or in packages without access to React internals),
  // they are left as they are instead.

  function warn(format) {
    {
      {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        printWarning('warn', format, args);
      }
    }
  }
  function error(format) {
    {
      {
        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        printWarning('error', format, args);
      }
    }
  }

  function printWarning(level, format, args) {
    // When changing this logic, you might want to also
    // update consoleWithStackDev.www.js as well.
    {
      var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
      var stack = ReactDebugCurrentFrame.getStackAddendum();

      if (stack !== '') {
        format += '%s';
        args = args.concat([stack]);
      } // eslint-disable-next-line react-internal/safe-string-coercion


      var argsWithFormat = args.map(function (item) {
        return String(item);
      }); // Careful: RN currently depends on this prefix

      argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
      // breaks IE9: https://github.com/facebook/react/issues/13610
      // eslint-disable-next-line react-internal/no-production-logging

      Function.prototype.apply.call(console[level], console, argsWithFormat);
    }
  }

  // ATTENTION
  // When adding new symbols to this file,
  // Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
  // The Symbol used to tag the ReactElement-like types.
  var REACT_ELEMENT_TYPE = Symbol.for('react.element');
  var REACT_PORTAL_TYPE = Symbol.for('react.portal');
  var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
  var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
  var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
  var REACT_PROVIDER_TYPE = Symbol.for('react.provider'); // TODO: Delete with enableRenderableContext

  var REACT_CONSUMER_TYPE = Symbol.for('react.consumer');
  var REACT_CONTEXT_TYPE = Symbol.for('react.context');
  var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
  var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
  var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
  var REACT_MEMO_TYPE = Symbol.for('react.memo');
  var REACT_LAZY_TYPE = Symbol.for('react.lazy');
  var REACT_SCOPE_TYPE = Symbol.for('react.scope');
  var REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for('react.debug_trace_mode');
  var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
  var REACT_LEGACY_HIDDEN_TYPE = Symbol.for('react.legacy_hidden');
  var REACT_CACHE_TYPE = Symbol.for('react.cache');
  var REACT_MEMO_CACHE_SENTINEL = Symbol.for('react.memo_cache_sentinel');
  var REACT_POSTPONE_TYPE = Symbol.for('react.postpone');
  var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator';
  function getIteratorFn(maybeIterable) {
    if (maybeIterable === null || typeof maybeIterable !== 'object') {
      return null;
    }

    var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

    if (typeof maybeIterator === 'function') {
      return maybeIterator;
    }

    return null;
  }

  var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

  function isArray(a) {
    return isArrayImpl(a);
  }

  // in case they error.

  var jsxPropsParents = new WeakMap();
  var jsxChildrenParents = new WeakMap();
  function objectName(object) {
    // $FlowFixMe[method-unbinding]
    var name = Object.prototype.toString.call(object);
    return name.replace(/^\[object (.*)\]$/, function (m, p0) {
      return p0;
    });
  }

  function describeKeyForErrorMessage(key) {
    var encodedKey = JSON.stringify(key);
    return '"' + key + '"' === encodedKey ? key : encodedKey;
  }

  function describeValueForErrorMessage(value) {
    switch (typeof value) {
      case 'string':
        {
          return JSON.stringify(value.length <= 10 ? value : value.slice(0, 10) + '...');
        }

      case 'object':
        {
          if (isArray(value)) {
            return '[...]';
          }

          if (value !== null && value.$$typeof === CLIENT_REFERENCE_TAG) {
            return describeClientReference();
          }

          var name = objectName(value);

          if (name === 'Object') {
            return '{...}';
          }

          return name;
        }

      case 'function':
        {
          if (value.$$typeof === CLIENT_REFERENCE_TAG) {
            return describeClientReference();
          }

          var _name = value.displayName || value.name;

          return _name ? 'function ' + _name : 'function';
        }

      default:
        // eslint-disable-next-line react-internal/safe-string-coercion
        return String(value);
    }
  }

  function describeElementType(type) {
    if (typeof type === 'string') {
      return type;
    }

    switch (type) {
      case REACT_SUSPENSE_TYPE:
        return 'Suspense';

      case REACT_SUSPENSE_LIST_TYPE:
        return 'SuspenseList';
    }

    if (typeof type === 'object') {
      switch (type.$$typeof) {
        case REACT_FORWARD_REF_TYPE:
          return describeElementType(type.render);

        case REACT_MEMO_TYPE:
          return describeElementType(type.type);

        case REACT_LAZY_TYPE:
          {
            var lazyComponent = type;
            var payload = lazyComponent._payload;
            var init = lazyComponent._init;

            try {
              // Lazy may contain any component type so we recursively resolve it.
              return describeElementType(init(payload));
            } catch (x) {}
          }
      }
    }

    return '';
  }

  var CLIENT_REFERENCE_TAG = Symbol.for('react.client.reference');

  function describeClientReference(ref) {
    return 'client';
  }

  function describeObjectForErrorMessage(objectOrArray, expandedName) {
    var objKind = objectName(objectOrArray);

    if (objKind !== 'Object' && objKind !== 'Array') {
      return objKind;
    }

    var str = '';
    var start = -1;
    var length = 0;

    if (isArray(objectOrArray)) {
      if (jsxChildrenParents.has(objectOrArray)) {
        // Print JSX Children
        var type = jsxChildrenParents.get(objectOrArray);
        str = '<' + describeElementType(type) + '>';
        var array = objectOrArray;

        for (var i = 0; i < array.length; i++) {
          var value = array[i];
          var substr = void 0;

          if (typeof value === 'string') {
            substr = value;
          } else if (typeof value === 'object' && value !== null) {
            substr = '{' + describeObjectForErrorMessage(value) + '}';
          } else {
            substr = '{' + describeValueForErrorMessage(value) + '}';
          }

          if ('' + i === expandedName) {
            start = str.length;
            length = substr.length;
            str += substr;
          } else if (substr.length < 15 && str.length + substr.length < 40) {
            str += substr;
          } else {
            str += '{...}';
          }
        }

        str += '</' + describeElementType(type) + '>';
      } else {
        // Print Array
        str = '[';
        var _array = objectOrArray;

        for (var _i = 0; _i < _array.length; _i++) {
          if (_i > 0) {
            str += ', ';
          }

          var _value = _array[_i];

          var _substr = void 0;

          if (typeof _value === 'object' && _value !== null) {
            _substr = describeObjectForErrorMessage(_value);
          } else {
            _substr = describeValueForErrorMessage(_value);
          }

          if ('' + _i === expandedName) {
            start = str.length;
            length = _substr.length;
            str += _substr;
          } else if (_substr.length < 10 && str.length + _substr.length < 40) {
            str += _substr;
          } else {
            str += '...';
          }
        }

        str += ']';
      }
    } else {
      if (objectOrArray.$$typeof === REACT_ELEMENT_TYPE) {
        str = '<' + describeElementType(objectOrArray.type) + '/>';
      } else if (objectOrArray.$$typeof === CLIENT_REFERENCE_TAG) {
        return describeClientReference();
      } else if (jsxPropsParents.has(objectOrArray)) {
        // Print JSX
        var _type = jsxPropsParents.get(objectOrArray);

        str = '<' + (describeElementType(_type) || '...');
        var object = objectOrArray;
        var names = Object.keys(object);

        for (var _i2 = 0; _i2 < names.length; _i2++) {
          str += ' ';
          var name = names[_i2];
          str += describeKeyForErrorMessage(name) + '=';
          var _value2 = object[name];

          var _substr2 = void 0;

          if (name === expandedName && typeof _value2 === 'object' && _value2 !== null) {
            _substr2 = describeObjectForErrorMessage(_value2);
          } else {
            _substr2 = describeValueForErrorMessage(_value2);
          }

          if (typeof _value2 !== 'string') {
            _substr2 = '{' + _substr2 + '}';
          }

          if (name === expandedName) {
            start = str.length;
            length = _substr2.length;
            str += _substr2;
          } else if (_substr2.length < 10 && str.length + _substr2.length < 40) {
            str += _substr2;
          } else {
            str += '...';
          }
        }

        str += '>';
      } else {
        // Print Object
        str = '{';
        var _object = objectOrArray;

        var _names = Object.keys(_object);

        for (var _i3 = 0; _i3 < _names.length; _i3++) {
          if (_i3 > 0) {
            str += ', ';
          }

          var _name2 = _names[_i3];
          str += describeKeyForErrorMessage(_name2) + ': ';
          var _value3 = _object[_name2];

          var _substr3 = void 0;

          if (typeof _value3 === 'object' && _value3 !== null) {
            _substr3 = describeObjectForErrorMessage(_value3);
          } else {
            _substr3 = describeValueForErrorMessage(_value3);
          }

          if (_name2 === expandedName) {
            start = str.length;
            length = _substr3.length;
            str += _substr3;
          } else if (_substr3.length < 10 && str.length + _substr3.length < 40) {
            str += _substr3;
          } else {
            str += '...';
          }
        }

        str += '}';
      }
    }

    if (expandedName === undefined) {
      return str;
    }

    if (start > -1 && length > 0) {
      var highlight = ' '.repeat(start) + '^'.repeat(length);
      return '\n  ' + str + '\n  ' + highlight;
    }

    return '\n  ' + str;
  }

  // A pure JS implementation of a string hashing function. We do not use it for
  // security or obfuscation purposes, only to create compact hashes. So we
  // prioritize speed over collision avoidance. For example, we use this to hash
  // the component key path used by useFormState for MPA-style submissions.
  //
  // In environments where built-in hashing functions are available, we prefer
  // those instead. Like Node's crypto module, or Bun.hash. Unfortunately this
  // does not include the web standard crypto API because those methods are all
  // async. For our purposes, we need it to be sync because the cost of context
  // switching is too high to be worth it.
  //
  // The most popular hashing algorithm that meets these requirements in the JS
  // ecosystem is MurmurHash3, and almost all implementations I could find used
  // some version of the implementation by Gary Court inlined below.
  function createFastHashJS(key) {
    return murmurhash3_32_gc(key, 0);
  }
  /* eslint-disable prefer-const, no-fallthrough */

  /**
   * @license
   *
   * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
   *
   * Copyright (c) 2011 Gary Court
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   */

  function murmurhash3_32_gc(key, seed) {
    var remainder, bytes, h1, h1b, c1, c2, k1, i;
    remainder = key.length & 3; // key.length % 4

    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;

    while (i < bytes) {
      k1 = key.charCodeAt(i) & 0xff | (key.charCodeAt(++i) & 0xff) << 8 | (key.charCodeAt(++i) & 0xff) << 16 | (key.charCodeAt(++i) & 0xff) << 24;
      ++i;
      k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
      k1 = k1 << 15 | k1 >>> 17;
      k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;
      h1 ^= k1;
      h1 = h1 << 13 | h1 >>> 19;
      h1b = (h1 & 0xffff) * 5 + (((h1 >>> 16) * 5 & 0xffff) << 16) & 0xffffffff;
      h1 = (h1b & 0xffff) + 0x6b64 + (((h1b >>> 16) + 0xe654 & 0xffff) << 16);
    }

    k1 = 0;

    switch (remainder) {
      case 3:
        k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;

      case 2:
        k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;

      case 1:
        k1 ^= key.charCodeAt(i) & 0xff;
        k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
        k1 = k1 << 15 | k1 >>> 17;
        k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;
        h1 ^= k1;
    }

    h1 ^= key.length;
    h1 ^= h1 >>> 16;
    h1 = (h1 & 0xffff) * 0x85ebca6b + (((h1 >>> 16) * 0x85ebca6b & 0xffff) << 16) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = (h1 & 0xffff) * 0xc2b2ae35 + (((h1 >>> 16) * 0xc2b2ae35 & 0xffff) << 16) & 0xffffffff;
    h1 ^= h1 >>> 16;
    return h1 >>> 0;
  }

  function scheduleWork(callback) {
    callback();
  }
  var VIEW_SIZE = 512;
  var currentView = null;
  var writtenBytes = 0;
  function beginWriting(destination) {
    currentView = new Uint8Array(VIEW_SIZE);
    writtenBytes = 0;
  }
  function writeChunk(destination, chunk) {
    if (chunk.byteLength === 0) {
      return;
    }

    if (chunk.byteLength > VIEW_SIZE) {
      {
        if (precomputedChunkSet.has(chunk)) {
          error('A large precomputed chunk was passed to writeChunk without being copied.' + ' Large chunks get enqueued directly and are not copied. This is incompatible with precomputed chunks because you cannot enqueue the same precomputed chunk twice.' + ' Use "cloneChunk" to make a copy of this large precomputed chunk before writing it. This is a bug in React.');
        }
      } // this chunk may overflow a single view which implies it was not
      // one that is cached by the streaming renderer. We will enqueu
      // it directly and expect it is not re-used


      if (writtenBytes > 0) {
        destination.enqueue(new Uint8Array(currentView.buffer, 0, writtenBytes));
        currentView = new Uint8Array(VIEW_SIZE);
        writtenBytes = 0;
      }

      destination.enqueue(chunk);
      return;
    }

    var bytesToWrite = chunk;
    var allowableBytes = currentView.length - writtenBytes;

    if (allowableBytes < bytesToWrite.byteLength) {
      // this chunk would overflow the current view. We enqueue a full view
      // and start a new view with the remaining chunk
      if (allowableBytes === 0) {
        // the current view is already full, send it
        destination.enqueue(currentView);
      } else {
        // fill up the current view and apply the remaining chunk bytes
        // to a new view.
        currentView.set(bytesToWrite.subarray(0, allowableBytes), writtenBytes); // writtenBytes += allowableBytes; // this can be skipped because we are going to immediately reset the view

        destination.enqueue(currentView);
        bytesToWrite = bytesToWrite.subarray(allowableBytes);
      }

      currentView = new Uint8Array(VIEW_SIZE);
      writtenBytes = 0;
    }

    currentView.set(bytesToWrite, writtenBytes);
    writtenBytes += bytesToWrite.byteLength;
  }
  function writeChunkAndReturn(destination, chunk) {
    writeChunk(destination, chunk); // in web streams there is no backpressure so we can alwas write more

    return true;
  }
  function completeWriting(destination) {
    if (currentView && writtenBytes > 0) {
      destination.enqueue(new Uint8Array(currentView.buffer, 0, writtenBytes));
      currentView = null;
      writtenBytes = 0;
    }
  }
  function close(destination) {
    destination.close();
  }
  var textEncoder = new TextEncoder();
  function stringToChunk(content) {
    return textEncoder.encode(content);
  }
  var precomputedChunkSet = new Set() ;
  function stringToPrecomputedChunk(content) {
    var precomputedChunk = textEncoder.encode(content);

    {
      precomputedChunkSet.add(precomputedChunk);
    }

    return precomputedChunk;
  }
  function clonePrecomputedChunk(precomputedChunk) {
    return precomputedChunk.byteLength > VIEW_SIZE ? precomputedChunk.slice() : precomputedChunk;
  }
  function closeWithError(destination, error) {
    // $FlowFixMe[method-unbinding]
    if (typeof destination.error === 'function') {
      // $FlowFixMe[incompatible-call]: This is an Error object or the destination accepts other types.
      destination.error(error);
    } else {
      // Earlier implementations doesn't support this method. In that environment you're
      // supposed to throw from a promise returned but we don't return a promise in our
      // approach. We could fork this implementation but this is environment is an edge
      // case to begin with. It's even less common to run this in an older environment.
      // Even then, this is not where errors are supposed to happen and they get reported
      // to a global callback in addition to this anyway. So it's fine just to close this.
      destination.close();
    }
  }

  var assign = Object.assign;

  /*
   * The `'' + value` pattern (used in perf-sensitive code) throws for Symbol
   * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
   *
   * The functions in this module will throw an easier-to-understand,
   * easier-to-debug exception with a clear errors message message explaining the
   * problem. (Instead of a confusing exception thrown inside the implementation
   * of the `value` object).
   */
  // $FlowFixMe[incompatible-return] only called in DEV, so void return is not possible.
  function typeName(value) {
    {
      // toStringTag is needed for namespaced types like Temporal.Instant
      var hasToStringTag = typeof Symbol === 'function' && Symbol.toStringTag;
      var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || 'Object'; // $FlowFixMe[incompatible-return]

      return type;
    }
  } // $FlowFixMe[incompatible-return] only called in DEV, so void return is not possible.


  function willCoercionThrow(value) {
    {
      try {
        testStringCoercion(value);
        return false;
      } catch (e) {
        return true;
      }
    }
  }

  function testStringCoercion(value) {
    // If you ended up here by following an exception call stack, here's what's
    // happened: you supplied an object or symbol value to React (as a prop, key,
    // DOM attribute, CSS property, string ref, etc.) and when React tried to
    // coerce it to a string using `'' + value`, an exception was thrown.
    //
    // The most common types that will cause this exception are `Symbol` instances
    // and Temporal objects like `Temporal.Instant`. But any object that has a
    // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
    // exception. (Library authors do this to prevent users from using built-in
    // numeric operators like `+` or comparison operators like `>=` because custom
    // methods are needed to perform accurate arithmetic or comparison.)
    //
    // To fix the problem, coerce this object or symbol value to a string before
    // passing it to React. The most reliable way is usually `String(value)`.
    //
    // To find which value is throwing, check the browser or debugger console.
    // Before this exception was thrown, there should be `console.error` output
    // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
    // problem and how that type was used: key, atrribute, input value prop, etc.
    // In most cases, this console output also shows the component and its
    // ancestor components where the exception happened.
    //
    // eslint-disable-next-line react-internal/safe-string-coercion
    return '' + value;
  }

  function checkAttributeStringCoercion(value, attributeName) {
    {
      if (willCoercionThrow(value)) {
        error('The provided `%s` attribute is an unsupported type %s.' + ' This value must be coerced to a string before using it here.', attributeName, typeName(value));

        return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
      }
    }
  }
  function checkOptionStringCoercion(value, propName) {
    {
      if (willCoercionThrow(value)) {
        error('The provided `%s` option is an unsupported type %s.' + ' This value must be coerced to a string before using it here.', propName, typeName(value));

        return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
      }
    }
  }
  function checkCSSPropertyStringCoercion(value, propName) {
    {
      if (willCoercionThrow(value)) {
        error('The provided `%s` CSS property is an unsupported type %s.' + ' This value must be coerced to a string before using it here.', propName, typeName(value));

        return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
      }
    }
  }
  function checkHtmlStringCoercion(value) {
    {
      if (willCoercionThrow(value)) {
        error('The provided HTML markup uses a value of unsupported type %s.' + ' This value must be coerced to a string before using it here.', typeName(value));

        return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
      }
    }
  }

  // -----------------------------------------------------------------------------
  var enableFloat = true; // Enables unstable_useMemoCache hook, intended as a compilation target for
  // Ready for next major.
  //
  // Alias __NEXT_MAJOR__ to true for easier skimming.
  // -----------------------------------------------------------------------------

  var __NEXT_MAJOR__ = true; // Not ready to break experimental yet.
  var enableBigIntSupport = __NEXT_MAJOR__;

  // $FlowFixMe[method-unbinding]
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  /* eslint-disable max-len */

  var ATTRIBUTE_NAME_START_CHAR = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
  /* eslint-enable max-len */

  var ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
  var VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$');
  var illegalAttributeNameCache = {};
  var validatedAttributeNameCache = {};
  function isAttributeNameSafe(attributeName) {
    if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
      return true;
    }

    if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
      return false;
    }

    if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
      validatedAttributeNameCache[attributeName] = true;
      return true;
    }

    illegalAttributeNameCache[attributeName] = true;

    {
      error('Invalid attribute name: `%s`', attributeName);
    }

    return false;
  }

  /**
   * CSS properties which accept numbers but are not in units of "px".
   */
  var unitlessNumbers = new Set(['animationIterationCount', 'aspectRatio', 'borderImageOutset', 'borderImageSlice', 'borderImageWidth', 'boxFlex', 'boxFlexGroup', 'boxOrdinalGroup', 'columnCount', 'columns', 'flex', 'flexGrow', 'flexPositive', 'flexShrink', 'flexNegative', 'flexOrder', 'gridArea', 'gridRow', 'gridRowEnd', 'gridRowSpan', 'gridRowStart', 'gridColumn', 'gridColumnEnd', 'gridColumnSpan', 'gridColumnStart', 'fontWeight', 'lineClamp', 'lineHeight', 'opacity', 'order', 'orphans', 'scale', 'tabSize', 'widows', 'zIndex', 'zoom', 'fillOpacity', // SVG-related properties
  'floodOpacity', 'stopOpacity', 'strokeDasharray', 'strokeDashoffset', 'strokeMiterlimit', 'strokeOpacity', 'strokeWidth', 'MozAnimationIterationCount', // Known Prefixed Properties
  'MozBoxFlex', // TODO: Remove these since they shouldn't be used in modern code
  'MozBoxFlexGroup', 'MozLineClamp', 'msAnimationIterationCount', 'msFlex', 'msZoom', 'msFlexGrow', 'msFlexNegative', 'msFlexOrder', 'msFlexPositive', 'msFlexShrink', 'msGridColumn', 'msGridColumnSpan', 'msGridRow', 'msGridRowSpan', 'WebkitAnimationIterationCount', 'WebkitBoxFlex', 'WebKitBoxFlexGroup', 'WebkitBoxOrdinalGroup', 'WebkitColumnCount', 'WebkitColumns', 'WebkitFlex', 'WebkitFlexGrow', 'WebkitFlexPositive', 'WebkitFlexShrink', 'WebkitLineClamp']);
  function isUnitlessNumber (name) {
    return unitlessNumbers.has(name);
  }

  var aliases = new Map([['acceptCharset', 'accept-charset'], ['htmlFor', 'for'], ['httpEquiv', 'http-equiv'], // HTML and SVG attributes, but the SVG attribute is case sensitive.],
  ['crossOrigin', 'crossorigin'], // This is a list of all SVG attributes that need special casing.
  // Regular attributes that just accept strings.],
  ['accentHeight', 'accent-height'], ['alignmentBaseline', 'alignment-baseline'], ['arabicForm', 'arabic-form'], ['baselineShift', 'baseline-shift'], ['capHeight', 'cap-height'], ['clipPath', 'clip-path'], ['clipRule', 'clip-rule'], ['colorInterpolation', 'color-interpolation'], ['colorInterpolationFilters', 'color-interpolation-filters'], ['colorProfile', 'color-profile'], ['colorRendering', 'color-rendering'], ['dominantBaseline', 'dominant-baseline'], ['enableBackground', 'enable-background'], ['fillOpacity', 'fill-opacity'], ['fillRule', 'fill-rule'], ['floodColor', 'flood-color'], ['floodOpacity', 'flood-opacity'], ['fontFamily', 'font-family'], ['fontSize', 'font-size'], ['fontSizeAdjust', 'font-size-adjust'], ['fontStretch', 'font-stretch'], ['fontStyle', 'font-style'], ['fontVariant', 'font-variant'], ['fontWeight', 'font-weight'], ['glyphName', 'glyph-name'], ['glyphOrientationHorizontal', 'glyph-orientation-horizontal'], ['glyphOrientationVertical', 'glyph-orientation-vertical'], ['horizAdvX', 'horiz-adv-x'], ['horizOriginX', 'horiz-origin-x'], ['imageRendering', 'image-rendering'], ['letterSpacing', 'letter-spacing'], ['lightingColor', 'lighting-color'], ['markerEnd', 'marker-end'], ['markerMid', 'marker-mid'], ['markerStart', 'marker-start'], ['overlinePosition', 'overline-position'], ['overlineThickness', 'overline-thickness'], ['paintOrder', 'paint-order'], ['panose-1', 'panose-1'], ['pointerEvents', 'pointer-events'], ['renderingIntent', 'rendering-intent'], ['shapeRendering', 'shape-rendering'], ['stopColor', 'stop-color'], ['stopOpacity', 'stop-opacity'], ['strikethroughPosition', 'strikethrough-position'], ['strikethroughThickness', 'strikethrough-thickness'], ['strokeDasharray', 'stroke-dasharray'], ['strokeDashoffset', 'stroke-dashoffset'], ['strokeLinecap', 'stroke-linecap'], ['strokeLinejoin', 'stroke-linejoin'], ['strokeMiterlimit', 'stroke-miterlimit'], ['strokeOpacity', 'stroke-opacity'], ['strokeWidth', 'stroke-width'], ['textAnchor', 'text-anchor'], ['textDecoration', 'text-decoration'], ['textRendering', 'text-rendering'], ['transformOrigin', 'transform-origin'], ['underlinePosition', 'underline-position'], ['underlineThickness', 'underline-thickness'], ['unicodeBidi', 'unicode-bidi'], ['unicodeRange', 'unicode-range'], ['unitsPerEm', 'units-per-em'], ['vAlphabetic', 'v-alphabetic'], ['vHanging', 'v-hanging'], ['vIdeographic', 'v-ideographic'], ['vMathematical', 'v-mathematical'], ['vectorEffect', 'vector-effect'], ['vertAdvY', 'vert-adv-y'], ['vertOriginX', 'vert-origin-x'], ['vertOriginY', 'vert-origin-y'], ['wordSpacing', 'word-spacing'], ['writingMode', 'writing-mode'], ['xmlnsXlink', 'xmlns:xlink'], ['xHeight', 'x-height']]);
  function getAttributeAlias (name) {
    return aliases.get(name) || name;
  }

  var hasReadOnlyValue = {
    button: true,
    checkbox: true,
    image: true,
    hidden: true,
    radio: true,
    reset: true,
    submit: true
  };
  function checkControlledValueProps(tagName, props) {
    {
      if (!(hasReadOnlyValue[props.type] || props.onChange || props.onInput || props.readOnly || props.disabled || props.value == null)) {
        if (tagName === 'select') {
          error('You provided a `value` prop to a form field without an ' + '`onChange` handler. This will render a read-only field. If ' + 'the field should be mutable use `defaultValue`. Otherwise, set `onChange`.');
        } else {
          error('You provided a `value` prop to a form field without an ' + '`onChange` handler. This will render a read-only field. If ' + 'the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.');
        }
      }

      if (!(props.onChange || props.readOnly || props.disabled || props.checked == null)) {
        error('You provided a `checked` prop to a form field without an ' + '`onChange` handler. This will render a read-only field. If ' + 'the field should be mutable use `defaultChecked`. Otherwise, ' + 'set either `onChange` or `readOnly`.');
      }
    }
  }

  var ariaProperties = {
    'aria-current': 0,
    // state
    'aria-description': 0,
    'aria-details': 0,
    'aria-disabled': 0,
    // state
    'aria-hidden': 0,
    // state
    'aria-invalid': 0,
    // state
    'aria-keyshortcuts': 0,
    'aria-label': 0,
    'aria-roledescription': 0,
    // Widget Attributes
    'aria-autocomplete': 0,
    'aria-checked': 0,
    'aria-expanded': 0,
    'aria-haspopup': 0,
    'aria-level': 0,
    'aria-modal': 0,
    'aria-multiline': 0,
    'aria-multiselectable': 0,
    'aria-orientation': 0,
    'aria-placeholder': 0,
    'aria-pressed': 0,
    'aria-readonly': 0,
    'aria-required': 0,
    'aria-selected': 0,
    'aria-sort': 0,
    'aria-valuemax': 0,
    'aria-valuemin': 0,
    'aria-valuenow': 0,
    'aria-valuetext': 0,
    // Live Region Attributes
    'aria-atomic': 0,
    'aria-busy': 0,
    'aria-live': 0,
    'aria-relevant': 0,
    // Drag-and-Drop Attributes
    'aria-dropeffect': 0,
    'aria-grabbed': 0,
    // Relationship Attributes
    'aria-activedescendant': 0,
    'aria-colcount': 0,
    'aria-colindex': 0,
    'aria-colspan': 0,
    'aria-controls': 0,
    'aria-describedby': 0,
    'aria-errormessage': 0,
    'aria-flowto': 0,
    'aria-labelledby': 0,
    'aria-owns': 0,
    'aria-posinset': 0,
    'aria-rowcount': 0,
    'aria-rowindex': 0,
    'aria-rowspan': 0,
    'aria-setsize': 0
  };

  var warnedProperties$1 = {};
  var rARIA$1 = new RegExp('^(aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$');
  var rARIACamel$1 = new RegExp('^(aria)[A-Z][' + ATTRIBUTE_NAME_CHAR + ']*$');

  function validateProperty$1(tagName, name) {
    {
      if (hasOwnProperty.call(warnedProperties$1, name) && warnedProperties$1[name]) {
        return true;
      }

      if (rARIACamel$1.test(name)) {
        var ariaName = 'aria-' + name.slice(4).toLowerCase();
        var correctName = ariaProperties.hasOwnProperty(ariaName) ? ariaName : null; // If this is an aria-* attribute, but is not listed in the known DOM
        // DOM properties, then it is an invalid aria-* attribute.

        if (correctName == null) {
          error('Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.', name);

          warnedProperties$1[name] = true;
          return true;
        } // aria-* attributes should be lowercase; suggest the lowercase version.


        if (name !== correctName) {
          error('Invalid ARIA attribute `%s`. Did you mean `%s`?', name, correctName);

          warnedProperties$1[name] = true;
          return true;
        }
      }

      if (rARIA$1.test(name)) {
        var lowerCasedName = name.toLowerCase();
        var standardName = ariaProperties.hasOwnProperty(lowerCasedName) ? lowerCasedName : null; // If this is an aria-* attribute, but is not listed in the known DOM
        // DOM properties, then it is an invalid aria-* attribute.

        if (standardName == null) {
          warnedProperties$1[name] = true;
          return false;
        } // aria-* attributes should be lowercase; suggest the lowercase version.


        if (name !== standardName) {
          error('Unknown ARIA attribute `%s`. Did you mean `%s`?', name, standardName);

          warnedProperties$1[name] = true;
          return true;
        }
      }
    }

    return true;
  }

  function validateProperties$2(type, props) {
    {
      var invalidProps = [];

      for (var key in props) {
        var isValid = validateProperty$1(type, key);

        if (!isValid) {
          invalidProps.push(key);
        }
      }

      var unknownPropString = invalidProps.map(function (prop) {
        return '`' + prop + '`';
      }).join(', ');

      if (invalidProps.length === 1) {
        error('Invalid aria prop %s on <%s> tag. ' + 'For details, see https://reactjs.org/link/invalid-aria-props', unknownPropString, type);
      } else if (invalidProps.length > 1) {
        error('Invalid aria props %s on <%s> tag. ' + 'For details, see https://reactjs.org/link/invalid-aria-props', unknownPropString, type);
      }
    }
  }

  var didWarnValueNull = false;
  function validateProperties$1(type, props) {
    {
      if (type !== 'input' && type !== 'textarea' && type !== 'select') {
        return;
      }

      if (props != null && props.value === null && !didWarnValueNull) {
        didWarnValueNull = true;

        if (type === 'select' && props.multiple) {
          error('`value` prop on `%s` should not be null. ' + 'Consider using an empty array when `multiple` is set to `true` ' + 'to clear the component or `undefined` for uncontrolled components.', type);
        } else {
          error('`value` prop on `%s` should not be null. ' + 'Consider using an empty string to clear the component or `undefined` ' + 'for uncontrolled components.', type);
        }
      }
    }
  }

  function isCustomElement(tagName, props) {
    if (tagName.indexOf('-') === -1) {
      return false;
    }

    switch (tagName) {
      // These are reserved SVG and MathML elements.
      // We don't mind this list too much because we expect it to never grow.
      // The alternative is to track the namespace in a few places which is convoluted.
      // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
      case 'annotation-xml':
      case 'color-profile':
      case 'font-face':
      case 'font-face-src':
      case 'font-face-uri':
      case 'font-face-format':
      case 'font-face-name':
      case 'missing-glyph':
        return false;

      default:
        return true;
    }
  }

  // When adding attributes to the HTML or SVG allowed attribute list, be sure to
  // also add them to this module to ensure casing and incorrect name
  // warnings.
  var possibleStandardNames = {
    // HTML
    accept: 'accept',
    acceptcharset: 'acceptCharset',
    'accept-charset': 'acceptCharset',
    accesskey: 'accessKey',
    action: 'action',
    allowfullscreen: 'allowFullScreen',
    alt: 'alt',
    as: 'as',
    async: 'async',
    autocapitalize: 'autoCapitalize',
    autocomplete: 'autoComplete',
    autocorrect: 'autoCorrect',
    autofocus: 'autoFocus',
    autoplay: 'autoPlay',
    autosave: 'autoSave',
    capture: 'capture',
    cellpadding: 'cellPadding',
    cellspacing: 'cellSpacing',
    challenge: 'challenge',
    charset: 'charSet',
    checked: 'checked',
    children: 'children',
    cite: 'cite',
    class: 'className',
    classid: 'classID',
    classname: 'className',
    cols: 'cols',
    colspan: 'colSpan',
    content: 'content',
    contenteditable: 'contentEditable',
    contextmenu: 'contextMenu',
    controls: 'controls',
    controlslist: 'controlsList',
    coords: 'coords',
    crossorigin: 'crossOrigin',
    dangerouslysetinnerhtml: 'dangerouslySetInnerHTML',
    data: 'data',
    datetime: 'dateTime',
    default: 'default',
    defaultchecked: 'defaultChecked',
    defaultvalue: 'defaultValue',
    defer: 'defer',
    dir: 'dir',
    disabled: 'disabled',
    disablepictureinpicture: 'disablePictureInPicture',
    disableremoteplayback: 'disableRemotePlayback',
    download: 'download',
    draggable: 'draggable',
    enctype: 'encType',
    enterkeyhint: 'enterKeyHint',
    fetchpriority: 'fetchPriority',
    for: 'htmlFor',
    form: 'form',
    formmethod: 'formMethod',
    formaction: 'formAction',
    formenctype: 'formEncType',
    formnovalidate: 'formNoValidate',
    formtarget: 'formTarget',
    frameborder: 'frameBorder',
    headers: 'headers',
    height: 'height',
    hidden: 'hidden',
    high: 'high',
    href: 'href',
    hreflang: 'hrefLang',
    htmlfor: 'htmlFor',
    httpequiv: 'httpEquiv',
    'http-equiv': 'httpEquiv',
    icon: 'icon',
    id: 'id',
    imagesizes: 'imageSizes',
    imagesrcset: 'imageSrcSet',
    innerhtml: 'innerHTML',
    inputmode: 'inputMode',
    integrity: 'integrity',
    is: 'is',
    itemid: 'itemID',
    itemprop: 'itemProp',
    itemref: 'itemRef',
    itemscope: 'itemScope',
    itemtype: 'itemType',
    keyparams: 'keyParams',
    keytype: 'keyType',
    kind: 'kind',
    label: 'label',
    lang: 'lang',
    list: 'list',
    loop: 'loop',
    low: 'low',
    manifest: 'manifest',
    marginwidth: 'marginWidth',
    marginheight: 'marginHeight',
    max: 'max',
    maxlength: 'maxLength',
    media: 'media',
    mediagroup: 'mediaGroup',
    method: 'method',
    min: 'min',
    minlength: 'minLength',
    multiple: 'multiple',
    muted: 'muted',
    name: 'name',
    nomodule: 'noModule',
    nonce: 'nonce',
    novalidate: 'noValidate',
    open: 'open',
    optimum: 'optimum',
    pattern: 'pattern',
    placeholder: 'placeholder',
    playsinline: 'playsInline',
    poster: 'poster',
    preload: 'preload',
    profile: 'profile',
    radiogroup: 'radioGroup',
    readonly: 'readOnly',
    referrerpolicy: 'referrerPolicy',
    rel: 'rel',
    required: 'required',
    reversed: 'reversed',
    role: 'role',
    rows: 'rows',
    rowspan: 'rowSpan',
    sandbox: 'sandbox',
    scope: 'scope',
    scoped: 'scoped',
    scrolling: 'scrolling',
    seamless: 'seamless',
    selected: 'selected',
    shape: 'shape',
    size: 'size',
    sizes: 'sizes',
    span: 'span',
    spellcheck: 'spellCheck',
    src: 'src',
    srcdoc: 'srcDoc',
    srclang: 'srcLang',
    srcset: 'srcSet',
    start: 'start',
    step: 'step',
    style: 'style',
    summary: 'summary',
    tabindex: 'tabIndex',
    target: 'target',
    title: 'title',
    type: 'type',
    usemap: 'useMap',
    value: 'value',
    width: 'width',
    wmode: 'wmode',
    wrap: 'wrap',
    // SVG
    about: 'about',
    accentheight: 'accentHeight',
    'accent-height': 'accentHeight',
    accumulate: 'accumulate',
    additive: 'additive',
    alignmentbaseline: 'alignmentBaseline',
    'alignment-baseline': 'alignmentBaseline',
    allowreorder: 'allowReorder',
    alphabetic: 'alphabetic',
    amplitude: 'amplitude',
    arabicform: 'arabicForm',
    'arabic-form': 'arabicForm',
    ascent: 'ascent',
    attributename: 'attributeName',
    attributetype: 'attributeType',
    autoreverse: 'autoReverse',
    azimuth: 'azimuth',
    basefrequency: 'baseFrequency',
    baselineshift: 'baselineShift',
    'baseline-shift': 'baselineShift',
    baseprofile: 'baseProfile',
    bbox: 'bbox',
    begin: 'begin',
    bias: 'bias',
    by: 'by',
    calcmode: 'calcMode',
    capheight: 'capHeight',
    'cap-height': 'capHeight',
    clip: 'clip',
    clippath: 'clipPath',
    'clip-path': 'clipPath',
    clippathunits: 'clipPathUnits',
    cliprule: 'clipRule',
    'clip-rule': 'clipRule',
    color: 'color',
    colorinterpolation: 'colorInterpolation',
    'color-interpolation': 'colorInterpolation',
    colorinterpolationfilters: 'colorInterpolationFilters',
    'color-interpolation-filters': 'colorInterpolationFilters',
    colorprofile: 'colorProfile',
    'color-profile': 'colorProfile',
    colorrendering: 'colorRendering',
    'color-rendering': 'colorRendering',
    contentscripttype: 'contentScriptType',
    contentstyletype: 'contentStyleType',
    cursor: 'cursor',
    cx: 'cx',
    cy: 'cy',
    d: 'd',
    datatype: 'datatype',
    decelerate: 'decelerate',
    descent: 'descent',
    diffuseconstant: 'diffuseConstant',
    direction: 'direction',
    display: 'display',
    divisor: 'divisor',
    dominantbaseline: 'dominantBaseline',
    'dominant-baseline': 'dominantBaseline',
    dur: 'dur',
    dx: 'dx',
    dy: 'dy',
    edgemode: 'edgeMode',
    elevation: 'elevation',
    enablebackground: 'enableBackground',
    'enable-background': 'enableBackground',
    end: 'end',
    exponent: 'exponent',
    externalresourcesrequired: 'externalResourcesRequired',
    fill: 'fill',
    fillopacity: 'fillOpacity',
    'fill-opacity': 'fillOpacity',
    fillrule: 'fillRule',
    'fill-rule': 'fillRule',
    filter: 'filter',
    filterres: 'filterRes',
    filterunits: 'filterUnits',
    floodopacity: 'floodOpacity',
    'flood-opacity': 'floodOpacity',
    floodcolor: 'floodColor',
    'flood-color': 'floodColor',
    focusable: 'focusable',
    fontfamily: 'fontFamily',
    'font-family': 'fontFamily',
    fontsize: 'fontSize',
    'font-size': 'fontSize',
    fontsizeadjust: 'fontSizeAdjust',
    'font-size-adjust': 'fontSizeAdjust',
    fontstretch: 'fontStretch',
    'font-stretch': 'fontStretch',
    fontstyle: 'fontStyle',
    'font-style': 'fontStyle',
    fontvariant: 'fontVariant',
    'font-variant': 'fontVariant',
    fontweight: 'fontWeight',
    'font-weight': 'fontWeight',
    format: 'format',
    from: 'from',
    fx: 'fx',
    fy: 'fy',
    g1: 'g1',
    g2: 'g2',
    glyphname: 'glyphName',
    'glyph-name': 'glyphName',
    glyphorientationhorizontal: 'glyphOrientationHorizontal',
    'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
    glyphorientationvertical: 'glyphOrientationVertical',
    'glyph-orientation-vertical': 'glyphOrientationVertical',
    glyphref: 'glyphRef',
    gradienttransform: 'gradientTransform',
    gradientunits: 'gradientUnits',
    hanging: 'hanging',
    horizadvx: 'horizAdvX',
    'horiz-adv-x': 'horizAdvX',
    horizoriginx: 'horizOriginX',
    'horiz-origin-x': 'horizOriginX',
    ideographic: 'ideographic',
    imagerendering: 'imageRendering',
    'image-rendering': 'imageRendering',
    in2: 'in2',
    in: 'in',
    inlist: 'inlist',
    intercept: 'intercept',
    k1: 'k1',
    k2: 'k2',
    k3: 'k3',
    k4: 'k4',
    k: 'k',
    kernelmatrix: 'kernelMatrix',
    kernelunitlength: 'kernelUnitLength',
    kerning: 'kerning',
    keypoints: 'keyPoints',
    keysplines: 'keySplines',
    keytimes: 'keyTimes',
    lengthadjust: 'lengthAdjust',
    letterspacing: 'letterSpacing',
    'letter-spacing': 'letterSpacing',
    lightingcolor: 'lightingColor',
    'lighting-color': 'lightingColor',
    limitingconeangle: 'limitingConeAngle',
    local: 'local',
    markerend: 'markerEnd',
    'marker-end': 'markerEnd',
    markerheight: 'markerHeight',
    markermid: 'markerMid',
    'marker-mid': 'markerMid',
    markerstart: 'markerStart',
    'marker-start': 'markerStart',
    markerunits: 'markerUnits',
    markerwidth: 'markerWidth',
    mask: 'mask',
    maskcontentunits: 'maskContentUnits',
    maskunits: 'maskUnits',
    mathematical: 'mathematical',
    mode: 'mode',
    numoctaves: 'numOctaves',
    offset: 'offset',
    opacity: 'opacity',
    operator: 'operator',
    order: 'order',
    orient: 'orient',
    orientation: 'orientation',
    origin: 'origin',
    overflow: 'overflow',
    overlineposition: 'overlinePosition',
    'overline-position': 'overlinePosition',
    overlinethickness: 'overlineThickness',
    'overline-thickness': 'overlineThickness',
    paintorder: 'paintOrder',
    'paint-order': 'paintOrder',
    panose1: 'panose1',
    'panose-1': 'panose1',
    pathlength: 'pathLength',
    patterncontentunits: 'patternContentUnits',
    patterntransform: 'patternTransform',
    patternunits: 'patternUnits',
    pointerevents: 'pointerEvents',
    'pointer-events': 'pointerEvents',
    points: 'points',
    pointsatx: 'pointsAtX',
    pointsaty: 'pointsAtY',
    pointsatz: 'pointsAtZ',
    prefix: 'prefix',
    preservealpha: 'preserveAlpha',
    preserveaspectratio: 'preserveAspectRatio',
    primitiveunits: 'primitiveUnits',
    property: 'property',
    r: 'r',
    radius: 'radius',
    refx: 'refX',
    refy: 'refY',
    renderingintent: 'renderingIntent',
    'rendering-intent': 'renderingIntent',
    repeatcount: 'repeatCount',
    repeatdur: 'repeatDur',
    requiredextensions: 'requiredExtensions',
    requiredfeatures: 'requiredFeatures',
    resource: 'resource',
    restart: 'restart',
    result: 'result',
    results: 'results',
    rotate: 'rotate',
    rx: 'rx',
    ry: 'ry',
    scale: 'scale',
    security: 'security',
    seed: 'seed',
    shaperendering: 'shapeRendering',
    'shape-rendering': 'shapeRendering',
    slope: 'slope',
    spacing: 'spacing',
    specularconstant: 'specularConstant',
    specularexponent: 'specularExponent',
    speed: 'speed',
    spreadmethod: 'spreadMethod',
    startoffset: 'startOffset',
    stddeviation: 'stdDeviation',
    stemh: 'stemh',
    stemv: 'stemv',
    stitchtiles: 'stitchTiles',
    stopcolor: 'stopColor',
    'stop-color': 'stopColor',
    stopopacity: 'stopOpacity',
    'stop-opacity': 'stopOpacity',
    strikethroughposition: 'strikethroughPosition',
    'strikethrough-position': 'strikethroughPosition',
    strikethroughthickness: 'strikethroughThickness',
    'strikethrough-thickness': 'strikethroughThickness',
    string: 'string',
    stroke: 'stroke',
    strokedasharray: 'strokeDasharray',
    'stroke-dasharray': 'strokeDasharray',
    strokedashoffset: 'strokeDashoffset',
    'stroke-dashoffset': 'strokeDashoffset',
    strokelinecap: 'strokeLinecap',
    'stroke-linecap': 'strokeLinecap',
    strokelinejoin: 'strokeLinejoin',
    'stroke-linejoin': 'strokeLinejoin',
    strokemiterlimit: 'strokeMiterlimit',
    'stroke-miterlimit': 'strokeMiterlimit',
    strokewidth: 'strokeWidth',
    'stroke-width': 'strokeWidth',
    strokeopacity: 'strokeOpacity',
    'stroke-opacity': 'strokeOpacity',
    suppresscontenteditablewarning: 'suppressContentEditableWarning',
    suppresshydrationwarning: 'suppressHydrationWarning',
    surfacescale: 'surfaceScale',
    systemlanguage: 'systemLanguage',
    tablevalues: 'tableValues',
    targetx: 'targetX',
    targety: 'targetY',
    textanchor: 'textAnchor',
    'text-anchor': 'textAnchor',
    textdecoration: 'textDecoration',
    'text-decoration': 'textDecoration',
    textlength: 'textLength',
    textrendering: 'textRendering',
    'text-rendering': 'textRendering',
    to: 'to',
    transform: 'transform',
    transformorigin: 'transformOrigin',
    'transform-origin': 'transformOrigin',
    typeof: 'typeof',
    u1: 'u1',
    u2: 'u2',
    underlineposition: 'underlinePosition',
    'underline-position': 'underlinePosition',
    underlinethickness: 'underlineThickness',
    'underline-thickness': 'underlineThickness',
    unicode: 'unicode',
    unicodebidi: 'unicodeBidi',
    'unicode-bidi': 'unicodeBidi',
    unicoderange: 'unicodeRange',
    'unicode-range': 'unicodeRange',
    unitsperem: 'unitsPerEm',
    'units-per-em': 'unitsPerEm',
    unselectable: 'unselectable',
    valphabetic: 'vAlphabetic',
    'v-alphabetic': 'vAlphabetic',
    values: 'values',
    vectoreffect: 'vectorEffect',
    'vector-effect': 'vectorEffect',
    version: 'version',
    vertadvy: 'vertAdvY',
    'vert-adv-y': 'vertAdvY',
    vertoriginx: 'vertOriginX',
    'vert-origin-x': 'vertOriginX',
    vertoriginy: 'vertOriginY',
    'vert-origin-y': 'vertOriginY',
    vhanging: 'vHanging',
    'v-hanging': 'vHanging',
    videographic: 'vIdeographic',
    'v-ideographic': 'vIdeographic',
    viewbox: 'viewBox',
    viewtarget: 'viewTarget',
    visibility: 'visibility',
    vmathematical: 'vMathematical',
    'v-mathematical': 'vMathematical',
    vocab: 'vocab',
    widths: 'widths',
    wordspacing: 'wordSpacing',
    'word-spacing': 'wordSpacing',
    writingmode: 'writingMode',
    'writing-mode': 'writingMode',
    x1: 'x1',
    x2: 'x2',
    x: 'x',
    xchannelselector: 'xChannelSelector',
    xheight: 'xHeight',
    'x-height': 'xHeight',
    xlinkactuate: 'xlinkActuate',
    'xlink:actuate': 'xlinkActuate',
    xlinkarcrole: 'xlinkArcrole',
    'xlink:arcrole': 'xlinkArcrole',
    xlinkhref: 'xlinkHref',
    'xlink:href': 'xlinkHref',
    xlinkrole: 'xlinkRole',
    'xlink:role': 'xlinkRole',
    xlinkshow: 'xlinkShow',
    'xlink:show': 'xlinkShow',
    xlinktitle: 'xlinkTitle',
    'xlink:title': 'xlinkTitle',
    xlinktype: 'xlinkType',
    'xlink:type': 'xlinkType',
    xmlbase: 'xmlBase',
    'xml:base': 'xmlBase',
    xmllang: 'xmlLang',
    'xml:lang': 'xmlLang',
    xmlns: 'xmlns',
    'xml:space': 'xmlSpace',
    xmlnsxlink: 'xmlnsXlink',
    'xmlns:xlink': 'xmlnsXlink',
    xmlspace: 'xmlSpace',
    y1: 'y1',
    y2: 'y2',
    y: 'y',
    ychannelselector: 'yChannelSelector',
    z: 'z',
    zoomandpan: 'zoomAndPan'
  };

  var warnedProperties = {};
  var EVENT_NAME_REGEX = /^on./;
  var INVALID_EVENT_NAME_REGEX = /^on[^A-Z]/;
  var rARIA = new RegExp('^(aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$') ;
  var rARIACamel = new RegExp('^(aria)[A-Z][' + ATTRIBUTE_NAME_CHAR + ']*$') ;

  function validateProperty(tagName, name, value, eventRegistry) {
    {
      if (hasOwnProperty.call(warnedProperties, name) && warnedProperties[name]) {
        return true;
      }

      var lowerCasedName = name.toLowerCase();

      if (lowerCasedName === 'onfocusin' || lowerCasedName === 'onfocusout') {
        error('React uses onFocus and onBlur instead of onFocusIn and onFocusOut. ' + 'All React events are normalized to bubble, so onFocusIn and onFocusOut ' + 'are not needed/supported by React.');

        warnedProperties[name] = true;
        return true;
      }

      {
        // Actions are special because unlike events they can have other value types.
        if (typeof value === 'function') {
          if (tagName === 'form' && name === 'action') {
            return true;
          }

          if (tagName === 'input' && name === 'formAction') {
            return true;
          }

          if (tagName === 'button' && name === 'formAction') {
            return true;
          }
        }
      } // We can't rely on the event system being injected on the server.


      if (eventRegistry != null) {
        var registrationNameDependencies = eventRegistry.registrationNameDependencies,
            possibleRegistrationNames = eventRegistry.possibleRegistrationNames;

        if (registrationNameDependencies.hasOwnProperty(name)) {
          return true;
        }

        var registrationName = possibleRegistrationNames.hasOwnProperty(lowerCasedName) ? possibleRegistrationNames[lowerCasedName] : null;

        if (registrationName != null) {
          error('Invalid event handler property `%s`. Did you mean `%s`?', name, registrationName);

          warnedProperties[name] = true;
          return true;
        }

        if (EVENT_NAME_REGEX.test(name)) {
          error('Unknown event handler property `%s`. It will be ignored.', name);

          warnedProperties[name] = true;
          return true;
        }
      } else if (EVENT_NAME_REGEX.test(name)) {
        // If no event plugins have been injected, we are in a server environment.
        // So we can't tell if the event name is correct for sure, but we can filter
        // out known bad ones like `onclick`. We can't suggest a specific replacement though.
        if (INVALID_EVENT_NAME_REGEX.test(name)) {
          error('Invalid event handler property `%s`. ' + 'React events use the camelCase naming convention, for example `onClick`.', name);
        }

        warnedProperties[name] = true;
        return true;
      } // Let the ARIA attribute hook validate ARIA attributes


      if (rARIA.test(name) || rARIACamel.test(name)) {
        return true;
      }

      if (lowerCasedName === 'innerhtml') {
        error('Directly setting property `innerHTML` is not permitted. ' + 'For more information, lookup documentation on `dangerouslySetInnerHTML`.');

        warnedProperties[name] = true;
        return true;
      }

      if (lowerCasedName === 'aria') {
        error('The `aria` attribute is reserved for future use in React. ' + 'Pass individual `aria-` attributes instead.');

        warnedProperties[name] = true;
        return true;
      }

      if (lowerCasedName === 'is' && value !== null && value !== undefined && typeof value !== 'string') {
        error('Received a `%s` for a string attribute `is`. If this is expected, cast ' + 'the value to a string.', typeof value);

        warnedProperties[name] = true;
        return true;
      }

      if (typeof value === 'number' && isNaN(value)) {
        error('Received NaN for the `%s` attribute. If this is expected, cast ' + 'the value to a string.', name);

        warnedProperties[name] = true;
        return true;
      } // Known attributes should match the casing specified in the property config.


      if (possibleStandardNames.hasOwnProperty(lowerCasedName)) {
        var standardName = possibleStandardNames[lowerCasedName];

        if (standardName !== name) {
          error('Invalid DOM property `%s`. Did you mean `%s`?', name, standardName);

          warnedProperties[name] = true;
          return true;
        }
      } else if (name !== lowerCasedName) {
        // Unknown attributes should have lowercase casing since that's how they
        // will be cased anyway with server rendering.
        error('React does not recognize the `%s` prop on a DOM element. If you ' + 'intentionally want it to appear in the DOM as a custom ' + 'attribute, spell it as lowercase `%s` instead. ' + 'If you accidentally passed it from a parent component, remove ' + 'it from the DOM element.', name, lowerCasedName);

        warnedProperties[name] = true;
        return true;
      } // Now that we've validated casing, do not validate
      // data types for reserved props


      switch (name) {
        case 'dangerouslySetInnerHTML':
        case 'children':
        case 'style':
        case 'suppressContentEditableWarning':
        case 'suppressHydrationWarning':
        case 'defaultValue': // Reserved

        case 'defaultChecked':
        case 'innerHTML':
        case 'ref':
          {
            return true;
          }

        case 'innerText': // Properties

        case 'textContent':
          {
            return true;
          }

      }

      switch (typeof value) {
        case 'boolean':
          {
            switch (name) {
              case 'autoFocus':
              case 'checked':
              case 'multiple':
              case 'muted':
              case 'selected':
              case 'contentEditable':
              case 'spellCheck':
              case 'draggable':
              case 'value':
              case 'autoReverse':
              case 'externalResourcesRequired':
              case 'focusable':
              case 'preserveAlpha':
              case 'allowFullScreen':
              case 'async':
              case 'autoPlay':
              case 'controls':
              case 'default':
              case 'defer':
              case 'disabled':
              case 'disablePictureInPicture':
              case 'disableRemotePlayback':
              case 'formNoValidate':
              case 'hidden':
              case 'loop':
              case 'noModule':
              case 'noValidate':
              case 'open':
              case 'playsInline':
              case 'readOnly':
              case 'required':
              case 'reversed':
              case 'scoped':
              case 'seamless':
              case 'itemScope':
              case 'capture':
              case 'download':
                {
                  // Boolean properties can accept boolean values
                  return true;
                }

              default:
                {
                  var prefix = name.toLowerCase().slice(0, 5);

                  if (prefix === 'data-' || prefix === 'aria-') {
                    return true;
                  }

                  if (value) {
                    error('Received `%s` for a non-boolean attribute `%s`.\n\n' + 'If you want to write it to the DOM, pass a string instead: ' + '%s="%s" or %s={value.toString()}.', value, name, name, value, name);
                  } else {
                    error('Received `%s` for a non-boolean attribute `%s`.\n\n' + 'If you want to write it to the DOM, pass a string instead: ' + '%s="%s" or %s={value.toString()}.\n\n' + 'If you used to conditionally omit it with %s={condition && value}, ' + 'pass %s={condition ? value : undefined} instead.', value, name, name, value, name, name, name);
                  }

                  warnedProperties[name] = true;
                  return true;
                }
            }
          }

        case 'function':
        case 'symbol':
          // eslint-disable-line
          // Warn when a known attribute is a bad type
          warnedProperties[name] = true;
          return false;

        case 'string':
          {
            // Warn when passing the strings 'false' or 'true' into a boolean prop
            if (value === 'false' || value === 'true') {
              switch (name) {
                case 'checked':
                case 'selected':
                case 'multiple':
                case 'muted':
                case 'allowFullScreen':
                case 'async':
                case 'autoPlay':
                case 'controls':
                case 'default':
                case 'defer':
                case 'disabled':
                case 'disablePictureInPicture':
                case 'disableRemotePlayback':
                case 'formNoValidate':
                case 'loop':
                case 'noModule':
                case 'noValidate':
                case 'open':
                case 'playsInline':
                case 'readOnly':
                case 'required':
                case 'reversed':
                case 'scoped':
                case 'seamless':
                case 'itemScope':
                  {
                    break;
                  }

                case 'hidden':
                // fallthrough to overloaded boolean with enableNewDOMProps

                default:
                  {
                    return true;
                  }
              }

              error('Received the string `%s` for the boolean attribute `%s`. ' + '%s ' + 'Did you mean %s={%s}?', value, name, value === 'false' ? 'The browser will interpret it as a truthy value.' : 'Although this works, it will not work as expected if you pass the string "false".', name, value);

              warnedProperties[name] = true;
              return true;
            }
          }
      }

      return true;
    }
  }

  function warnUnknownProperties(type, props, eventRegistry) {
    {
      var unknownProps = [];

      for (var key in props) {
        var isValid = validateProperty(type, key, props[key], eventRegistry);

        if (!isValid) {
          unknownProps.push(key);
        }
      }

      var unknownPropString = unknownProps.map(function (prop) {
        return '`' + prop + '`';
      }).join(', ');

      if (unknownProps.length === 1) {
        error('Invalid value for prop %s on <%s> tag. Either remove it from the element, ' + 'or pass a string or number value to keep it in the DOM. ' + 'For details, see https://reactjs.org/link/attribute-behavior ', unknownPropString, type);
      } else if (unknownProps.length > 1) {
        error('Invalid values for props %s on <%s> tag. Either remove them from the element, ' + 'or pass a string or number value to keep them in the DOM. ' + 'For details, see https://reactjs.org/link/attribute-behavior ', unknownPropString, type);
      }
    }
  }

  function validateProperties(type, props, eventRegistry) {
    if (isCustomElement(type) || typeof props.is === 'string') {
      return;
    }

    warnUnknownProperties(type, props, eventRegistry);
  }

  // 'msTransform' is correct, but the other prefixes should be capitalized
  var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;
  var msPattern$1 = /^-ms-/;
  var hyphenPattern = /-(.)/g; // style values shouldn't contain a semicolon

  var badStyleValueWithSemicolonPattern = /;\s*$/;
  var warnedStyleNames = {};
  var warnedStyleValues = {};
  var warnedForNaNValue = false;
  var warnedForInfinityValue = false;

  function camelize(string) {
    return string.replace(hyphenPattern, function (_, character) {
      return character.toUpperCase();
    });
  }

  function warnHyphenatedStyleName(name) {
    {
      if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
        return;
      }

      warnedStyleNames[name] = true;

      error('Unsupported style property %s. Did you mean %s?', name, // As Andi Smith suggests
      // (http://www.andismith.com/blog/2012/02/modernizr-prefixed/), an `-ms` prefix
      // is converted to lowercase `ms`.
      camelize(name.replace(msPattern$1, 'ms-')));
    }
  }

  function warnBadVendoredStyleName(name) {
    {
      if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
        return;
      }

      warnedStyleNames[name] = true;

      error('Unsupported vendor-prefixed style property %s. Did you mean %s?', name, name.charAt(0).toUpperCase() + name.slice(1));
    }
  }

  function warnStyleValueWithSemicolon(name, value) {
    {
      if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
        return;
      }

      warnedStyleValues[value] = true;

      error("Style property values shouldn't contain a semicolon. " + 'Try "%s: %s" instead.', name, value.replace(badStyleValueWithSemicolonPattern, ''));
    }
  }

  function warnStyleValueIsNaN(name, value) {
    {
      if (warnedForNaNValue) {
        return;
      }

      warnedForNaNValue = true;

      error('`NaN` is an invalid value for the `%s` css style property.', name);
    }
  }

  function warnStyleValueIsInfinity(name, value) {
    {
      if (warnedForInfinityValue) {
        return;
      }

      warnedForInfinityValue = true;

      error('`Infinity` is an invalid value for the `%s` css style property.', name);
    }
  }

  function warnValidStyle(name, value) {
    {
      if (name.indexOf('-') > -1) {
        warnHyphenatedStyleName(name);
      } else if (badVendoredStyleNamePattern.test(name)) {
        warnBadVendoredStyleName(name);
      } else if (badStyleValueWithSemicolonPattern.test(value)) {
        warnStyleValueWithSemicolon(name, value);
      }

      if (typeof value === 'number') {
        if (isNaN(value)) {
          warnStyleValueIsNaN(name);
        } else if (!isFinite(value)) {
          warnStyleValueIsInfinity(name);
        }
      }
    }
  }

  function getCrossOriginString(input) {
    if (typeof input === 'string') {
      return input === 'use-credentials' ? input : '';
    }

    return undefined;
  }

  // code copied and modified from escape-html
  var matchHtmlRegExp = /["'&<>]/;
  /**
   * Escapes special characters and HTML entities in a given html string.
   *
   * @param  {string} string HTML string to escape for later insertion
   * @return {string}
   * @public
   */

  function escapeHtml(string) {
    {
      checkHtmlStringCoercion(string);
    }

    var str = '' + string;
    var match = matchHtmlRegExp.exec(str);

    if (!match) {
      return str;
    }

    var escape;
    var html = '';
    var index;
    var lastIndex = 0;

    for (index = match.index; index < str.length; index++) {
      switch (str.charCodeAt(index)) {
        case 34:
          // "
          escape = '&quot;';
          break;

        case 38:
          // &
          escape = '&amp;';
          break;

        case 39:
          // '
          escape = '&#x27;'; // modified from escape-html; used to be '&#39'

          break;

        case 60:
          // <
          escape = '&lt;';
          break;

        case 62:
          // >
          escape = '&gt;';
          break;

        default:
          continue;
      }

      if (lastIndex !== index) {
        html += str.slice(lastIndex, index);
      }

      lastIndex = index + 1;
      html += escape;
    }

    return lastIndex !== index ? html + str.slice(lastIndex, index) : html;
  } // end code copied and modified from escape-html

  /**
   * Escapes text to prevent scripting attacks.
   *
   * @param {*} text Text value to escape.
   * @return {string} An escaped string.
   */


  function escapeTextForBrowser(text) {
    if (typeof text === 'boolean' || typeof text === 'number' || typeof text === 'bigint') {
      // this shortcircuit helps perf for types that we know will never have
      // special characters, especially given that this function is used often
      // for numeric dom ids.
      return '' + text;
    }

    return escapeHtml(text);
  }

  var uppercasePattern = /([A-Z])/g;
  var msPattern = /^ms-/;
  /**
   * Hyphenates a camelcased CSS property name, for example:
   *
   *   > hyphenateStyleName('backgroundColor')
   *   < "background-color"
   *   > hyphenateStyleName('MozTransition')
   *   < "-moz-transition"
   *   > hyphenateStyleName('msTransition')
   *   < "-ms-transition"
   *
   * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
   * is converted to `-ms-`.
   */

  function hyphenateStyleName(name) {
    return name.replace(uppercasePattern, '-$1').toLowerCase().replace(msPattern, '-ms-');
  }

  // and any newline or tab are filtered out as if they're not part of the URL.
  // https://url.spec.whatwg.org/#url-parsing
  // Tab or newline are defined as \r\n\t:
  // https://infra.spec.whatwg.org/#ascii-tab-or-newline
  // A C0 control is a code point in the range \u0000 NULL to \u001F
  // INFORMATION SEPARATOR ONE, inclusive:
  // https://infra.spec.whatwg.org/#c0-control-or-space

  /* eslint-disable max-len */

  var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;

  function sanitizeURL(url) {
    // We should never have symbols here because they get filtered out elsewhere.
    // eslint-disable-next-line react-internal/safe-string-coercion
    var stringifiedURL = '' + url;

    {
      if (isJavaScriptProtocol.test(stringifiedURL)) {
        // Return a different javascript: url that doesn't cause any side-effects and just
        // throws if ever visited.
        // eslint-disable-next-line no-script-url
        return "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')";
      }
    }

    return url;
  }

  // The build script is at scripts/rollup/generate-inline-fizz-runtime.js.
  // Run `yarn generate-inline-fizz-runtime` to generate.
  var clientRenderBoundary = '$RX=function(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())};';
  var completeBoundary = '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};';
  var completeBoundaryWithStyles = '$RM=new Map;\n$RR=function(r,t,w){for(var u=$RC,n=$RM,p=new Map,q=document,g,b,h=q.querySelectorAll("link[data-precedence],style[data-precedence]"),v=[],k=0;b=h[k++];)"not all"===b.getAttribute("media")?v.push(b):("LINK"===b.tagName&&n.set(b.getAttribute("href"),b),p.set(b.dataset.precedence,g=b));b=0;h=[];var l,a;for(k=!0;;){if(k){var f=w[b++];if(!f){k=!1;b=0;continue}var c=!1,m=0;var d=f[m++];if(a=n.get(d)){var e=a._p;c=!0}else{a=q.createElement("link");a.href=d;a.rel="stylesheet";for(a.dataset.precedence=\nl=f[m++];e=f[m++];)a.setAttribute(e,f[m++]);e=a._p=new Promise(function(x,y){a.onload=x;a.onerror=y});n.set(d,a)}d=a.getAttribute("media");!e||"l"===e.s||d&&!matchMedia(d).matches||h.push(e);if(c)continue}else{a=v[b++];if(!a)break;l=a.getAttribute("data-precedence");a.removeAttribute("media")}c=p.get(l)||g;c===g&&(g=a);p.set(l,a);c?c.parentNode.insertBefore(a,c.nextSibling):(c=q.head,c.insertBefore(a,c.firstChild))}Promise.all(h).then(u.bind(null,r,t,""),u.bind(null,r,t,"Resource failed to load"))};';
  var completeSegment = '$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};';
  var formReplaying = 'addEventListener("submit",function(a){if(!a.defaultPrevented){var c=a.target,d=a.submitter,e=c.action,b=d;if(d){var f=d.getAttribute("formAction");null!=f&&(e=f,b=null)}"javascript:throw new Error(\'React form unexpectedly submitted.\')"===e&&(a.preventDefault(),b?(a=document.createElement("input"),a.name=b.name,a.value=b.value,b.parentNode.insertBefore(a,b),b=new FormData(c),a.parentNode.removeChild(a)):b=new FormData(c),a=c.ownerDocument||c,(a.$$reactFormReplay=a.$$reactFormReplay||[]).push(c,d,b))}});';

  function getValueDescriptorExpectingObjectForWarning(thing) {
    return thing === null ? '`null`' : thing === undefined ? '`undefined`' : thing === '' ? 'an empty string' : "something with type \"" + typeof thing + "\"";
  }

  // same object across all transitions.

  var sharedNotPendingObject = {
    pending: false,
    data: null,
    method: null,
    action: null
  };
  var NotPending = Object.freeze(sharedNotPendingObject) ;

  var ReactDOMSharedInternals = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

  var ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;
  var ReactDOMServerDispatcher = {
    prefetchDNS: prefetchDNS,
    preconnect: preconnect,
    preload: preload,
    preloadModule: preloadModule,
    preinitStyle: preinitStyle,
    preinitScript: preinitScript,
    preinitModuleScript: preinitModuleScript
  };
  function prepareHostDispatcher() {
    ReactDOMCurrentDispatcher.current = ReactDOMServerDispatcher;
  } // We make every property of the descriptor optional because it is not a contract that
  var ScriptStreamingFormat = 0;
  var DataStreamingFormat = 1;
  var NothingSent
  /*                      */
  = 0;
  var SentCompleteSegmentFunction
  /*      */
  = 1;
  var SentCompleteBoundaryFunction
  /*     */
  = 2;
  var SentClientRenderFunction
  /*         */
  = 4;
  var SentStyleInsertionFunction
  /*       */
  = 8;
  var SentFormReplayingRuntime
  /*         */
  = 16; // Per request, global state that is not contextual to the rendering subtree.
  // This cannot be resumed and therefore should only contain things that are
  // temporary working state or are never used in the prerender pass.
  // Credentials here are things that affect whether a browser will make a request
  // as well as things that affect which connection the browser will use for that request.
  // We want these to be aligned across preloads and resources because otherwise the preload
  // will be wasted.
  // We investigated whether referrerPolicy should be included here but from experimentation
  // it seems that browsers do not treat this as part of the http cache key and does not affect
  // which connection is used.

  var EXISTS = null; // This constant is to mark preloads that have no unique credentials
  // to convey. It should never be checked by identity and we should not
  // assume Preload values in ResumableState equal this value because they
  // will have come from some parsed input.

  var PRELOAD_NO_CREDS = [];

  {
    Object.freeze(PRELOAD_NO_CREDS);
  } // Per response, global state that is not contextual to the rendering subtree.
  // This is resumable and therefore should be serializable.


  var dataElementQuotedEnd = stringToPrecomputedChunk('"></template>');
  var startInlineScript = stringToPrecomputedChunk('<script>');
  var endInlineScript = stringToPrecomputedChunk('</script>');
  var startScriptSrc = stringToPrecomputedChunk('<script src="');
  var startModuleSrc = stringToPrecomputedChunk('<script type="module" src="');
  var scriptNonce = stringToPrecomputedChunk('" nonce="');
  var scriptIntegirty = stringToPrecomputedChunk('" integrity="');
  var scriptCrossOrigin = stringToPrecomputedChunk('" crossorigin="');
  var endAsyncScript = stringToPrecomputedChunk('" async=""></script>');
  /**
   * This escaping function is designed to work with bootstrapScriptContent and importMap only.
   * because we know we are escaping the entire script. We can avoid for instance
   * escaping html comment string sequences that are valid javascript as well because
   * if there are no sebsequent <script sequences the html parser will never enter
   * script data double escaped state (see: https://www.w3.org/TR/html53/syntax.html#script-data-double-escaped-state)
   *
   * While untrusted script content should be made safe before using this api it will
   * ensure that the script cannot be early terminated or never terminated state
   */

  function escapeBootstrapAndImportMapScriptContent(scriptText) {
    {
      checkHtmlStringCoercion(scriptText);
    }

    return ('' + scriptText).replace(scriptRegex, scriptReplacer);
  }

  var scriptRegex = /(<\/|<)(s)(cript)/gi;

  var scriptReplacer = function (match, prefix, s, suffix) {
    return "" + prefix + (s === 's' ? "\\u0073" : "\\u0053") + suffix;
  };

  var importMapScriptStart = stringToPrecomputedChunk('<script type="importmap">');
  var importMapScriptEnd = stringToPrecomputedChunk('</script>'); // Since we store headers as strings we deal with their length in utf16 code units
  // rather than visual characters or the utf8 encoding that is used for most binary
  // serialization. Some common HTTP servers only allow for headers to be 4kB in length.
  // We choose a default length that is likely to be well under this already limited length however
  // pathological cases may still cause the utf-8 encoding of the headers to approach this limit.
  // It should also be noted that this maximum is a soft maximum. we have not reached the limit we will
  // allow one more header to be captured which means in practice if the limit is approached it will be exceeded

  var DEFAULT_HEADERS_CAPACITY_IN_UTF16_CODE_UNITS = 2000; // Allows us to keep track of what we've already written so we can refer back to it.
  // if passed externalRuntimeConfig and the enableFizzExternalRuntime feature flag
  // is set, the server will send instructions via data attributes (instead of inline scripts)

  function createRenderState(resumableState, nonce, externalRuntimeConfig, importMap, onHeaders, maxHeadersLength) {
    var inlineScriptWithNonce = nonce === undefined ? startInlineScript : stringToPrecomputedChunk('<script nonce="' + escapeTextForBrowser(nonce) + '">');
    var idPrefix = resumableState.idPrefix;
    var bootstrapChunks = [];
    var externalRuntimeScript = null;
    var bootstrapScriptContent = resumableState.bootstrapScriptContent,
        bootstrapScripts = resumableState.bootstrapScripts,
        bootstrapModules = resumableState.bootstrapModules;

    if (bootstrapScriptContent !== undefined) {
      bootstrapChunks.push(inlineScriptWithNonce, stringToChunk(escapeBootstrapAndImportMapScriptContent(bootstrapScriptContent)), endInlineScript);
    }

    {

      if (externalRuntimeConfig !== undefined) {
        if (typeof externalRuntimeConfig === 'string') {
          externalRuntimeScript = {
            src: externalRuntimeConfig,
            chunks: []
          };
          pushScriptImpl(externalRuntimeScript.chunks, {
            src: externalRuntimeConfig,
            async: true,
            integrity: undefined,
            nonce: nonce
          });
        } else {
          externalRuntimeScript = {
            src: externalRuntimeConfig.src,
            chunks: []
          };
          pushScriptImpl(externalRuntimeScript.chunks, {
            src: externalRuntimeConfig.src,
            async: true,
            integrity: externalRuntimeConfig.integrity,
            nonce: nonce
          });
        }
      }
    }

    var importMapChunks = [];

    if (importMap !== undefined) {
      var map = importMap;
      importMapChunks.push(importMapScriptStart);
      importMapChunks.push(stringToChunk(escapeBootstrapAndImportMapScriptContent(JSON.stringify(map))));
      importMapChunks.push(importMapScriptEnd);
    }

    {
      if (onHeaders && typeof maxHeadersLength === 'number') {
        if (maxHeadersLength <= 0) {
          error('React expected a positive non-zero `maxHeadersLength` option but found %s instead. When using the `onHeaders` option you may supply an optional `maxHeadersLength` option as well however, when setting this value to zero or less no headers will be captured.', maxHeadersLength === 0 ? 'zero' : maxHeadersLength);
        }
      }
    }

    var headers = onHeaders ? {
      preconnects: '',
      fontPreloads: '',
      highImagePreloads: '',
      remainingCapacity: typeof maxHeadersLength === 'number' ? maxHeadersLength : DEFAULT_HEADERS_CAPACITY_IN_UTF16_CODE_UNITS
    } : null;
    var renderState = {
      placeholderPrefix: stringToPrecomputedChunk(idPrefix + 'P:'),
      segmentPrefix: stringToPrecomputedChunk(idPrefix + 'S:'),
      boundaryPrefix: stringToPrecomputedChunk(idPrefix + 'B:'),
      startInlineScript: inlineScriptWithNonce,
      htmlChunks: null,
      headChunks: null,
      externalRuntimeScript: externalRuntimeScript,
      bootstrapChunks: bootstrapChunks,
      importMapChunks: importMapChunks,
      onHeaders: onHeaders,
      headers: headers,
      resets: {
        font: {},
        dns: {},
        connect: {
          default: {},
          anonymous: {},
          credentials: {}
        },
        image: {},
        style: {}
      },
      charsetChunks: [],
      viewportChunks: [],
      hoistableChunks: [],
      // cleared on flush
      preconnects: new Set(),
      fontPreloads: new Set(),
      highImagePreloads: new Set(),
      // usedImagePreloads: new Set(),
      styles: new Map(),
      bootstrapScripts: new Set(),
      scripts: new Set(),
      bulkPreloads: new Set(),
      preloads: {
        images: new Map(),
        stylesheets: new Map(),
        scripts: new Map(),
        moduleScripts: new Map()
      },
      nonce: nonce,
      // like a module global for currently rendering boundary
      hoistableState: null,
      stylesToHoist: false
    };

    if (bootstrapScripts !== undefined) {
      for (var i = 0; i < bootstrapScripts.length; i++) {
        var scriptConfig = bootstrapScripts[i];
        var src = void 0,
            crossOrigin = void 0,
            integrity = void 0;
        var props = {
          rel: 'preload',
          as: 'script',
          fetchPriority: 'low',
          nonce: nonce
        };

        if (typeof scriptConfig === 'string') {
          props.href = src = scriptConfig;
        } else {
          props.href = src = scriptConfig.src;
          props.integrity = integrity = typeof scriptConfig.integrity === 'string' ? scriptConfig.integrity : undefined;
          props.crossOrigin = crossOrigin = typeof scriptConfig === 'string' || scriptConfig.crossOrigin == null ? undefined : scriptConfig.crossOrigin === 'use-credentials' ? 'use-credentials' : '';
        }

        preloadBootstrapScriptOrModule(resumableState, renderState, src, props);
        bootstrapChunks.push(startScriptSrc, stringToChunk(escapeTextForBrowser(src)));

        if (nonce) {
          bootstrapChunks.push(scriptNonce, stringToChunk(escapeTextForBrowser(nonce)));
        }

        if (typeof integrity === 'string') {
          bootstrapChunks.push(scriptIntegirty, stringToChunk(escapeTextForBrowser(integrity)));
        }

        if (typeof crossOrigin === 'string') {
          bootstrapChunks.push(scriptCrossOrigin, stringToChunk(escapeTextForBrowser(crossOrigin)));
        }

        bootstrapChunks.push(endAsyncScript);
      }
    }

    if (bootstrapModules !== undefined) {
      for (var _i = 0; _i < bootstrapModules.length; _i++) {
        var _scriptConfig = bootstrapModules[_i];

        var _src = void 0,
            _crossOrigin = void 0,
            _integrity = void 0;

        var _props = {
          rel: 'modulepreload',
          fetchPriority: 'low',
          nonce: nonce
        };

        if (typeof _scriptConfig === 'string') {
          _props.href = _src = _scriptConfig;
        } else {
          _props.href = _src = _scriptConfig.src;
          _props.integrity = _integrity = typeof _scriptConfig.integrity === 'string' ? _scriptConfig.integrity : undefined;
          _props.crossOrigin = _crossOrigin = typeof _scriptConfig === 'string' || _scriptConfig.crossOrigin == null ? undefined : _scriptConfig.crossOrigin === 'use-credentials' ? 'use-credentials' : '';
        }

        preloadBootstrapScriptOrModule(resumableState, renderState, _src, _props);
        bootstrapChunks.push(startModuleSrc, stringToChunk(escapeTextForBrowser(_src)));

        if (nonce) {
          bootstrapChunks.push(scriptNonce, stringToChunk(escapeTextForBrowser(nonce)));
        }

        if (typeof _integrity === 'string') {
          bootstrapChunks.push(scriptIntegirty, stringToChunk(escapeTextForBrowser(_integrity)));
        }

        if (typeof _crossOrigin === 'string') {
          bootstrapChunks.push(scriptCrossOrigin, stringToChunk(escapeTextForBrowser(_crossOrigin)));
        }

        bootstrapChunks.push(endAsyncScript);
      }
    }

    return renderState;
  }
  function resumeRenderState(resumableState, nonce) {
    return createRenderState(resumableState, nonce, undefined, undefined, undefined, undefined);
  }
  function createResumableState(identifierPrefix, externalRuntimeConfig, bootstrapScriptContent, bootstrapScripts, bootstrapModules) {
    var idPrefix = identifierPrefix === undefined ? '' : identifierPrefix;
    var streamingFormat = ScriptStreamingFormat;

    {
      if (externalRuntimeConfig !== undefined) {
        streamingFormat = DataStreamingFormat;
      }
    }

    return {
      idPrefix: idPrefix,
      nextFormID: 0,
      streamingFormat: streamingFormat,
      bootstrapScriptContent: bootstrapScriptContent,
      bootstrapScripts: bootstrapScripts,
      bootstrapModules: bootstrapModules,
      instructions: NothingSent,
      hasBody: false,
      hasHtml: false,
      // @TODO add bootstrap script to implicit preloads
      // persistent
      unknownResources: {},
      dnsResources: {},
      connectResources: {
        default: {},
        anonymous: {},
        credentials: {}
      },
      imageResources: {},
      styleResources: {},
      scriptResources: {},
      moduleUnknownResources: {},
      moduleScriptResources: {}
    };
  }
  function resetResumableState(resumableState, renderState) {
    // Resets the resumable state based on what didn't manage to fully flush in the render state.
    // This currently assumes nothing was flushed.
    resumableState.nextFormID = 0;
    resumableState.hasBody = false;
    resumableState.hasHtml = false;
    resumableState.unknownResources = {
      font: renderState.resets.font
    };
    resumableState.dnsResources = renderState.resets.dns;
    resumableState.connectResources = renderState.resets.connect;
    resumableState.imageResources = renderState.resets.image;
    resumableState.styleResources = renderState.resets.style;
    resumableState.scriptResources = {};
    resumableState.moduleUnknownResources = {};
    resumableState.moduleScriptResources = {};
  }
  function completeResumableState(resumableState) {
    // This function is called when we have completed a prerender and there is a shell.
    resumableState.bootstrapScriptContent = undefined;
    resumableState.bootstrapScripts = undefined;
    resumableState.bootstrapModules = undefined;
  } // Constants for the insertion mode we're currently writing in. We don't encode all HTML5 insertion
  // modes. We only include the variants as they matter for the sake of our purposes.
  // We don't actually provide the namespace therefore we use constants instead of the string.

  var ROOT_HTML_MODE = 0; // Used for the root most element tag.
  // We have a less than HTML_HTML_MODE check elsewhere. If you add more cases here, make sure it
  // still makes sense

  var HTML_HTML_MODE = 1; // Used for the <html> if it is at the top level.

  var HTML_MODE = 2;
  var SVG_MODE = 3;
  var MATHML_MODE = 4;
  var HTML_TABLE_MODE = 5;
  var HTML_TABLE_BODY_MODE = 6;
  var HTML_TABLE_ROW_MODE = 7;
  var HTML_COLGROUP_MODE = 8; // We have a greater than HTML_TABLE_MODE check elsewhere. If you add more cases here, make sure it
  // still makes sense

  var NO_SCOPE =
  /*         */
  0;
  var NOSCRIPT_SCOPE =
  /*   */
  1;
  var PICTURE_SCOPE =
  /*    */
  2; // Lets us keep track of contextual state and pick it back up after suspending.

  function createFormatContext(insertionMode, selectedValue, tagScope) {
    return {
      insertionMode: insertionMode,
      selectedValue: selectedValue,
      tagScope: tagScope
    };
  }

  function createRootFormatContext(namespaceURI) {
    var insertionMode = namespaceURI === 'http://www.w3.org/2000/svg' ? SVG_MODE : namespaceURI === 'http://www.w3.org/1998/Math/MathML' ? MATHML_MODE : ROOT_HTML_MODE;
    return createFormatContext(insertionMode, null, NO_SCOPE);
  }
  function getChildFormatContext(parentContext, type, props) {
    switch (type) {
      case 'noscript':
        return createFormatContext(HTML_MODE, null, parentContext.tagScope | NOSCRIPT_SCOPE);

      case 'select':
        return createFormatContext(HTML_MODE, props.value != null ? props.value : props.defaultValue, parentContext.tagScope);

      case 'svg':
        return createFormatContext(SVG_MODE, null, parentContext.tagScope);

      case 'picture':
        return createFormatContext(HTML_MODE, null, parentContext.tagScope | PICTURE_SCOPE);

      case 'math':
        return createFormatContext(MATHML_MODE, null, parentContext.tagScope);

      case 'foreignObject':
        return createFormatContext(HTML_MODE, null, parentContext.tagScope);
      // Table parents are special in that their children can only be created at all if they're
      // wrapped in a table parent. So we need to encode that we're entering this mode.

      case 'table':
        return createFormatContext(HTML_TABLE_MODE, null, parentContext.tagScope);

      case 'thead':
      case 'tbody':
      case 'tfoot':
        return createFormatContext(HTML_TABLE_BODY_MODE, null, parentContext.tagScope);

      case 'colgroup':
        return createFormatContext(HTML_COLGROUP_MODE, null, parentContext.tagScope);

      case 'tr':
        return createFormatContext(HTML_TABLE_ROW_MODE, null, parentContext.tagScope);
    }

    if (parentContext.insertionMode >= HTML_TABLE_MODE) {
      // Whatever tag this was, it wasn't a table parent or other special parent, so we must have
      // entered plain HTML again.
      return createFormatContext(HTML_MODE, null, parentContext.tagScope);
    }

    if (parentContext.insertionMode === ROOT_HTML_MODE) {
      if (type === 'html') {
        // We've emitted the root and is now in <html> mode.
        return createFormatContext(HTML_HTML_MODE, null, parentContext.tagScope);
      } else {
        // We've emitted the root and is now in plain HTML mode.
        return createFormatContext(HTML_MODE, null, parentContext.tagScope);
      }
    } else if (parentContext.insertionMode === HTML_HTML_MODE) {
      // We've emitted the document element and is now in plain HTML mode.
      return createFormatContext(HTML_MODE, null, parentContext.tagScope);
    }

    return parentContext;
  }
  function makeId(resumableState, treeId, localId) {
    var idPrefix = resumableState.idPrefix;
    var id = ':' + idPrefix + 'R' + treeId; // Unless this is the first id at this level, append a number at the end
    // that represents the position of this useId hook among all the useId
    // hooks for this fiber.

    if (localId > 0) {
      id += 'H' + localId.toString(32);
    }

    return id + ':';
  }

  function encodeHTMLTextNode(text) {
    return escapeTextForBrowser(text);
  }

  var textSeparator = stringToPrecomputedChunk('<!-- -->');
  function pushTextInstance(target, text, renderState, textEmbedded) {
    if (text === '') {
      // Empty text doesn't have a DOM node representation and the hydration is aware of this.
      return textEmbedded;
    }

    if (textEmbedded) {
      target.push(textSeparator);
    }

    target.push(stringToChunk(encodeHTMLTextNode(text)));
    return true;
  } // Called when Fizz is done with a Segment. Currently the only purpose is to conditionally
  // emit a text separator when we don't know for sure it is safe to omit

  function pushSegmentFinale(target, renderState, lastPushedText, textEmbedded) {
    if (lastPushedText && textEmbedded) {
      target.push(textSeparator);
    }
  }
  var styleNameCache = new Map();

  function processStyleName(styleName) {
    var chunk = styleNameCache.get(styleName);

    if (chunk !== undefined) {
      return chunk;
    }

    var result = stringToPrecomputedChunk(escapeTextForBrowser(hyphenateStyleName(styleName)));
    styleNameCache.set(styleName, result);
    return result;
  }

  var styleAttributeStart = stringToPrecomputedChunk(' style="');
  var styleAssign = stringToPrecomputedChunk(':');
  var styleSeparator = stringToPrecomputedChunk(';');

  function pushStyleAttribute(target, style) {
    if (typeof style !== 'object') {
      throw new Error('The `style` prop expects a mapping from style properties to values, ' + "not a string. For example, style={{marginRight: spacing + 'em'}} when " + 'using JSX.');
    }

    var isFirst = true;

    for (var styleName in style) {
      if (!hasOwnProperty.call(style, styleName)) {
        continue;
      } // If you provide unsafe user data here they can inject arbitrary CSS
      // which may be problematic (I couldn't repro this):
      // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
      // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
      // This is not an XSS hole but instead a potential CSS injection issue
      // which has lead to a greater discussion about how we're going to
      // trust URLs moving forward. See #2115901


      var styleValue = style[styleName];

      if (styleValue == null || typeof styleValue === 'boolean' || styleValue === '') {
        // TODO: We used to set empty string as a style with an empty value. Does that ever make sense?
        continue;
      }

      var nameChunk = void 0;
      var valueChunk = void 0;
      var isCustomProperty = styleName.indexOf('--') === 0;

      if (isCustomProperty) {
        nameChunk = stringToChunk(escapeTextForBrowser(styleName));

        {
          checkCSSPropertyStringCoercion(styleValue, styleName);
        }

        valueChunk = stringToChunk(escapeTextForBrowser(('' + styleValue).trim()));
      } else {
        {
          warnValidStyle(styleName, styleValue);
        }

        nameChunk = processStyleName(styleName);

        if (typeof styleValue === 'number') {
          if (styleValue !== 0 && !isUnitlessNumber(styleName)) {
            valueChunk = stringToChunk(styleValue + 'px'); // Presumes implicit 'px' suffix for unitless numbers
          } else {
            valueChunk = stringToChunk('' + styleValue);
          }
        } else {
          {
            checkCSSPropertyStringCoercion(styleValue, styleName);
          }

          valueChunk = stringToChunk(escapeTextForBrowser(('' + styleValue).trim()));
        }
      }

      if (isFirst) {
        isFirst = false; // If it's first, we don't need any separators prefixed.

        target.push(styleAttributeStart, nameChunk, styleAssign, valueChunk);
      } else {
        target.push(styleSeparator, nameChunk, styleAssign, valueChunk);
      }
    }

    if (!isFirst) {
      target.push(attributeEnd);
    }
  }

  var attributeSeparator = stringToPrecomputedChunk(' ');
  var attributeAssign = stringToPrecomputedChunk('="');
  var attributeEnd = stringToPrecomputedChunk('"');
  var attributeEmptyString = stringToPrecomputedChunk('=""');

  function pushBooleanAttribute(target, name, value) // not null or undefined
  {
    if (value && typeof value !== 'function' && typeof value !== 'symbol') {
      target.push(attributeSeparator, stringToChunk(name), attributeEmptyString);
    }
  }

  function pushStringAttribute(target, name, value) // not null or undefined
  {
    if (typeof value !== 'function' && typeof value !== 'symbol' && typeof value !== 'boolean') {
      target.push(attributeSeparator, stringToChunk(name), attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
    }
  }

  function makeFormFieldPrefix(resumableState) {
    var id = resumableState.nextFormID++;
    return resumableState.idPrefix + id;
  } // Since this will likely be repeated a lot in the HTML, we use a more concise message
  // than on the client and hopefully it's googleable.


  var actionJavaScriptURL = stringToPrecomputedChunk(escapeTextForBrowser( // eslint-disable-next-line no-script-url
  "javascript:throw new Error('React form unexpectedly submitted.')"));
  var startHiddenInputChunk = stringToPrecomputedChunk('<input type="hidden"');

  function pushAdditionalFormField(value, key) {
    var target = this;
    target.push(startHiddenInputChunk);

    if (typeof value !== 'string') {
      throw new Error('File/Blob fields are not yet supported in progressive forms. ' + 'It probably means you are closing over binary data or FormData in a Server Action.');
    }

    pushStringAttribute(target, 'name', key);
    pushStringAttribute(target, 'value', value);
    target.push(endOfStartTagSelfClosing);
  }

  function pushAdditionalFormFields(target, formData) {
    if (formData !== null) {
      // $FlowFixMe[prop-missing]: FormData has forEach.
      formData.forEach(pushAdditionalFormField, target);
    }
  }

  function pushFormActionAttribute(target, resumableState, renderState, formAction, formEncType, formMethod, formTarget, name) {
    var formData = null;

    if (typeof formAction === 'function') {
      // Function form actions cannot control the form properties
      {
        if (name !== null && !didWarnFormActionName) {
          didWarnFormActionName = true;

          error('Cannot specify a "name" prop for a button that specifies a function as a formAction. ' + 'React needs it to encode which action should be invoked. It will get overridden.');
        }

        if ((formEncType !== null || formMethod !== null) && !didWarnFormActionMethod) {
          didWarnFormActionMethod = true;

          error('Cannot specify a formEncType or formMethod for a button that specifies a ' + 'function as a formAction. React provides those automatically. They will get overridden.');
        }

        if (formTarget !== null && !didWarnFormActionTarget) {
          didWarnFormActionTarget = true;

          error('Cannot specify a formTarget for a button that specifies a function as a formAction. ' + 'The function will always be executed in the same window.');
        }
      }

      var customAction = formAction.$$FORM_ACTION;

      if (typeof customAction === 'function') {
        // This action has a custom progressive enhancement form that can submit the form
        // back to the server if it's invoked before hydration. Such as a Server Action.
        var prefix = makeFormFieldPrefix(resumableState);
        var customFields = formAction.$$FORM_ACTION(prefix);
        name = customFields.name;
        formAction = customFields.action || '';
        formEncType = customFields.encType;
        formMethod = customFields.method;
        formTarget = customFields.target;
        formData = customFields.data;
      } else {
        // Set a javascript URL that doesn't do anything. We don't expect this to be invoked
        // because we'll preventDefault in the Fizz runtime, but it can happen if a form is
        // manually submitted or if someone calls stopPropagation before React gets the event.
        // If CSP is used to block javascript: URLs that's fine too. It just won't show this
        // error message but the URL will be logged.
        target.push(attributeSeparator, stringToChunk('formAction'), attributeAssign, actionJavaScriptURL, attributeEnd);
        name = null;
        formAction = null;
        formEncType = null;
        formMethod = null;
        formTarget = null;
        injectFormReplayingRuntime(resumableState, renderState);
      }
    }

    if (name != null) {
      pushAttribute(target, 'name', name);
    }

    if (formAction != null) {
      pushAttribute(target, 'formAction', formAction);
    }

    if (formEncType != null) {
      pushAttribute(target, 'formEncType', formEncType);
    }

    if (formMethod != null) {
      pushAttribute(target, 'formMethod', formMethod);
    }

    if (formTarget != null) {
      pushAttribute(target, 'formTarget', formTarget);
    }

    return formData;
  }

  function pushAttribute(target, name, value) // not null or undefined
  {
    switch (name) {
      // These are very common props and therefore are in the beginning of the switch.
      // TODO: aria-label is a very common prop but allows booleans so is not like the others
      // but should ideally go in this list too.
      case 'className':
        {
          pushStringAttribute(target, 'class', value);
          break;
        }

      case 'tabIndex':
        {
          pushStringAttribute(target, 'tabindex', value);
          break;
        }

      case 'dir':
      case 'role':
      case 'viewBox':
      case 'width':
      case 'height':
        {
          pushStringAttribute(target, name, value);
          break;
        }

      case 'style':
        {
          pushStyleAttribute(target, value);
          return;
        }

      case 'src':
      case 'href':
        {
          {
            if (value === '') {
              {
                if (name === 'src') {
                  error('An empty string ("") was passed to the %s attribute. ' + 'This may cause the browser to download the whole page again over the network. ' + 'To fix this, either do not render the element at all ' + 'or pass null to %s instead of an empty string.', name, name);
                } else {
                  error('An empty string ("") was passed to the %s attribute. ' + 'To fix this, either do not render the element at all ' + 'or pass null to %s instead of an empty string.', name, name);
                }
              }

              return;
            }
          }
        }
      // Fall through to the last case which shouldn't remove empty strings.

      case 'action':
      case 'formAction':
        {
          // TODO: Consider only special casing these for each tag.
          if (value == null || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'boolean') {
            return;
          }

          {
            checkAttributeStringCoercion(value, name);
          }

          var sanitizedValue = sanitizeURL('' + value);
          target.push(attributeSeparator, stringToChunk(name), attributeAssign, stringToChunk(escapeTextForBrowser(sanitizedValue)), attributeEnd);
          return;
        }

      case 'defaultValue':
      case 'defaultChecked': // These shouldn't be set as attributes on generic HTML elements.

      case 'innerHTML': // Must use dangerouslySetInnerHTML instead.

      case 'suppressContentEditableWarning':
      case 'suppressHydrationWarning':
      case 'ref':
        // Ignored. These are built-in to React on the client.
        return;

      case 'autoFocus':
      case 'multiple':
      case 'muted':
        {
          pushBooleanAttribute(target, name.toLowerCase(), value);
          return;
        }

      case 'xlinkHref':
        {
          if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'boolean') {
            return;
          }

          {
            checkAttributeStringCoercion(value, name);
          }

          var _sanitizedValue = sanitizeURL('' + value);

          target.push(attributeSeparator, stringToChunk('xlink:href'), attributeAssign, stringToChunk(escapeTextForBrowser(_sanitizedValue)), attributeEnd);
          return;
        }

      case 'contentEditable':
      case 'spellCheck':
      case 'draggable':
      case 'value':
      case 'autoReverse':
      case 'externalResourcesRequired':
      case 'focusable':
      case 'preserveAlpha':
        {
          // Booleanish String
          // These are "enumerated" attributes that accept "true" and "false".
          // In React, we let users pass `true` and `false` even though technically
          // these aren't boolean attributes (they are coerced to strings).
          if (typeof value !== 'function' && typeof value !== 'symbol') {
            target.push(attributeSeparator, stringToChunk(name), attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
          }

          return;
        }

      case 'allowFullScreen':
      case 'async':
      case 'autoPlay':
      case 'controls':
      case 'default':
      case 'defer':
      case 'disabled':
      case 'disablePictureInPicture':
      case 'disableRemotePlayback':
      case 'formNoValidate':
      case 'loop':
      case 'noModule':
      case 'noValidate':
      case 'open':
      case 'playsInline':
      case 'readOnly':
      case 'required':
      case 'reversed':
      case 'scoped':
      case 'seamless':
      case 'itemScope':
        {
          // Boolean
          if (value && typeof value !== 'function' && typeof value !== 'symbol') {
            target.push(attributeSeparator, stringToChunk(name), attributeEmptyString);
          }

          return;
        }

      case 'hidden':

      // fallthrough to overloaded boolean with enableNewDOMProps

      case 'capture':
      case 'download':
        {
          // Overloaded Boolean
          if (value === true) {
            target.push(attributeSeparator, stringToChunk(name), attributeEmptyString);
          } else if (value === false) ; else if (typeof value !== 'function' && typeof value !== 'symbol') {
            target.push(attributeSeparator, stringToChunk(name), attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
          }

          return;
        }

      case 'cols':
      case 'rows':
      case 'size':
      case 'span':
        {
          // These are HTML attributes that must be positive numbers.
          if (typeof value !== 'function' && typeof value !== 'symbol' && !isNaN(value) && value >= 1) {
            target.push(attributeSeparator, stringToChunk(name), attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
          }

          return;
        }

      case 'rowSpan':
      case 'start':
        {
          // These are HTML attributes that must be numbers.
          if (typeof value !== 'function' && typeof value !== 'symbol' && !isNaN(value)) {
            target.push(attributeSeparator, stringToChunk(name), attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
          }

          return;
        }

      case 'xlinkActuate':
        pushStringAttribute(target, 'xlink:actuate', value);
        return;

      case 'xlinkArcrole':
        pushStringAttribute(target, 'xlink:arcrole', value);
        return;

      case 'xlinkRole':
        pushStringAttribute(target, 'xlink:role', value);
        return;

      case 'xlinkShow':
        pushStringAttribute(target, 'xlink:show', value);
        return;

      case 'xlinkTitle':
        pushStringAttribute(target, 'xlink:title', value);
        return;

      case 'xlinkType':
        pushStringAttribute(target, 'xlink:type', value);
        return;

      case 'xmlBase':
        pushStringAttribute(target, 'xml:base', value);
        return;

      case 'xmlLang':
        pushStringAttribute(target, 'xml:lang', value);
        return;

      case 'xmlSpace':
        pushStringAttribute(target, 'xml:space', value);
        return;

      default:
        if ( // shouldIgnoreAttribute
        // We have already filtered out null/undefined and reserved words.
        name.length > 2 && (name[0] === 'o' || name[0] === 'O') && (name[1] === 'n' || name[1] === 'N')) {
          return;
        }

        var attributeName = getAttributeAlias(name);

        if (isAttributeNameSafe(attributeName)) {
          // shouldRemoveAttribute
          switch (typeof value) {
            case 'function':
            case 'symbol':
              // eslint-disable-line
              return;

            case 'boolean':
              {
                var prefix = attributeName.toLowerCase().slice(0, 5);

                if (prefix !== 'data-' && prefix !== 'aria-') {
                  return;
                }
              }
          }

          target.push(attributeSeparator, stringToChunk(attributeName), attributeAssign, stringToChunk(escapeTextForBrowser(value)), attributeEnd);
        }

    }
  }

  var endOfStartTag = stringToPrecomputedChunk('>');
  var endOfStartTagSelfClosing = stringToPrecomputedChunk('/>');

  function pushInnerHTML(target, innerHTML, children) {
    if (innerHTML != null) {
      if (children != null) {
        throw new Error('Can only set one of `children` or `props.dangerouslySetInnerHTML`.');
      }

      if (typeof innerHTML !== 'object' || !('__html' in innerHTML)) {
        throw new Error('`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' + 'Please visit https://reactjs.org/link/dangerously-set-inner-html ' + 'for more information.');
      }

      var html = innerHTML.__html;

      if (html !== null && html !== undefined) {
        {
          checkHtmlStringCoercion(html);
        }

        target.push(stringToChunk('' + html));
      }
    }
  } // TODO: Move these to RenderState so that we warn for every request.
  // It would help debugging in stateful servers (e.g. service worker).


  var didWarnDefaultInputValue = false;
  var didWarnDefaultChecked = false;
  var didWarnDefaultSelectValue = false;
  var didWarnDefaultTextareaValue = false;
  var didWarnInvalidOptionChildren = false;
  var didWarnInvalidOptionInnerHTML = false;
  var didWarnSelectedSetOnOption = false;
  var didWarnFormActionType = false;
  var didWarnFormActionName = false;
  var didWarnFormActionTarget = false;
  var didWarnFormActionMethod = false;

  function checkSelectProp(props, propName) {
    {
      var value = props[propName];

      if (value != null) {
        var array = isArray(value);

        if (props.multiple && !array) {
          error('The `%s` prop supplied to <select> must be an array if ' + '`multiple` is true.', propName);
        } else if (!props.multiple && array) {
          error('The `%s` prop supplied to <select> must be a scalar ' + 'value if `multiple` is false.', propName);
        }
      }
    }
  }

  function pushStartAnchor(target, props) {
    target.push(startChunkForTag('a'));
    var children = null;
    var innerHTML = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;

          case 'href':
            if (propValue === '') {
              // Empty `href` is special on anchors so we're short-circuiting here.
              // On other tags it should trigger a warning
              pushStringAttribute(target, 'href', '');
            } else {
              pushAttribute(target, propKey, propValue);
            }

            break;

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    target.push(endOfStartTag);
    pushInnerHTML(target, innerHTML, children);

    if (typeof children === 'string') {
      // Special case children as a string to avoid the unnecessary comment.
      // TODO: Remove this special case after the general optimization is in place.
      target.push(stringToChunk(encodeHTMLTextNode(children)));
      return null;
    }

    return children;
  }

  function pushStartSelect(target, props) {
    {
      checkControlledValueProps('select', props);
      checkSelectProp(props, 'value');
      checkSelectProp(props, 'defaultValue');

      if (props.value !== undefined && props.defaultValue !== undefined && !didWarnDefaultSelectValue) {
        error('Select elements must be either controlled or uncontrolled ' + '(specify either the value prop, or the defaultValue prop, but not ' + 'both). Decide between using a controlled or uncontrolled select ' + 'element and remove one of these props. More info: ' + 'https://reactjs.org/link/controlled-components');

        didWarnDefaultSelectValue = true;
      }
    }

    target.push(startChunkForTag('select'));
    var children = null;
    var innerHTML = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            // TODO: This doesn't really make sense for select since it can't use the controlled
            // value in the innerHTML.
            innerHTML = propValue;
            break;

          case 'defaultValue':
          case 'value':
            // These are set on the Context instead and applied to the nested options.
            break;

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    target.push(endOfStartTag);
    pushInnerHTML(target, innerHTML, children);
    return children;
  }

  function flattenOptionChildren(children) {
    var content = ''; // Flatten children and warn if they aren't strings or numbers;
    // invalid types are ignored.

    React.Children.forEach(children, function (child) {
      if (child == null) {
        return;
      }

      content += child;

      {
        if (!didWarnInvalidOptionChildren && typeof child !== 'string' && typeof child !== 'number' && (typeof child !== 'bigint' || !enableBigIntSupport)) {
          didWarnInvalidOptionChildren = true;

          error('Cannot infer the option value of complex children. ' + 'Pass a `value` prop or use a plain string as children to <option>.');
        }
      }
    });
    return content;
  }

  var selectedMarkerAttribute = stringToPrecomputedChunk(' selected=""');

  function pushStartOption(target, props, formatContext) {
    var selectedValue = formatContext.selectedValue;
    target.push(startChunkForTag('option'));
    var children = null;
    var value = null;
    var selected = null;
    var innerHTML = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'selected':
            // ignore
            selected = propValue;

            {
              // TODO: Remove support for `selected` in <option>.
              if (!didWarnSelectedSetOnOption) {
                error('Use the `defaultValue` or `value` props on <select> instead of ' + 'setting `selected` on <option>.');

                didWarnSelectedSetOnOption = true;
              }
            }

            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;

          case 'value':
            value = propValue;
          // We intentionally fallthrough to also set the attribute on the node.

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    if (selectedValue != null) {
      var stringValue;

      if (value !== null) {
        {
          checkAttributeStringCoercion(value, 'value');
        }

        stringValue = '' + value;
      } else {
        {
          if (innerHTML !== null) {
            if (!didWarnInvalidOptionInnerHTML) {
              didWarnInvalidOptionInnerHTML = true;

              error('Pass a `value` prop if you set dangerouslyInnerHTML so React knows ' + 'which value should be selected.');
            }
          }
        }

        stringValue = flattenOptionChildren(children);
      }

      if (isArray(selectedValue)) {
        // multiple
        for (var i = 0; i < selectedValue.length; i++) {
          {
            checkAttributeStringCoercion(selectedValue[i], 'value');
          }

          var v = '' + selectedValue[i];

          if (v === stringValue) {
            target.push(selectedMarkerAttribute);
            break;
          }
        }
      } else {
        {
          checkAttributeStringCoercion(selectedValue, 'select.value');
        }

        if ('' + selectedValue === stringValue) {
          target.push(selectedMarkerAttribute);
        }
      }
    } else if (selected) {
      target.push(selectedMarkerAttribute);
    }

    target.push(endOfStartTag);
    pushInnerHTML(target, innerHTML, children);
    return children;
  }

  var formReplayingRuntimeScript = stringToPrecomputedChunk(formReplaying);

  function injectFormReplayingRuntime(resumableState, renderState) {
    // If we haven't sent it yet, inject the runtime that tracks submitted JS actions
    // for later replaying by Fiber. If we use an external runtime, we don't need
    // to emit anything. It's always used.
    if ((resumableState.instructions & SentFormReplayingRuntime) === NothingSent && (!renderState.externalRuntimeScript)) {
      resumableState.instructions |= SentFormReplayingRuntime;
      renderState.bootstrapChunks.unshift(renderState.startInlineScript, formReplayingRuntimeScript, endInlineScript);
    }
  }

  var formStateMarkerIsMatching = stringToPrecomputedChunk('<!--F!-->');
  var formStateMarkerIsNotMatching = stringToPrecomputedChunk('<!--F-->');
  function pushFormStateMarkerIsMatching(target) {
    target.push(formStateMarkerIsMatching);
  }
  function pushFormStateMarkerIsNotMatching(target) {
    target.push(formStateMarkerIsNotMatching);
  }

  function pushStartForm(target, props, resumableState, renderState) {
    target.push(startChunkForTag('form'));
    var children = null;
    var innerHTML = null;
    var formAction = null;
    var formEncType = null;
    var formMethod = null;
    var formTarget = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;

          case 'action':
            formAction = propValue;
            break;

          case 'encType':
            formEncType = propValue;
            break;

          case 'method':
            formMethod = propValue;
            break;

          case 'target':
            formTarget = propValue;
            break;

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    var formData = null;
    var formActionName = null;

    if (typeof formAction === 'function') {
      // Function form actions cannot control the form properties
      {
        if ((formEncType !== null || formMethod !== null) && !didWarnFormActionMethod) {
          didWarnFormActionMethod = true;

          error('Cannot specify a encType or method for a form that specifies a ' + 'function as the action. React provides those automatically. ' + 'They will get overridden.');
        }

        if (formTarget !== null && !didWarnFormActionTarget) {
          didWarnFormActionTarget = true;

          error('Cannot specify a target for a form that specifies a function as the action. ' + 'The function will always be executed in the same window.');
        }
      }

      var customAction = formAction.$$FORM_ACTION;

      if (typeof customAction === 'function') {
        // This action has a custom progressive enhancement form that can submit the form
        // back to the server if it's invoked before hydration. Such as a Server Action.
        var prefix = makeFormFieldPrefix(resumableState);
        var customFields = formAction.$$FORM_ACTION(prefix);
        formAction = customFields.action || '';
        formEncType = customFields.encType;
        formMethod = customFields.method;
        formTarget = customFields.target;
        formData = customFields.data;
        formActionName = customFields.name;
      } else {
        // Set a javascript URL that doesn't do anything. We don't expect this to be invoked
        // because we'll preventDefault in the Fizz runtime, but it can happen if a form is
        // manually submitted or if someone calls stopPropagation before React gets the event.
        // If CSP is used to block javascript: URLs that's fine too. It just won't show this
        // error message but the URL will be logged.
        target.push(attributeSeparator, stringToChunk('action'), attributeAssign, actionJavaScriptURL, attributeEnd);
        formAction = null;
        formEncType = null;
        formMethod = null;
        formTarget = null;
        injectFormReplayingRuntime(resumableState, renderState);
      }
    }

    if (formAction != null) {
      pushAttribute(target, 'action', formAction);
    }

    if (formEncType != null) {
      pushAttribute(target, 'encType', formEncType);
    }

    if (formMethod != null) {
      pushAttribute(target, 'method', formMethod);
    }

    if (formTarget != null) {
      pushAttribute(target, 'target', formTarget);
    }

    target.push(endOfStartTag);

    if (formActionName !== null) {
      target.push(startHiddenInputChunk);
      pushStringAttribute(target, 'name', formActionName);
      target.push(endOfStartTagSelfClosing);
      pushAdditionalFormFields(target, formData);
    }

    pushInnerHTML(target, innerHTML, children);

    if (typeof children === 'string') {
      // Special case children as a string to avoid the unnecessary comment.
      // TODO: Remove this special case after the general optimization is in place.
      target.push(stringToChunk(encodeHTMLTextNode(children)));
      return null;
    }

    return children;
  }

  function pushInput(target, props, resumableState, renderState) {
    {
      checkControlledValueProps('input', props);
    }

    target.push(startChunkForTag('input'));
    var name = null;
    var formAction = null;
    var formEncType = null;
    var formMethod = null;
    var formTarget = null;
    var value = null;
    var defaultValue = null;
    var checked = null;
    var defaultChecked = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
          case 'dangerouslySetInnerHTML':
            throw new Error('input' + " is a self-closing tag and must neither have `children` nor " + 'use `dangerouslySetInnerHTML`.');

          case 'name':
            name = propValue;
            break;

          case 'formAction':
            formAction = propValue;
            break;

          case 'formEncType':
            formEncType = propValue;
            break;

          case 'formMethod':
            formMethod = propValue;
            break;

          case 'formTarget':
            formTarget = propValue;
            break;

          case 'defaultChecked':
            defaultChecked = propValue;
            break;

          case 'defaultValue':
            defaultValue = propValue;
            break;

          case 'checked':
            checked = propValue;
            break;

          case 'value':
            value = propValue;
            break;

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    {
      if (formAction !== null && props.type !== 'image' && props.type !== 'submit' && !didWarnFormActionType) {
        didWarnFormActionType = true;

        error('An input can only specify a formAction along with type="submit" or type="image".');
      }
    }

    var formData = pushFormActionAttribute(target, resumableState, renderState, formAction, formEncType, formMethod, formTarget, name);

    {
      if (checked !== null && defaultChecked !== null && !didWarnDefaultChecked) {
        error('%s contains an input of type %s with both checked and defaultChecked props. ' + 'Input elements must be either controlled or uncontrolled ' + '(specify either the checked prop, or the defaultChecked prop, but not ' + 'both). Decide between using a controlled or uncontrolled input ' + 'element and remove one of these props. More info: ' + 'https://reactjs.org/link/controlled-components', 'A component', props.type);

        didWarnDefaultChecked = true;
      }

      if (value !== null && defaultValue !== null && !didWarnDefaultInputValue) {
        error('%s contains an input of type %s with both value and defaultValue props. ' + 'Input elements must be either controlled or uncontrolled ' + '(specify either the value prop, or the defaultValue prop, but not ' + 'both). Decide between using a controlled or uncontrolled input ' + 'element and remove one of these props. More info: ' + 'https://reactjs.org/link/controlled-components', 'A component', props.type);

        didWarnDefaultInputValue = true;
      }
    }

    if (checked !== null) {
      pushBooleanAttribute(target, 'checked', checked);
    } else if (defaultChecked !== null) {
      pushBooleanAttribute(target, 'checked', defaultChecked);
    }

    if (value !== null) {
      pushAttribute(target, 'value', value);
    } else if (defaultValue !== null) {
      pushAttribute(target, 'value', defaultValue);
    }

    target.push(endOfStartTagSelfClosing); // We place any additional hidden form fields after the input.

    pushAdditionalFormFields(target, formData);
    return null;
  }

  function pushStartButton(target, props, resumableState, renderState) {
    target.push(startChunkForTag('button'));
    var children = null;
    var innerHTML = null;
    var name = null;
    var formAction = null;
    var formEncType = null;
    var formMethod = null;
    var formTarget = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;

          case 'name':
            name = propValue;
            break;

          case 'formAction':
            formAction = propValue;
            break;

          case 'formEncType':
            formEncType = propValue;
            break;

          case 'formMethod':
            formMethod = propValue;
            break;

          case 'formTarget':
            formTarget = propValue;
            break;

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    {
      if (formAction !== null && props.type != null && props.type !== 'submit' && !didWarnFormActionType) {
        didWarnFormActionType = true;

        error('A button can only specify a formAction along with type="submit" or no type.');
      }
    }

    var formData = pushFormActionAttribute(target, resumableState, renderState, formAction, formEncType, formMethod, formTarget, name);
    target.push(endOfStartTag); // We place any additional hidden form fields we need to include inside the button itself.

    pushAdditionalFormFields(target, formData);
    pushInnerHTML(target, innerHTML, children);

    if (typeof children === 'string') {
      // Special case children as a string to avoid the unnecessary comment.
      // TODO: Remove this special case after the general optimization is in place.
      target.push(stringToChunk(encodeHTMLTextNode(children)));
      return null;
    }

    return children;
  }

  function pushStartTextArea(target, props) {
    {
      checkControlledValueProps('textarea', props);

      if (props.value !== undefined && props.defaultValue !== undefined && !didWarnDefaultTextareaValue) {
        error('Textarea elements must be either controlled or uncontrolled ' + '(specify either the value prop, or the defaultValue prop, but not ' + 'both). Decide between using a controlled or uncontrolled textarea ' + 'and remove one of these props. More info: ' + 'https://reactjs.org/link/controlled-components');

        didWarnDefaultTextareaValue = true;
      }
    }

    target.push(startChunkForTag('textarea'));
    var value = null;
    var defaultValue = null;
    var children = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'value':
            value = propValue;
            break;

          case 'defaultValue':
            defaultValue = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            throw new Error('`dangerouslySetInnerHTML` does not make sense on <textarea>.');

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    if (value === null && defaultValue !== null) {
      value = defaultValue;
    }

    target.push(endOfStartTag); // TODO (yungsters): Remove support for children content in <textarea>.

    if (children != null) {
      {
        error('Use the `defaultValue` or `value` props instead of setting ' + 'children on <textarea>.');
      }

      if (value != null) {
        throw new Error('If you supply `defaultValue` on a <textarea>, do not pass children.');
      }

      if (isArray(children)) {
        if (children.length > 1) {
          throw new Error('<textarea> can only have at most one child.');
        } // TODO: remove the coercion and the DEV check below because it will
        // always be overwritten by the coercion several lines below it. #22309


        {
          checkHtmlStringCoercion(children[0]);
        }

        value = '' + children[0];
      }

      {
        checkHtmlStringCoercion(children);
      }

      value = '' + children;
    }

    if (typeof value === 'string' && value[0] === '\n') {
      // text/html ignores the first character in these tags if it's a newline
      // Prefer to break application/xml over text/html (for now) by adding
      // a newline specifically to get eaten by the parser. (Alternately for
      // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
      // \r is normalized out by HTMLTextAreaElement#value.)
      // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
      // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
      // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
      // See: Parsing of "textarea" "listing" and "pre" elements
      //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
      target.push(leadingNewline);
    } // ToString and push directly instead of recurse over children.
    // We don't really support complex children in the value anyway.
    // This also currently avoids a trailing comment node which breaks textarea.


    if (value !== null) {
      {
        checkAttributeStringCoercion(value, 'value');
      }

      target.push(stringToChunk(encodeHTMLTextNode('' + value)));
    }

    return null;
  }

  function pushMeta(target, props, renderState, textEmbedded, insertionMode, noscriptTagInScope, isFallback) {
    {
      if (insertionMode === SVG_MODE || noscriptTagInScope || props.itemProp != null) {
        return pushSelfClosing(target, props, 'meta');
      } else {
        if (textEmbedded) {
          // This link follows text but we aren't writing a tag. while not as efficient as possible we need
          // to be safe and assume text will follow by inserting a textSeparator
          target.push(textSeparator);
        }

        if (isFallback) {
          // Hoistable Elements for fallbacks are simply omitted. we don't want to emit them early
          // because they are likely superceded by primary content and we want to avoid needing to clean
          // them up when the primary content is ready. They are never hydrated on the client anyway because
          // boundaries in fallback are awaited or client render, in either case there is never hydration
          return null;
        } else if (typeof props.charSet === 'string') {
          // "charset" Should really be config and not picked up from tags however since this is
          // the only way to embed the tag today we flush it on a special queue on the Request so it
          // can go before everything else. Like viewport this means that the tag will escape it's
          // parent container.
          return pushSelfClosing(renderState.charsetChunks, props, 'meta');
        } else if (props.name === 'viewport') {
          // "viewport" is flushed on the Request so it can go earlier that Float resources that
          // might be affected by it. This means it can escape the boundary it is rendered within.
          // This is a pragmatic solution to viewport being incredibly sensitive to document order
          // without requiring all hoistables to be flushed too early.
          return pushSelfClosing(renderState.viewportChunks, props, 'meta');
        } else {
          return pushSelfClosing(renderState.hoistableChunks, props, 'meta');
        }
      }
    }
  }

  function pushLink(target, props, resumableState, renderState, hoistableState, textEmbedded, insertionMode, noscriptTagInScope, isFallback) {
    {
      var rel = props.rel;
      var href = props.href;
      var precedence = props.precedence;

      if (insertionMode === SVG_MODE || noscriptTagInScope || props.itemProp != null || typeof rel !== 'string' || typeof href !== 'string' || href === '') {
        {
          if (rel === 'stylesheet' && typeof props.precedence === 'string') {
            if (typeof href !== 'string' || !href) {
              error('React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and expected the `href` prop to be a non-empty string but ecountered %s instead. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop ensure there is a non-empty string `href` prop as well, otherwise remove the `precedence` prop.', getValueDescriptorExpectingObjectForWarning(href));
            }
          }
        }

        pushLinkImpl(target, props);
        return null;
      }

      if (props.rel === 'stylesheet') {
        // This <link> may hoistable as a Stylesheet Resource, otherwise it will emit in place
        var key = getResourceKey(href);

        if (typeof precedence !== 'string' || props.disabled != null || props.onLoad || props.onError) {
          // This stylesheet is either not opted into Resource semantics or has conflicting properties which
          // disqualify it for such. We can still create a preload resource to help it load faster on the
          // client
          {
            if (typeof precedence === 'string') {
              if (props.disabled != null) {
                error('React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and a `disabled` prop. The presence of the `disabled` prop indicates an intent to manage the stylesheet active state from your from your Component code and React will not hoist or deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop remove the `disabled` prop, otherwise remove the `precedence` prop.');
              } else if (props.onLoad || props.onError) {
                var propDescription = props.onLoad && props.onError ? '`onLoad` and `onError` props' : props.onLoad ? '`onLoad` prop' : '`onError` prop';

                error('React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and %s. The presence of loading and error handlers indicates an intent to manage the stylesheet loading state from your from your Component code and React will not hoist or deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop remove the %s, otherwise remove the `precedence` prop.', propDescription, propDescription);
              }
            }
          }

          return pushLinkImpl(target, props);
        } else {
          // This stylesheet refers to a Resource and we create a new one if necessary
          var styleQueue = renderState.styles.get(precedence);
          var hasKey = resumableState.styleResources.hasOwnProperty(key);
          var resourceState = hasKey ? resumableState.styleResources[key] : undefined;

          if (resourceState !== EXISTS) {
            // We are going to create this resource now so it is marked as Exists
            resumableState.styleResources[key] = EXISTS; // If this is the first time we've encountered this precedence we need
            // to create a StyleQueue

            if (!styleQueue) {
              styleQueue = {
                precedence: stringToChunk(escapeTextForBrowser(precedence)),
                rules: [],
                hrefs: [],
                sheets: new Map()
              };
              renderState.styles.set(precedence, styleQueue);
            }

            var resource = {
              state: PENDING$1,
              props: stylesheetPropsFromRawProps(props)
            };

            if (resourceState) {
              // When resourceState is truty it is a Preload state. We cast it for clarity
              var preloadState = resourceState;

              if (preloadState.length === 2) {
                adoptPreloadCredentials(resource.props, preloadState);
              }

              var preloadResource = renderState.preloads.stylesheets.get(key);

              if (preloadResource && preloadResource.length > 0) {
                // The Preload for this resource was created in this render pass and has not flushed yet so
                // we need to clear it to avoid it flushing.
                preloadResource.length = 0;
              } else {
                // Either the preload resource from this render already flushed in this render pass
                // or the preload flushed in a prior pass (prerender). In either case we need to mark
                // this resource as already having been preloaded.
                resource.state = PRELOADED;
              }
            } // We add the newly created resource to our StyleQueue and if necessary
            // track the resource with the currently rendering boundary


            styleQueue.sheets.set(key, resource);

            if (hoistableState) {
              hoistableState.stylesheets.add(resource);
            }
          } else {
            // We need to track whether this boundary should wait on this resource or not.
            // Typically this resource should always exist since we either had it or just created
            // it. However, it's possible when you resume that the style has already been emitted
            // and then it wouldn't be recreated in the RenderState and there's no need to track
            // it again since we should've hoisted it to the shell already.
            if (styleQueue) {
              var _resource = styleQueue.sheets.get(key);

              if (_resource) {
                if (hoistableState) {
                  hoistableState.stylesheets.add(_resource);
                }
              }
            }
          }

          if (textEmbedded) {
            // This link follows text but we aren't writing a tag. while not as efficient as possible we need
            // to be safe and assume text will follow by inserting a textSeparator
            target.push(textSeparator);
          }

          return null;
        }
      } else if (props.onLoad || props.onError) {
        // When using load handlers we cannot hoist and need to emit links in place
        return pushLinkImpl(target, props);
      } else {
        // We can hoist this link so we may need to emit a text separator.
        // @TODO refactor text separators so we don't have to defensively add
        // them when we don't end up emitting a tag as a result of pushStartInstance
        if (textEmbedded) {
          // This link follows text but we aren't writing a tag. while not as efficient as possible we need
          // to be safe and assume text will follow by inserting a textSeparator
          target.push(textSeparator);
        }

        if (isFallback) {
          // Hoistable Elements for fallbacks are simply omitted. we don't want to emit them early
          // because they are likely superceded by primary content and we want to avoid needing to clean
          // them up when the primary content is ready. They are never hydrated on the client anyway because
          // boundaries in fallback are awaited or client render, in either case there is never hydration
          return null;
        } else {
          return pushLinkImpl(renderState.hoistableChunks, props);
        }
      }
    }
  }

  function pushLinkImpl(target, props) {
    target.push(startChunkForTag('link'));

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
          case 'dangerouslySetInnerHTML':
            throw new Error('link' + " is a self-closing tag and must neither have `children` nor " + 'use `dangerouslySetInnerHTML`.');

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    target.push(endOfStartTagSelfClosing);
    return null;
  }

  function pushStyle(target, props, resumableState, renderState, hoistableState, textEmbedded, insertionMode, noscriptTagInScope) {
    {
      if (hasOwnProperty.call(props, 'children')) {
        var children = props.children;
        var child = Array.isArray(children) ? children.length < 2 ? children[0] : null : children;

        if (typeof child === 'function' || typeof child === 'symbol' || Array.isArray(child)) {
          var childType = typeof child === 'function' ? 'a Function' : typeof child === 'symbol' ? 'a Sybmol' : 'an Array';

          error('React expect children of <style> tags to be a string, number, or object with a `toString` method but found %s instead. ' + 'In browsers style Elements can only have `Text` Nodes as children.', childType);
        }
      }
    }

    {
      var precedence = props.precedence;
      var href = props.href;

      if (insertionMode === SVG_MODE || noscriptTagInScope || props.itemProp != null || typeof precedence !== 'string' || typeof href !== 'string' || href === '') {
        // This style tag is not able to be turned into a Style Resource
        return pushStyleImpl(target, props);
      }

      {
        if (href.includes(' ')) {
          error('React expected the `href` prop for a <style> tag opting into hoisting semantics using the `precedence` prop to not have any spaces but ecountered spaces instead. using spaces in this prop will cause hydration of this style to fail on the client. The href for the <style> where this ocurred is "%s".', href);
        }
      }

      var key = getResourceKey(href);
      var styleQueue = renderState.styles.get(precedence);
      var hasKey = resumableState.styleResources.hasOwnProperty(key);
      var resourceState = hasKey ? resumableState.styleResources[key] : undefined;

      if (resourceState !== EXISTS) {
        // We are going to create this resource now so it is marked as Exists
        resumableState.styleResources[key] = EXISTS;

        {
          if (resourceState) {
            error('React encountered a hoistable style tag for the same href as a preload: "%s". When using a style tag to inline styles you should not also preload it as a stylsheet.', href);
          }
        }

        if (!styleQueue) {
          // This is the first time we've encountered this precedence we need
          // to create a StyleQueue.
          styleQueue = {
            precedence: stringToChunk(escapeTextForBrowser(precedence)),
            rules: [],
            hrefs: [stringToChunk(escapeTextForBrowser(href))],
            sheets: new Map()
          };
          renderState.styles.set(precedence, styleQueue);
        } else {
          // We have seen this precedence before and need to track this href
          styleQueue.hrefs.push(stringToChunk(escapeTextForBrowser(href)));
        }

        pushStyleContents(styleQueue.rules, props);
      }

      if (styleQueue) {
        // We need to track whether this boundary should wait on this resource or not.
        // Typically this resource should always exist since we either had it or just created
        // it. However, it's possible when you resume that the style has already been emitted
        // and then it wouldn't be recreated in the RenderState and there's no need to track
        // it again since we should've hoisted it to the shell already.
        if (hoistableState) {
          hoistableState.styles.add(styleQueue);
        }
      }

      if (textEmbedded) {
        // This link follows text but we aren't writing a tag. while not as efficient as possible we need
        // to be safe and assume text will follow by inserting a textSeparator
        target.push(textSeparator);
      }
    }
  }

  function pushStyleImpl(target, props) {
    target.push(startChunkForTag('style'));
    var children = null;
    var innerHTML = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    target.push(endOfStartTag);
    var child = Array.isArray(children) ? children.length < 2 ? children[0] : null : children;

    if (typeof child !== 'function' && typeof child !== 'symbol' && child !== null && child !== undefined) {
      // eslint-disable-next-line react-internal/safe-string-coercion
      target.push(stringToChunk(escapeTextForBrowser('' + child)));
    }

    pushInnerHTML(target, innerHTML, children);
    target.push(endChunkForTag('style'));
    return null;
  }

  function pushStyleContents(target, props) {
    var children = null;
    var innerHTML = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;
        }
      }
    }

    var child = Array.isArray(children) ? children.length < 2 ? children[0] : null : children;

    if (typeof child !== 'function' && typeof child !== 'symbol' && child !== null && child !== undefined) {
      // eslint-disable-next-line react-internal/safe-string-coercion
      target.push(stringToChunk(escapeTextForBrowser('' + child)));
    }

    pushInnerHTML(target, innerHTML, children);
    return;
  }

  function pushImg(target, props, resumableState, renderState, pictureTagInScope) {
    var src = props.src,
        srcSet = props.srcSet;

    if (props.loading !== 'lazy' && (src || srcSet) && (typeof src === 'string' || src == null) && (typeof srcSet === 'string' || srcSet == null) && props.fetchPriority !== 'low' && pictureTagInScope === false && // We exclude data URIs in src and srcSet since these should not be preloaded
    !(typeof src === 'string' && src[4] === ':' && (src[0] === 'd' || src[0] === 'D') && (src[1] === 'a' || src[1] === 'A') && (src[2] === 't' || src[2] === 'T') && (src[3] === 'a' || src[3] === 'A')) && !(typeof srcSet === 'string' && srcSet[4] === ':' && (srcSet[0] === 'd' || srcSet[0] === 'D') && (srcSet[1] === 'a' || srcSet[1] === 'A') && (srcSet[2] === 't' || srcSet[2] === 'T') && (srcSet[3] === 'a' || srcSet[3] === 'A'))) {
      // We have a suspensey image and ought to preload it to optimize the loading of display blocking
      // resumableState.
      var sizes = typeof props.sizes === 'string' ? props.sizes : undefined;
      var key = getImageResourceKey(src, srcSet, sizes);
      var promotablePreloads = renderState.preloads.images;
      var resource = promotablePreloads.get(key);

      if (resource) {
        // We consider whether this preload can be promoted to higher priority flushing queue.
        // The only time a resource will exist here is if it was created during this render
        // and was not already in the high priority queue.
        if (props.fetchPriority === 'high' || renderState.highImagePreloads.size < 10) {
          // Delete the resource from the map since we are promoting it and don't want to
          // reenter this branch in a second pass for duplicate img hrefs.
          promotablePreloads.delete(key); // $FlowFixMe - Flow should understand that this is a Resource if the condition was true

          renderState.highImagePreloads.add(resource);
        }
      } else if (!resumableState.imageResources.hasOwnProperty(key)) {
        // We must construct a new preload resource
        resumableState.imageResources[key] = PRELOAD_NO_CREDS;
        var crossOrigin = getCrossOriginString(props.crossOrigin);
        var headers = renderState.headers;
        var header;

        if (headers && headers.remainingCapacity > 0 && ( // this is a hueristic similar to capping element preloads to 10 unless explicitly
        // fetchPriority="high". We use length here which means it will fit fewer images when
        // the urls are long and more when short. arguably byte size is a better hueristic because
        // it directly translates to how much we send down before content is actually seen.
        // We could unify the counts and also make it so the total is tracked regardless of
        // flushing output but since the headers are likely to be go earlier than content
        // they don't really conflict so for now I've kept them separate
        props.fetchPriority === 'high' || headers.highImagePreloads.length < 500) && ( // We manually construct the options for the preload only from strings. We don't want to pollute
        // the params list with arbitrary props and if we copied everything over as it we might get
        // coercion errors. We have checks for this in Dev but it seems safer to just only accept values
        // that are strings
        header = getPreloadAsHeader(src, 'image', {
          imageSrcSet: props.srcSet,
          imageSizes: props.sizes,
          crossOrigin: crossOrigin,
          integrity: props.integrity,
          nonce: props.nonce,
          type: props.type,
          fetchPriority: props.fetchPriority,
          referrerPolicy: props.refererPolicy
        }), // We always consume the header length since once we find one header that doesn't fit
        // we assume all the rest won't as well. This is to avoid getting into a situation
        // where we have a very small remaining capacity but no headers will ever fit and we end
        // up constantly trying to see if the next resource might make it. In the future we can
        // make this behavior different between render and prerender since in the latter case
        // we are less sensitive to the current requests runtime per and more sensitive to maximizing
        // headers.
        (headers.remainingCapacity -= header.length) >= 2)) {
          // If we postpone in the shell we will still emit this preload so we track
          // it to make sure we don't reset it.
          renderState.resets.image[key] = PRELOAD_NO_CREDS;

          if (headers.highImagePreloads) {
            headers.highImagePreloads += ', ';
          } // $FlowFixMe[unsafe-addition]: we assign header during the if condition


          headers.highImagePreloads += header;
        } else {
          resource = [];
          pushLinkImpl(resource, {
            rel: 'preload',
            as: 'image',
            // There is a bug in Safari where imageSrcSet is not respected on preload links
            // so we omit the href here if we have imageSrcSet b/c safari will load the wrong image.
            // This harms older browers that do not support imageSrcSet by making their preloads not work
            // but this population is shrinking fast and is already small so we accept this tradeoff.
            href: srcSet ? undefined : src,
            imageSrcSet: srcSet,
            imageSizes: sizes,
            crossOrigin: crossOrigin,
            integrity: props.integrity,
            type: props.type,
            fetchPriority: props.fetchPriority,
            referrerPolicy: props.referrerPolicy
          });

          if (props.fetchPriority === 'high' || renderState.highImagePreloads.size < 10) {
            renderState.highImagePreloads.add(resource);
          } else {
            renderState.bulkPreloads.add(resource); // We can bump the priority up if the same img is rendered later
            // with fetchPriority="high"

            promotablePreloads.set(key, resource);
          }
        }
      }
    }

    return pushSelfClosing(target, props, 'img');
  }

  function pushSelfClosing(target, props, tag) {
    target.push(startChunkForTag(tag));

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
          case 'dangerouslySetInnerHTML':
            throw new Error(tag + " is a self-closing tag and must neither have `children` nor " + 'use `dangerouslySetInnerHTML`.');

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    target.push(endOfStartTagSelfClosing);
    return null;
  }

  function pushStartMenuItem(target, props) {
    target.push(startChunkForTag('menuitem'));

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
          case 'dangerouslySetInnerHTML':
            throw new Error('menuitems cannot have `children` nor `dangerouslySetInnerHTML`.');

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    target.push(endOfStartTag);
    return null;
  }

  function pushTitle(target, props, renderState, insertionMode, noscriptTagInScope, isFallback) {
    {
      if (hasOwnProperty.call(props, 'children')) {
        var children = props.children;
        var child = Array.isArray(children) ? children.length < 2 ? children[0] : null : children;

        if (Array.isArray(children) && children.length > 1) {
          error('React expects the `children` prop of <title> tags to be a string, number%s, or object with a novel `toString` method but found an Array with length %s instead.' + ' Browsers treat all child Nodes of <title> tags as Text content and React expects to be able to convert `children` of <title> tags to a single string value' + ' which is why Arrays of length greater than 1 are not supported. When using JSX it can be commong to combine text nodes and value nodes.' + ' For example: <title>hello {nameOfUser}</title>. While not immediately apparent, `children` in this case is an Array with length 2. If your `children` prop' + ' is using this form try rewriting it using a template string: <title>{`hello ${nameOfUser}`}</title>.', ', bigint' , children.length);
        } else if (typeof child === 'function' || typeof child === 'symbol') {
          var childType = typeof child === 'function' ? 'a Function' : 'a Sybmol';

          error('React expect children of <title> tags to be a string, number%s, or object with a novel `toString` method but found %s instead.' + ' Browsers treat all child Nodes of <title> tags as Text content and React expects to be able to convert children of <title>' + ' tags to a single string value.', ', bigint' , childType);
        } else if (child && child.toString === {}.toString) {
          if (child.$$typeof != null) {
            error('React expects the `children` prop of <title> tags to be a string, number%s, or object with a novel `toString` method but found an object that appears to be' + ' a React element which never implements a suitable `toString` method. Browsers treat all child Nodes of <title> tags as Text content and React expects to' + ' be able to convert children of <title> tags to a single string value which is why rendering React elements is not supported. If the `children` of <title> is' + ' a React Component try moving the <title> tag into that component. If the `children` of <title> is some HTML markup change it to be Text only to be valid HTML.', ', bigint' );
          } else {
            error('React expects the `children` prop of <title> tags to be a string, number%s, or object with a novel `toString` method but found an object that does not implement' + ' a suitable `toString` method. Browsers treat all child Nodes of <title> tags as Text content and React expects to be able to convert children of <title> tags' + ' to a single string value. Using the default `toString` method available on every object is almost certainly an error. Consider whether the `children` of this <title>' + ' is an object in error and change it to a string or number value if so. Otherwise implement a `toString` method that React can use to produce a valid <title>.', ', bigint' );
          }
        }
      }
    }

    {
      if (insertionMode !== SVG_MODE && !noscriptTagInScope && props.itemProp == null) {
        if (isFallback) {
          // Hoistable Elements for fallbacks are simply omitted. we don't want to emit them early
          // because they are likely superceded by primary content and we want to avoid needing to clean
          // them up when the primary content is ready. They are never hydrated on the client anyway because
          // boundaries in fallback are awaited or client render, in either case there is never hydration
          return null;
        } else {
          pushTitleImpl(renderState.hoistableChunks, props);
        }
      } else {
        return pushTitleImpl(target, props);
      }
    }
  }

  function pushTitleImpl(target, props) {
    target.push(startChunkForTag('title'));
    var children = null;
    var innerHTML = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    target.push(endOfStartTag);
    var child = Array.isArray(children) ? children.length < 2 ? children[0] : null : children;

    if (typeof child !== 'function' && typeof child !== 'symbol' && child !== null && child !== undefined) {
      // eslint-disable-next-line react-internal/safe-string-coercion
      target.push(stringToChunk(escapeTextForBrowser('' + child)));
    }

    pushInnerHTML(target, innerHTML, children);
    target.push(endChunkForTag('title'));
    return null;
  }

  function pushStartHead(target, props, renderState, insertionMode) {
    {
      if (insertionMode < HTML_MODE && renderState.headChunks === null) {
        // This <head> is the Document.head and should be part of the preamble
        renderState.headChunks = [];
        return pushStartGenericElement(renderState.headChunks, props, 'head');
      } else {
        // This <head> is deep and is likely just an error. we emit it inline though.
        // Validation should warn that this tag is the the wrong spot.
        return pushStartGenericElement(target, props, 'head');
      }
    }
  }

  function pushStartHtml(target, props, renderState, insertionMode) {
    {
      if (insertionMode === ROOT_HTML_MODE && renderState.htmlChunks === null) {
        // This <html> is the Document.documentElement and should be part of the preamble
        renderState.htmlChunks = [doctypeChunk];
        return pushStartGenericElement(renderState.htmlChunks, props, 'html');
      } else {
        // This <html> is deep and is likely just an error. we emit it inline though.
        // Validation should warn that this tag is the the wrong spot.
        return pushStartGenericElement(target, props, 'html');
      }
    }
  }

  function pushScript(target, props, resumableState, renderState, textEmbedded, insertionMode, noscriptTagInScope) {
    {
      var asyncProp = props.async;

      if (typeof props.src !== 'string' || !props.src || !(asyncProp && typeof asyncProp !== 'function' && typeof asyncProp !== 'symbol') || props.onLoad || props.onError || insertionMode === SVG_MODE || noscriptTagInScope || props.itemProp != null) {
        // This script will not be a resource, we bailout early and emit it in place.
        return pushScriptImpl(target, props);
      }

      var src = props.src;
      var key = getResourceKey(src); // We can make this <script> into a ScriptResource

      var resources, preloads;

      if (props.type === 'module') {
        resources = resumableState.moduleScriptResources;
        preloads = renderState.preloads.moduleScripts;
      } else {
        resources = resumableState.scriptResources;
        preloads = renderState.preloads.scripts;
      }

      var hasKey = resources.hasOwnProperty(key);
      var resourceState = hasKey ? resources[key] : undefined;

      if (resourceState !== EXISTS) {
        // We are going to create this resource now so it is marked as Exists
        resources[key] = EXISTS;
        var scriptProps = props;

        if (resourceState) {
          // When resourceState is truty it is a Preload state. We cast it for clarity
          var preloadState = resourceState;

          if (preloadState.length === 2) {
            scriptProps = assign({}, props);
            adoptPreloadCredentials(scriptProps, preloadState);
          }

          var preloadResource = preloads.get(key);

          if (preloadResource) {
            // the preload resource exists was created in this render. Now that we have
            // a script resource which will emit earlier than a preload would if it
            // hasn't already flushed we prevent it from flushing by zeroing the length
            preloadResource.length = 0;
          }
        }

        var resource = []; // Add to the script flushing queue

        renderState.scripts.add(resource); // encode the tag as Chunks

        pushScriptImpl(resource, scriptProps);
      }

      if (textEmbedded) {
        // This script follows text but we aren't writing a tag. while not as efficient as possible we need
        // to be safe and assume text will follow by inserting a textSeparator
        target.push(textSeparator);
      }

      return null;
    }
  }

  function pushScriptImpl(target, props) {
    target.push(startChunkForTag('script'));
    var children = null;
    var innerHTML = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    target.push(endOfStartTag);

    {
      if (children != null && typeof children !== 'string') {
        var descriptiveStatement = typeof children === 'number' ? 'a number for children' : Array.isArray(children) ? 'an array for children' : 'something unexpected for children';

        error('A script element was rendered with %s. If script element has children it must be a single string.' + ' Consider using dangerouslySetInnerHTML or passing a plain string as children.', descriptiveStatement);
      }
    }

    pushInnerHTML(target, innerHTML, children);

    if (typeof children === 'string') {
      target.push(stringToChunk(encodeHTMLTextNode(children)));
    }

    target.push(endChunkForTag('script'));
    return null;
  }

  function pushStartGenericElement(target, props, tag) {
    target.push(startChunkForTag(tag));
    var children = null;
    var innerHTML = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    target.push(endOfStartTag);
    pushInnerHTML(target, innerHTML, children);

    if (typeof children === 'string') {
      // Special case children as a string to avoid the unnecessary comment.
      // TODO: Remove this special case after the general optimization is in place.
      target.push(stringToChunk(encodeHTMLTextNode(children)));
      return null;
    }

    return children;
  }

  function pushStartCustomElement(target, props, tag) {
    target.push(startChunkForTag(tag));
    var children = null;
    var innerHTML = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        var attributeName = propKey;

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;

          case 'style':
            pushStyleAttribute(target, propValue);
            break;

          case 'suppressContentEditableWarning':
          case 'suppressHydrationWarning':
          case 'ref':
            // Ignored. These are built-in to React on the client.
            break;

          case 'className':
            {
              // className gets rendered as class on the client, so it should be
              // rendered as class on the server.
              attributeName = 'class';
            }

          // intentional fallthrough

          default:
            if (isAttributeNameSafe(propKey) && typeof propValue !== 'function' && typeof propValue !== 'symbol') {
              {
                if (propValue === false) {
                  continue;
                } else if (propValue === true) {
                  propValue = '';
                } else if (typeof propValue === 'object') {
                  continue;
                }
              }

              target.push(attributeSeparator, stringToChunk(attributeName), attributeAssign, stringToChunk(escapeTextForBrowser(propValue)), attributeEnd);
            }

            break;
        }
      }
    }

    target.push(endOfStartTag);
    pushInnerHTML(target, innerHTML, children);
    return children;
  }

  var leadingNewline = stringToPrecomputedChunk('\n');

  function pushStartPreformattedElement(target, props, tag) {
    target.push(startChunkForTag(tag));
    var children = null;
    var innerHTML = null;

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'children':
            children = propValue;
            break;

          case 'dangerouslySetInnerHTML':
            innerHTML = propValue;
            break;

          default:
            pushAttribute(target, propKey, propValue);
            break;
        }
      }
    }

    target.push(endOfStartTag); // text/html ignores the first character in these tags if it's a newline
    // Prefer to break application/xml over text/html (for now) by adding
    // a newline specifically to get eaten by the parser. (Alternately for
    // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
    // \r is normalized out by HTMLTextAreaElement#value.)
    // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
    // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
    // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
    // See: Parsing of "textarea" "listing" and "pre" elements
    //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
    // TODO: This doesn't deal with the case where the child is an array
    // or component that returns a string.

    if (innerHTML != null) {
      if (children != null) {
        throw new Error('Can only set one of `children` or `props.dangerouslySetInnerHTML`.');
      }

      if (typeof innerHTML !== 'object' || !('__html' in innerHTML)) {
        throw new Error('`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' + 'Please visit https://reactjs.org/link/dangerously-set-inner-html ' + 'for more information.');
      }

      var html = innerHTML.__html;

      if (html !== null && html !== undefined) {
        if (typeof html === 'string' && html.length > 0 && html[0] === '\n') {
          target.push(leadingNewline, stringToChunk(html));
        } else {
          {
            checkHtmlStringCoercion(html);
          }

          target.push(stringToChunk('' + html));
        }
      }
    }

    if (typeof children === 'string' && children[0] === '\n') {
      target.push(leadingNewline);
    }

    return children;
  } // We accept any tag to be rendered but since this gets injected into arbitrary
  // HTML, we want to make sure that it's a safe tag.
  // http://www.w3.org/TR/REC-xml/#NT-Name


  var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset

  var validatedTagCache = new Map();

  function startChunkForTag(tag) {
    var tagStartChunk = validatedTagCache.get(tag);

    if (tagStartChunk === undefined) {
      if (!VALID_TAG_REGEX.test(tag)) {
        throw new Error("Invalid tag: " + tag);
      }

      tagStartChunk = stringToPrecomputedChunk('<' + tag);
      validatedTagCache.set(tag, tagStartChunk);
    }

    return tagStartChunk;
  }

  var doctypeChunk = stringToPrecomputedChunk('<!DOCTYPE html>');
  function pushStartInstance(target, type, props, resumableState, renderState, hoistableState, formatContext, textEmbedded, isFallback) {
    {
      validateProperties$2(type, props);
      validateProperties$1(type, props);
      validateProperties(type, props, null);

      if (!props.suppressContentEditableWarning && props.contentEditable && props.children != null) {
        error('A component is `contentEditable` and contains `children` managed by ' + 'React. It is now your responsibility to guarantee that none of ' + 'those nodes are unexpectedly modified or duplicated. This is ' + 'probably not intentional.');
      }

      if (formatContext.insertionMode !== SVG_MODE && formatContext.insertionMode !== MATHML_MODE) {
        if (type.indexOf('-') === -1 && type.toLowerCase() !== type) {
          error('<%s /> is using incorrect casing. ' + 'Use PascalCase for React components, ' + 'or lowercase for HTML elements.', type);
        }
      }
    }

    switch (type) {
      case 'div':
      case 'span':
      case 'svg':
      case 'path':
        // Fast track very common tags
        break;

      case 'a':
        {
          return pushStartAnchor(target, props);
        }

      case 'g':
      case 'p':
      case 'li':
        // Fast track very common tags
        break;
      // Special tags

      case 'select':
        return pushStartSelect(target, props);

      case 'option':
        return pushStartOption(target, props, formatContext);

      case 'textarea':
        return pushStartTextArea(target, props);

      case 'input':
        return pushInput(target, props, resumableState, renderState);

      case 'button':
        return pushStartButton(target, props, resumableState, renderState);

      case 'form':
        return pushStartForm(target, props, resumableState, renderState);

      case 'menuitem':
        return pushStartMenuItem(target, props);

      case 'title':
        return pushTitle(target, props, renderState, formatContext.insertionMode, !!(formatContext.tagScope & NOSCRIPT_SCOPE), isFallback) ;

      case 'link':
        return pushLink(target, props, resumableState, renderState, hoistableState, textEmbedded, formatContext.insertionMode, !!(formatContext.tagScope & NOSCRIPT_SCOPE), isFallback);

      case 'script':
        return pushScript(target, props, resumableState, renderState, textEmbedded, formatContext.insertionMode, !!(formatContext.tagScope & NOSCRIPT_SCOPE)) ;

      case 'style':
        return pushStyle(target, props, resumableState, renderState, hoistableState, textEmbedded, formatContext.insertionMode, !!(formatContext.tagScope & NOSCRIPT_SCOPE));

      case 'meta':
        return pushMeta(target, props, renderState, textEmbedded, formatContext.insertionMode, !!(formatContext.tagScope & NOSCRIPT_SCOPE), isFallback);
      // Newline eating tags

      case 'listing':
      case 'pre':
        {
          return pushStartPreformattedElement(target, props, type);
        }

      case 'img':
        {
          return pushImg(target, props, resumableState, renderState, !!(formatContext.tagScope & PICTURE_SCOPE)) ;
        }
      // Omitted close tags

      case 'base':
      case 'area':
      case 'br':
      case 'col':
      case 'embed':
      case 'hr':
      case 'keygen':
      case 'param':
      case 'source':
      case 'track':
      case 'wbr':
        {
          return pushSelfClosing(target, props, type);
        }
      // These are reserved SVG and MathML elements, that are never custom elements.
      // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts

      case 'annotation-xml':
      case 'color-profile':
      case 'font-face':
      case 'font-face-src':
      case 'font-face-uri':
      case 'font-face-format':
      case 'font-face-name':
      case 'missing-glyph':
        {
          break;
        }
      // Preamble start tags

      case 'head':
        return pushStartHead(target, props, renderState, formatContext.insertionMode);

      case 'html':
        {
          return pushStartHtml(target, props, renderState, formatContext.insertionMode);
        }

      default:
        {
          if (type.indexOf('-') !== -1) {
            // Custom element
            return pushStartCustomElement(target, props, type);
          }
        }
    } // Generic element


    return pushStartGenericElement(target, props, type);
  }
  var endTagCache = new Map();

  function endChunkForTag(tag) {
    var chunk = endTagCache.get(tag);

    if (chunk === undefined) {
      chunk = stringToPrecomputedChunk('</' + tag + '>');
      endTagCache.set(tag, chunk);
    }

    return chunk;
  }

  function pushEndInstance(target, type, props, resumableState, formatContext) {
    switch (type) {
      // When float is on we expect title and script tags to always be pushed in
      // a unit and never return children. when we end up pushing the end tag we
      // want to ensure there is no extra closing tag pushed
      case 'title':
      case 'style':
      case 'script':
      // Omitted close tags
      // TODO: Instead of repeating this switch we could try to pass a flag from above.
      // That would require returning a tuple. Which might be ok if it gets inlined.

      case 'area':
      case 'base':
      case 'br':
      case 'col':
      case 'embed':
      case 'hr':
      case 'img':
      case 'input':
      case 'keygen':
      case 'link':
      case 'meta':
      case 'param':
      case 'source':
      case 'track':
      case 'wbr':
        {
          // No close tag needed.
          return;
        }
      // Postamble end tags
      // When float is enabled we omit the end tags for body and html when
      // they represent the Document.body and Document.documentElement Nodes.
      // This is so we can withhold them until the postamble when we know
      // we won't emit any more tags

      case 'body':
        {
          if (formatContext.insertionMode <= HTML_HTML_MODE) {
            resumableState.hasBody = true;
            return;
          }

          break;
        }

      case 'html':
        if (formatContext.insertionMode === ROOT_HTML_MODE) {
          resumableState.hasHtml = true;
          return;
        }

        break;
    }

    target.push(endChunkForTag(type));
  }

  function writeBootstrap(destination, renderState) {
    var bootstrapChunks = renderState.bootstrapChunks;
    var i = 0;

    for (; i < bootstrapChunks.length - 1; i++) {
      writeChunk(destination, bootstrapChunks[i]);
    }

    if (i < bootstrapChunks.length) {
      var lastChunk = bootstrapChunks[i];
      bootstrapChunks.length = 0;
      return writeChunkAndReturn(destination, lastChunk);
    }

    return true;
  }

  function writeCompletedRoot(destination, renderState) {
    return writeBootstrap(destination, renderState);
  } // Structural Nodes
  // A placeholder is a node inside a hidden partial tree that can be filled in later, but before
  // display. It's never visible to users. We use the template tag because it can be used in every
  // type of parent. <script> tags also work in every other tag except <colgroup>.

  var placeholder1 = stringToPrecomputedChunk('<template id="');
  var placeholder2 = stringToPrecomputedChunk('"></template>');
  function writePlaceholder(destination, renderState, id) {
    writeChunk(destination, placeholder1);
    writeChunk(destination, renderState.placeholderPrefix);
    var formattedID = stringToChunk(id.toString(16));
    writeChunk(destination, formattedID);
    return writeChunkAndReturn(destination, placeholder2);
  } // Suspense boundaries are encoded as comments.

  var startCompletedSuspenseBoundary = stringToPrecomputedChunk('<!--$-->');
  var startPendingSuspenseBoundary1 = stringToPrecomputedChunk('<!--$?--><template id="');
  var startPendingSuspenseBoundary2 = stringToPrecomputedChunk('"></template>');
  var startClientRenderedSuspenseBoundary = stringToPrecomputedChunk('<!--$!-->');
  var endSuspenseBoundary = stringToPrecomputedChunk('<!--/$-->');
  var clientRenderedSuspenseBoundaryError1 = stringToPrecomputedChunk('<template');
  var clientRenderedSuspenseBoundaryErrorAttrInterstitial = stringToPrecomputedChunk('"');
  var clientRenderedSuspenseBoundaryError1A = stringToPrecomputedChunk(' data-dgst="');
  var clientRenderedSuspenseBoundaryError1B = stringToPrecomputedChunk(' data-msg="');
  var clientRenderedSuspenseBoundaryError1C = stringToPrecomputedChunk(' data-stck="');
  var clientRenderedSuspenseBoundaryError2 = stringToPrecomputedChunk('></template>');
  function writeStartCompletedSuspenseBoundary(destination, renderState) {
    return writeChunkAndReturn(destination, startCompletedSuspenseBoundary);
  }
  function writeStartPendingSuspenseBoundary(destination, renderState, id) {
    writeChunk(destination, startPendingSuspenseBoundary1);

    if (id === null) {
      throw new Error('An ID must have been assigned before we can complete the boundary.');
    }

    writeChunk(destination, renderState.boundaryPrefix);
    writeChunk(destination, stringToChunk(id.toString(16)));
    return writeChunkAndReturn(destination, startPendingSuspenseBoundary2);
  }
  function writeStartClientRenderedSuspenseBoundary(destination, renderState, errorDigest, errorMesssage, errorComponentStack) {
    var result;
    result = writeChunkAndReturn(destination, startClientRenderedSuspenseBoundary);
    writeChunk(destination, clientRenderedSuspenseBoundaryError1);

    if (errorDigest) {
      writeChunk(destination, clientRenderedSuspenseBoundaryError1A);
      writeChunk(destination, stringToChunk(escapeTextForBrowser(errorDigest)));
      writeChunk(destination, clientRenderedSuspenseBoundaryErrorAttrInterstitial);
    }

    {
      if (errorMesssage) {
        writeChunk(destination, clientRenderedSuspenseBoundaryError1B);
        writeChunk(destination, stringToChunk(escapeTextForBrowser(errorMesssage)));
        writeChunk(destination, clientRenderedSuspenseBoundaryErrorAttrInterstitial);
      }

      if (errorComponentStack) {
        writeChunk(destination, clientRenderedSuspenseBoundaryError1C);
        writeChunk(destination, stringToChunk(escapeTextForBrowser(errorComponentStack)));
        writeChunk(destination, clientRenderedSuspenseBoundaryErrorAttrInterstitial);
      }
    }

    result = writeChunkAndReturn(destination, clientRenderedSuspenseBoundaryError2);
    return result;
  }
  function writeEndCompletedSuspenseBoundary(destination, renderState) {
    return writeChunkAndReturn(destination, endSuspenseBoundary);
  }
  function writeEndPendingSuspenseBoundary(destination, renderState) {
    return writeChunkAndReturn(destination, endSuspenseBoundary);
  }
  function writeEndClientRenderedSuspenseBoundary(destination, renderState) {
    return writeChunkAndReturn(destination, endSuspenseBoundary);
  }
  var startSegmentHTML = stringToPrecomputedChunk('<div hidden id="');
  var startSegmentHTML2 = stringToPrecomputedChunk('">');
  var endSegmentHTML = stringToPrecomputedChunk('</div>');
  var startSegmentSVG = stringToPrecomputedChunk('<svg aria-hidden="true" style="display:none" id="');
  var startSegmentSVG2 = stringToPrecomputedChunk('">');
  var endSegmentSVG = stringToPrecomputedChunk('</svg>');
  var startSegmentMathML = stringToPrecomputedChunk('<math aria-hidden="true" style="display:none" id="');
  var startSegmentMathML2 = stringToPrecomputedChunk('">');
  var endSegmentMathML = stringToPrecomputedChunk('</math>');
  var startSegmentTable = stringToPrecomputedChunk('<table hidden id="');
  var startSegmentTable2 = stringToPrecomputedChunk('">');
  var endSegmentTable = stringToPrecomputedChunk('</table>');
  var startSegmentTableBody = stringToPrecomputedChunk('<table hidden><tbody id="');
  var startSegmentTableBody2 = stringToPrecomputedChunk('">');
  var endSegmentTableBody = stringToPrecomputedChunk('</tbody></table>');
  var startSegmentTableRow = stringToPrecomputedChunk('<table hidden><tr id="');
  var startSegmentTableRow2 = stringToPrecomputedChunk('">');
  var endSegmentTableRow = stringToPrecomputedChunk('</tr></table>');
  var startSegmentColGroup = stringToPrecomputedChunk('<table hidden><colgroup id="');
  var startSegmentColGroup2 = stringToPrecomputedChunk('">');
  var endSegmentColGroup = stringToPrecomputedChunk('</colgroup></table>');
  function writeStartSegment(destination, renderState, formatContext, id) {
    switch (formatContext.insertionMode) {
      case ROOT_HTML_MODE:
      case HTML_HTML_MODE:
      case HTML_MODE:
        {
          writeChunk(destination, startSegmentHTML);
          writeChunk(destination, renderState.segmentPrefix);
          writeChunk(destination, stringToChunk(id.toString(16)));
          return writeChunkAndReturn(destination, startSegmentHTML2);
        }

      case SVG_MODE:
        {
          writeChunk(destination, startSegmentSVG);
          writeChunk(destination, renderState.segmentPrefix);
          writeChunk(destination, stringToChunk(id.toString(16)));
          return writeChunkAndReturn(destination, startSegmentSVG2);
        }

      case MATHML_MODE:
        {
          writeChunk(destination, startSegmentMathML);
          writeChunk(destination, renderState.segmentPrefix);
          writeChunk(destination, stringToChunk(id.toString(16)));
          return writeChunkAndReturn(destination, startSegmentMathML2);
        }

      case HTML_TABLE_MODE:
        {
          writeChunk(destination, startSegmentTable);
          writeChunk(destination, renderState.segmentPrefix);
          writeChunk(destination, stringToChunk(id.toString(16)));
          return writeChunkAndReturn(destination, startSegmentTable2);
        }
      // TODO: For the rest of these, there will be extra wrapper nodes that never
      // get deleted from the document. We need to delete the table too as part
      // of the injected scripts. They are invisible though so it's not too terrible
      // and it's kind of an edge case to suspend in a table. Totally supported though.

      case HTML_TABLE_BODY_MODE:
        {
          writeChunk(destination, startSegmentTableBody);
          writeChunk(destination, renderState.segmentPrefix);
          writeChunk(destination, stringToChunk(id.toString(16)));
          return writeChunkAndReturn(destination, startSegmentTableBody2);
        }

      case HTML_TABLE_ROW_MODE:
        {
          writeChunk(destination, startSegmentTableRow);
          writeChunk(destination, renderState.segmentPrefix);
          writeChunk(destination, stringToChunk(id.toString(16)));
          return writeChunkAndReturn(destination, startSegmentTableRow2);
        }

      case HTML_COLGROUP_MODE:
        {
          writeChunk(destination, startSegmentColGroup);
          writeChunk(destination, renderState.segmentPrefix);
          writeChunk(destination, stringToChunk(id.toString(16)));
          return writeChunkAndReturn(destination, startSegmentColGroup2);
        }

      default:
        {
          throw new Error('Unknown insertion mode. This is a bug in React.');
        }
    }
  }
  function writeEndSegment(destination, formatContext) {
    switch (formatContext.insertionMode) {
      case ROOT_HTML_MODE:
      case HTML_HTML_MODE:
      case HTML_MODE:
        {
          return writeChunkAndReturn(destination, endSegmentHTML);
        }

      case SVG_MODE:
        {
          return writeChunkAndReturn(destination, endSegmentSVG);
        }

      case MATHML_MODE:
        {
          return writeChunkAndReturn(destination, endSegmentMathML);
        }

      case HTML_TABLE_MODE:
        {
          return writeChunkAndReturn(destination, endSegmentTable);
        }

      case HTML_TABLE_BODY_MODE:
        {
          return writeChunkAndReturn(destination, endSegmentTableBody);
        }

      case HTML_TABLE_ROW_MODE:
        {
          return writeChunkAndReturn(destination, endSegmentTableRow);
        }

      case HTML_COLGROUP_MODE:
        {
          return writeChunkAndReturn(destination, endSegmentColGroup);
        }

      default:
        {
          throw new Error('Unknown insertion mode. This is a bug in React.');
        }
    }
  }
  var completeSegmentScript1Full = stringToPrecomputedChunk(completeSegment + '$RS("');
  var completeSegmentScript1Partial = stringToPrecomputedChunk('$RS("');
  var completeSegmentScript2 = stringToPrecomputedChunk('","');
  var completeSegmentScriptEnd = stringToPrecomputedChunk('")</script>');
  var completeSegmentData1 = stringToPrecomputedChunk('<template data-rsi="" data-sid="');
  var completeSegmentData2 = stringToPrecomputedChunk('" data-pid="');
  var completeSegmentDataEnd = dataElementQuotedEnd;
  function writeCompletedSegmentInstruction(destination, resumableState, renderState, contentSegmentID) {
    var scriptFormat = resumableState.streamingFormat === ScriptStreamingFormat;

    if (scriptFormat) {
      writeChunk(destination, renderState.startInlineScript);

      if ((resumableState.instructions & SentCompleteSegmentFunction) === NothingSent) {
        // The first time we write this, we'll need to include the full implementation.
        resumableState.instructions |= SentCompleteSegmentFunction;
        writeChunk(destination, completeSegmentScript1Full);
      } else {
        // Future calls can just reuse the same function.
        writeChunk(destination, completeSegmentScript1Partial);
      }
    } else {
      writeChunk(destination, completeSegmentData1);
    } // Write function arguments, which are string literals


    writeChunk(destination, renderState.segmentPrefix);
    var formattedID = stringToChunk(contentSegmentID.toString(16));
    writeChunk(destination, formattedID);

    if (scriptFormat) {
      writeChunk(destination, completeSegmentScript2);
    } else {
      writeChunk(destination, completeSegmentData2);
    }

    writeChunk(destination, renderState.placeholderPrefix);
    writeChunk(destination, formattedID);

    if (scriptFormat) {
      return writeChunkAndReturn(destination, completeSegmentScriptEnd);
    } else {
      return writeChunkAndReturn(destination, completeSegmentDataEnd);
    }
  }
  var completeBoundaryScript1Full = stringToPrecomputedChunk(completeBoundary + '$RC("');
  var completeBoundaryScript1Partial = stringToPrecomputedChunk('$RC("');
  var completeBoundaryWithStylesScript1FullBoth = stringToPrecomputedChunk(completeBoundary + completeBoundaryWithStyles + '$RR("');
  var completeBoundaryWithStylesScript1FullPartial = stringToPrecomputedChunk(completeBoundaryWithStyles + '$RR("');
  var completeBoundaryWithStylesScript1Partial = stringToPrecomputedChunk('$RR("');
  var completeBoundaryScript2 = stringToPrecomputedChunk('","');
  var completeBoundaryScript3a = stringToPrecomputedChunk('",');
  var completeBoundaryScript3b = stringToPrecomputedChunk('"');
  var completeBoundaryScriptEnd = stringToPrecomputedChunk(')</script>');
  var completeBoundaryData1 = stringToPrecomputedChunk('<template data-rci="" data-bid="');
  var completeBoundaryWithStylesData1 = stringToPrecomputedChunk('<template data-rri="" data-bid="');
  var completeBoundaryData2 = stringToPrecomputedChunk('" data-sid="');
  var completeBoundaryData3a = stringToPrecomputedChunk('" data-sty="');
  var completeBoundaryDataEnd = dataElementQuotedEnd;
  function writeCompletedBoundaryInstruction(destination, resumableState, renderState, id, hoistableState) {
    var requiresStyleInsertion;

    {
      requiresStyleInsertion = renderState.stylesToHoist; // If necessary stylesheets will be flushed with this instruction.
      // Any style tags not yet hoisted in the Document will also be hoisted.
      // We reset this state since after this instruction executes all styles
      // up to this point will have been hoisted

      renderState.stylesToHoist = false;
    }

    var scriptFormat = resumableState.streamingFormat === ScriptStreamingFormat;

    if (scriptFormat) {
      writeChunk(destination, renderState.startInlineScript);

      if (requiresStyleInsertion) {
        if ((resumableState.instructions & SentCompleteBoundaryFunction) === NothingSent) {
          resumableState.instructions |= SentStyleInsertionFunction | SentCompleteBoundaryFunction;
          writeChunk(destination, clonePrecomputedChunk(completeBoundaryWithStylesScript1FullBoth));
        } else if ((resumableState.instructions & SentStyleInsertionFunction) === NothingSent) {
          resumableState.instructions |= SentStyleInsertionFunction;
          writeChunk(destination, completeBoundaryWithStylesScript1FullPartial);
        } else {
          writeChunk(destination, completeBoundaryWithStylesScript1Partial);
        }
      } else {
        if ((resumableState.instructions & SentCompleteBoundaryFunction) === NothingSent) {
          resumableState.instructions |= SentCompleteBoundaryFunction;
          writeChunk(destination, completeBoundaryScript1Full);
        } else {
          writeChunk(destination, completeBoundaryScript1Partial);
        }
      }
    } else {
      if (requiresStyleInsertion) {
        writeChunk(destination, completeBoundaryWithStylesData1);
      } else {
        writeChunk(destination, completeBoundaryData1);
      }
    }

    var idChunk = stringToChunk(id.toString(16));
    writeChunk(destination, renderState.boundaryPrefix);
    writeChunk(destination, idChunk); // Write function arguments, which are string and array literals

    if (scriptFormat) {
      writeChunk(destination, completeBoundaryScript2);
    } else {
      writeChunk(destination, completeBoundaryData2);
    }

    writeChunk(destination, renderState.segmentPrefix);
    writeChunk(destination, idChunk);

    if (requiresStyleInsertion) {
      // Script and data writers must format this differently:
      //  - script writer emits an array literal, whose string elements are
      //    escaped for javascript  e.g. ["A", "B"]
      //  - data writer emits a string literal, which is escaped as html
      //    e.g. [&#34;A&#34;, &#34;B&#34;]
      if (scriptFormat) {
        writeChunk(destination, completeBoundaryScript3a); // hoistableState encodes an array literal

        writeStyleResourceDependenciesInJS(destination, hoistableState);
      } else {
        writeChunk(destination, completeBoundaryData3a);
        writeStyleResourceDependenciesInAttr(destination, hoistableState);
      }
    } else {
      if (scriptFormat) {
        writeChunk(destination, completeBoundaryScript3b);
      }
    }

    var writeMore;

    if (scriptFormat) {
      writeMore = writeChunkAndReturn(destination, completeBoundaryScriptEnd);
    } else {
      writeMore = writeChunkAndReturn(destination, completeBoundaryDataEnd);
    }

    return writeBootstrap(destination, renderState) && writeMore;
  }
  var clientRenderScript1Full = stringToPrecomputedChunk(clientRenderBoundary + ';$RX("');
  var clientRenderScript1Partial = stringToPrecomputedChunk('$RX("');
  var clientRenderScript1A = stringToPrecomputedChunk('"');
  var clientRenderErrorScriptArgInterstitial = stringToPrecomputedChunk(',');
  var clientRenderScriptEnd = stringToPrecomputedChunk(')</script>');
  var clientRenderData1 = stringToPrecomputedChunk('<template data-rxi="" data-bid="');
  var clientRenderData2 = stringToPrecomputedChunk('" data-dgst="');
  var clientRenderData3 = stringToPrecomputedChunk('" data-msg="');
  var clientRenderData4 = stringToPrecomputedChunk('" data-stck="');
  var clientRenderDataEnd = dataElementQuotedEnd;
  function writeClientRenderBoundaryInstruction(destination, resumableState, renderState, id, errorDigest, errorMessage, errorComponentStack) {
    var scriptFormat = resumableState.streamingFormat === ScriptStreamingFormat;

    if (scriptFormat) {
      writeChunk(destination, renderState.startInlineScript);

      if ((resumableState.instructions & SentClientRenderFunction) === NothingSent) {
        // The first time we write this, we'll need to include the full implementation.
        resumableState.instructions |= SentClientRenderFunction;
        writeChunk(destination, clientRenderScript1Full);
      } else {
        // Future calls can just reuse the same function.
        writeChunk(destination, clientRenderScript1Partial);
      }
    } else {
      // <template data-rxi="" data-bid="
      writeChunk(destination, clientRenderData1);
    }

    writeChunk(destination, renderState.boundaryPrefix);
    writeChunk(destination, stringToChunk(id.toString(16)));

    if (scriptFormat) {
      // " needs to be inserted for scripts, since ArgInterstitual does not contain
      // leading or trailing quotes
      writeChunk(destination, clientRenderScript1A);
    }

    if (errorDigest || errorMessage || errorComponentStack) {
      if (scriptFormat) {
        // ,"JSONString"
        writeChunk(destination, clientRenderErrorScriptArgInterstitial);
        writeChunk(destination, stringToChunk(escapeJSStringsForInstructionScripts(errorDigest || '')));
      } else {
        // " data-dgst="HTMLString
        writeChunk(destination, clientRenderData2);
        writeChunk(destination, stringToChunk(escapeTextForBrowser(errorDigest || '')));
      }
    }

    if (errorMessage || errorComponentStack) {
      if (scriptFormat) {
        // ,"JSONString"
        writeChunk(destination, clientRenderErrorScriptArgInterstitial);
        writeChunk(destination, stringToChunk(escapeJSStringsForInstructionScripts(errorMessage || '')));
      } else {
        // " data-msg="HTMLString
        writeChunk(destination, clientRenderData3);
        writeChunk(destination, stringToChunk(escapeTextForBrowser(errorMessage || '')));
      }
    }

    if (errorComponentStack) {
      // ,"JSONString"
      if (scriptFormat) {
        writeChunk(destination, clientRenderErrorScriptArgInterstitial);
        writeChunk(destination, stringToChunk(escapeJSStringsForInstructionScripts(errorComponentStack)));
      } else {
        // " data-stck="HTMLString
        writeChunk(destination, clientRenderData4);
        writeChunk(destination, stringToChunk(escapeTextForBrowser(errorComponentStack)));
      }
    }

    if (scriptFormat) {
      // ></script>
      return writeChunkAndReturn(destination, clientRenderScriptEnd);
    } else {
      // "></template>
      return writeChunkAndReturn(destination, clientRenderDataEnd);
    }
  }
  var regexForJSStringsInInstructionScripts = /[<\u2028\u2029]/g;

  function escapeJSStringsForInstructionScripts(input) {
    var escaped = JSON.stringify(input);
    return escaped.replace(regexForJSStringsInInstructionScripts, function (match) {
      switch (match) {
        // santizing breaking out of strings and script tags
        case '<':
          return "\\u003c";

        case "\u2028":
          return "\\u2028";

        case "\u2029":
          return "\\u2029";

        default:
          {
            // eslint-disable-next-line react-internal/prod-error-codes
            throw new Error('escapeJSStringsForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React');
          }
      }
    });
  }

  var regexForJSStringsInScripts = /[&><\u2028\u2029]/g;

  function escapeJSObjectForInstructionScripts(input) {
    var escaped = JSON.stringify(input);
    return escaped.replace(regexForJSStringsInScripts, function (match) {
      switch (match) {
        // santizing breaking out of strings and script tags
        case '&':
          return "\\u0026";

        case '>':
          return "\\u003e";

        case '<':
          return "\\u003c";

        case "\u2028":
          return "\\u2028";

        case "\u2029":
          return "\\u2029";

        default:
          {
            // eslint-disable-next-line react-internal/prod-error-codes
            throw new Error('escapeJSObjectForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React');
          }
      }
    });
  }

  var lateStyleTagResourceOpen1 = stringToPrecomputedChunk('<style media="not all" data-precedence="');
  var lateStyleTagResourceOpen2 = stringToPrecomputedChunk('" data-href="');
  var lateStyleTagResourceOpen3 = stringToPrecomputedChunk('">');
  var lateStyleTagTemplateClose = stringToPrecomputedChunk('</style>'); // Tracks whether the boundary currently flushing is flushign style tags or has any
  // stylesheet dependencies not flushed in the Preamble.

  var currentlyRenderingBoundaryHasStylesToHoist = false; // Acts as a return value for the forEach execution of style tag flushing.

  var destinationHasCapacity = true;

  function flushStyleTagsLateForBoundary(styleQueue) {
    var rules = styleQueue.rules;
    var hrefs = styleQueue.hrefs;

    {
      if (rules.length > 0 && hrefs.length === 0) {
        error('React expected to have at least one href for an a hoistable style but found none. This is a bug in React.');
      }
    }

    var i = 0;

    if (hrefs.length) {
      writeChunk(this, lateStyleTagResourceOpen1);
      writeChunk(this, styleQueue.precedence);
      writeChunk(this, lateStyleTagResourceOpen2);

      for (; i < hrefs.length - 1; i++) {
        writeChunk(this, hrefs[i]);
        writeChunk(this, spaceSeparator);
      }

      writeChunk(this, hrefs[i]);
      writeChunk(this, lateStyleTagResourceOpen3);

      for (i = 0; i < rules.length; i++) {
        writeChunk(this, rules[i]);
      }

      destinationHasCapacity = writeChunkAndReturn(this, lateStyleTagTemplateClose); // We wrote style tags for this boundary and we may need to emit a script
      // to hoist them.

      currentlyRenderingBoundaryHasStylesToHoist = true; // style resources can flush continuously since more rules may be written into
      // them with new hrefs. Instead of marking it flushed, we simply reset the chunks
      // and hrefs

      rules.length = 0;
      hrefs.length = 0;
    }
  }

  function hasStylesToHoist(stylesheet) {
    // We need to reveal boundaries with styles whenever a stylesheet it depends on is either
    // not flushed or flushed after the preamble (shell).
    if (stylesheet.state !== PREAMBLE) {
      currentlyRenderingBoundaryHasStylesToHoist = true;
      return true;
    }

    return false;
  }

  function writeHoistablesForBoundary(destination, hoistableState, renderState) {
    // Reset these on each invocation, they are only safe to read in this function
    currentlyRenderingBoundaryHasStylesToHoist = false;
    destinationHasCapacity = true; // Flush style tags for each precedence this boundary depends on

    hoistableState.styles.forEach(flushStyleTagsLateForBoundary, destination); // Determine if this boundary has stylesheets that need to be awaited upon completion

    hoistableState.stylesheets.forEach(hasStylesToHoist); // We don't actually want to flush any hoistables until the boundary is complete so we omit
    // any further writing here. This is becuase unlike Resources, Hoistable Elements act more like
    // regular elements, each rendered element has a unique representation in the DOM. We don't want
    // these elements to appear in the DOM early, before the boundary has actually completed

    if (currentlyRenderingBoundaryHasStylesToHoist) {
      renderState.stylesToHoist = true;
    }

    return destinationHasCapacity;
  }

  function flushResource(resource) {
    for (var i = 0; i < resource.length; i++) {
      writeChunk(this, resource[i]);
    }

    resource.length = 0;
  }

  var stylesheetFlushingQueue = [];

  function flushStyleInPreamble(stylesheet, key, map) {
    // We still need to encode stylesheet chunks
    // because unlike most Hoistables and Resources we do not eagerly encode
    // them during render. This is because if we flush late we have to send a
    // different encoding and we don't want to encode multiple times
    pushLinkImpl(stylesheetFlushingQueue, stylesheet.props);

    for (var i = 0; i < stylesheetFlushingQueue.length; i++) {
      writeChunk(this, stylesheetFlushingQueue[i]);
    }

    stylesheetFlushingQueue.length = 0;
    stylesheet.state = PREAMBLE;
  }

  var styleTagResourceOpen1 = stringToPrecomputedChunk('<style data-precedence="');
  var styleTagResourceOpen2 = stringToPrecomputedChunk('" data-href="');
  var spaceSeparator = stringToPrecomputedChunk(' ');
  var styleTagResourceOpen3 = stringToPrecomputedChunk('">');
  var styleTagResourceClose = stringToPrecomputedChunk('</style>');

  function flushStylesInPreamble(styleQueue, precedence) {
    var hasStylesheets = styleQueue.sheets.size > 0;
    styleQueue.sheets.forEach(flushStyleInPreamble, this);
    styleQueue.sheets.clear();
    var rules = styleQueue.rules;
    var hrefs = styleQueue.hrefs; // If we don't emit any stylesheets at this precedence we still need to maintain the precedence
    // order so even if there are no rules for style tags at this precedence we emit an empty style
    // tag with the data-precedence attribute

    if (!hasStylesheets || hrefs.length) {
      writeChunk(this, styleTagResourceOpen1);
      writeChunk(this, styleQueue.precedence);
      var i = 0;

      if (hrefs.length) {
        writeChunk(this, styleTagResourceOpen2);

        for (; i < hrefs.length - 1; i++) {
          writeChunk(this, hrefs[i]);
          writeChunk(this, spaceSeparator);
        }

        writeChunk(this, hrefs[i]);
      }

      writeChunk(this, styleTagResourceOpen3);

      for (i = 0; i < rules.length; i++) {
        writeChunk(this, rules[i]);
      }

      writeChunk(this, styleTagResourceClose); // style resources can flush continuously since more rules may be written into
      // them with new hrefs. Instead of marking it flushed, we simply reset the chunks
      // and hrefs

      rules.length = 0;
      hrefs.length = 0;
    }
  }

  function preloadLateStyle(stylesheet) {
    if (stylesheet.state === PENDING$1) {
      stylesheet.state = PRELOADED;
      var preloadProps = preloadAsStylePropsFromProps(stylesheet.props.href, stylesheet.props);
      pushLinkImpl(stylesheetFlushingQueue, preloadProps);

      for (var i = 0; i < stylesheetFlushingQueue.length; i++) {
        writeChunk(this, stylesheetFlushingQueue[i]);
      }

      stylesheetFlushingQueue.length = 0;
    }
  }

  function preloadLateStyles(styleQueue) {
    styleQueue.sheets.forEach(preloadLateStyle, this);
    styleQueue.sheets.clear();
  } // We don't bother reporting backpressure at the moment because we expect to
  // flush the entire preamble in a single pass. This probably should be modified
  // in the future to be backpressure sensitive but that requires a larger refactor
  // of the flushing code in Fizz.


  function writePreamble(destination, resumableState, renderState, willFlushAllSegments) {
    // This function must be called exactly once on every request
    if (!willFlushAllSegments && renderState.externalRuntimeScript) {
      // If the root segment is incomplete due to suspended tasks
      // (e.g. willFlushAllSegments = false) and we are using data
      // streaming format, ensure the external runtime is sent.
      // (User code could choose to send this even earlier by calling
      //  preinit(...), if they know they will suspend).
      var _renderState$external = renderState.externalRuntimeScript,
          src = _renderState$external.src,
          chunks = _renderState$external.chunks;
      internalPreinitScript(resumableState, renderState, src, chunks);
    }

    var htmlChunks = renderState.htmlChunks;
    var headChunks = renderState.headChunks;
    var i = 0; // Emit open tags before Hoistables and Resources

    if (htmlChunks) {
      // We have an <html> to emit as part of the preamble
      for (i = 0; i < htmlChunks.length; i++) {
        writeChunk(destination, htmlChunks[i]);
      }

      if (headChunks) {
        for (i = 0; i < headChunks.length; i++) {
          writeChunk(destination, headChunks[i]);
        }
      } else {
        // We did not render a head but we emitted an <html> so we emit one now
        writeChunk(destination, startChunkForTag('head'));
        writeChunk(destination, endOfStartTag);
      }
    } else if (headChunks) {
      // We do not have an <html> but we do have a <head>
      for (i = 0; i < headChunks.length; i++) {
        writeChunk(destination, headChunks[i]);
      }
    } // Emit high priority Hoistables


    var charsetChunks = renderState.charsetChunks;

    for (i = 0; i < charsetChunks.length; i++) {
      writeChunk(destination, charsetChunks[i]);
    }

    charsetChunks.length = 0; // emit preconnect resources

    renderState.preconnects.forEach(flushResource, destination);
    renderState.preconnects.clear();
    var viewportChunks = renderState.viewportChunks;

    for (i = 0; i < viewportChunks.length; i++) {
      writeChunk(destination, viewportChunks[i]);
    }

    viewportChunks.length = 0;
    renderState.fontPreloads.forEach(flushResource, destination);
    renderState.fontPreloads.clear();
    renderState.highImagePreloads.forEach(flushResource, destination);
    renderState.highImagePreloads.clear(); // Flush unblocked stylesheets by precedence

    renderState.styles.forEach(flushStylesInPreamble, destination);
    var importMapChunks = renderState.importMapChunks;

    for (i = 0; i < importMapChunks.length; i++) {
      writeChunk(destination, importMapChunks[i]);
    }

    importMapChunks.length = 0;
    renderState.bootstrapScripts.forEach(flushResource, destination);
    renderState.scripts.forEach(flushResource, destination);
    renderState.scripts.clear();
    renderState.bulkPreloads.forEach(flushResource, destination);
    renderState.bulkPreloads.clear(); // Write embedding hoistableChunks

    var hoistableChunks = renderState.hoistableChunks;

    for (i = 0; i < hoistableChunks.length; i++) {
      writeChunk(destination, hoistableChunks[i]);
    }

    hoistableChunks.length = 0;

    if (htmlChunks && headChunks === null) {
      // we have an <html> but we inserted an implicit <head> tag. We need
      // to close it since the main content won't have it
      writeChunk(destination, endChunkForTag('head'));
    }
  } // We don't bother reporting backpressure at the moment because we expect to
  // flush the entire preamble in a single pass. This probably should be modified
  // in the future to be backpressure sensitive but that requires a larger refactor
  // of the flushing code in Fizz.

  function writeHoistables(destination, resumableState, renderState) {
    var i = 0; // Emit high priority Hoistables
    // We omit charsetChunks because we have already sent the shell and if it wasn't
    // already sent it is too late now.

    var viewportChunks = renderState.viewportChunks;

    for (i = 0; i < viewportChunks.length; i++) {
      writeChunk(destination, viewportChunks[i]);
    }

    viewportChunks.length = 0;
    renderState.preconnects.forEach(flushResource, destination);
    renderState.preconnects.clear();
    renderState.fontPreloads.forEach(flushResource, destination);
    renderState.fontPreloads.clear();
    renderState.highImagePreloads.forEach(flushResource, destination);
    renderState.highImagePreloads.clear(); // Preload any stylesheets. these will emit in a render instruction that follows this
    // but we want to kick off preloading as soon as possible

    renderState.styles.forEach(preloadLateStyles, destination); // We only hoist importmaps that are configured through createResponse and that will
    // always flush in the preamble. Generally we don't expect people to render them as
    // tags when using React but if you do they are going to be treated like regular inline
    // scripts and flush after other hoistables which is problematic
    // bootstrap scripts should flush above script priority but these can only flush in the preamble
    // so we elide the code here for performance

    renderState.scripts.forEach(flushResource, destination);
    renderState.scripts.clear();
    renderState.bulkPreloads.forEach(flushResource, destination);
    renderState.bulkPreloads.clear(); // Write embedding hoistableChunks

    var hoistableChunks = renderState.hoistableChunks;

    for (i = 0; i < hoistableChunks.length; i++) {
      writeChunk(destination, hoistableChunks[i]);
    }

    hoistableChunks.length = 0;
  }
  function writePostamble(destination, resumableState) {
    if (resumableState.hasBody) {
      writeChunk(destination, endChunkForTag('body'));
    }

    if (resumableState.hasHtml) {
      writeChunk(destination, endChunkForTag('html'));
    }
  }
  var arrayFirstOpenBracket = stringToPrecomputedChunk('[');
  var arraySubsequentOpenBracket = stringToPrecomputedChunk(',[');
  var arrayInterstitial = stringToPrecomputedChunk(',');
  var arrayCloseBracket = stringToPrecomputedChunk(']'); // This function writes a 2D array of strings to be embedded in javascript.
  // E.g.
  //  [["JS_escaped_string1", "JS_escaped_string2"]]

  function writeStyleResourceDependenciesInJS(destination, hoistableState) {
    writeChunk(destination, arrayFirstOpenBracket);
    var nextArrayOpenBrackChunk = arrayFirstOpenBracket;
    hoistableState.stylesheets.forEach(function (resource) {
      if (resource.state === PREAMBLE) ; else if (resource.state === LATE) {
        // We only need to emit the href because this resource flushed in an earlier
        // boundary already which encoded the attributes necessary to construct
        // the resource instance on the client.
        writeChunk(destination, nextArrayOpenBrackChunk);
        writeStyleResourceDependencyHrefOnlyInJS(destination, resource.props.href);
        writeChunk(destination, arrayCloseBracket);
        nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
      } else {
        // We need to emit the whole resource for insertion on the client
        writeChunk(destination, nextArrayOpenBrackChunk);
        writeStyleResourceDependencyInJS(destination, resource.props.href, resource.props['data-precedence'], resource.props);
        writeChunk(destination, arrayCloseBracket);
        nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
        resource.state = LATE;
      }
    });
    writeChunk(destination, arrayCloseBracket);
  }
  /* Helper functions */


  function writeStyleResourceDependencyHrefOnlyInJS(destination, href) {
    // We should actually enforce this earlier when the resource is created but for
    // now we make sure we are actually dealing with a string here.
    {
      checkAttributeStringCoercion(href, 'href');
    }

    var coercedHref = '' + href;
    writeChunk(destination, stringToChunk(escapeJSObjectForInstructionScripts(coercedHref)));
  }

  function writeStyleResourceDependencyInJS(destination, href, precedence, props) {
    // eslint-disable-next-line react-internal/safe-string-coercion
    var coercedHref = sanitizeURL('' + href);
    writeChunk(destination, stringToChunk(escapeJSObjectForInstructionScripts(coercedHref)));

    {
      checkAttributeStringCoercion(precedence, 'precedence');
    }

    var coercedPrecedence = '' + precedence;
    writeChunk(destination, arrayInterstitial);
    writeChunk(destination, stringToChunk(escapeJSObjectForInstructionScripts(coercedPrecedence)));

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'href':
          case 'rel':
          case 'precedence':
          case 'data-precedence':
            {
              break;
            }

          case 'children':
          case 'dangerouslySetInnerHTML':
            throw new Error('link' + " is a self-closing tag and must neither have `children` nor " + 'use `dangerouslySetInnerHTML`.');

          default:
            writeStyleResourceAttributeInJS(destination, propKey, propValue);
            break;
        }
      }
    }

    return null;
  }

  function writeStyleResourceAttributeInJS(destination, name, value) // not null or undefined
  {
    var attributeName = name.toLowerCase();
    var attributeValue;

    switch (typeof value) {
      case 'function':
      case 'symbol':
        return;
    }

    switch (name) {
      // Reserved names
      case 'innerHTML':
      case 'dangerouslySetInnerHTML':
      case 'suppressContentEditableWarning':
      case 'suppressHydrationWarning':
      case 'style':
      case 'ref':
        // Ignored
        return;
      // Attribute renames

      case 'className':
        {
          attributeName = 'class';

          {
            checkAttributeStringCoercion(value, attributeName);
          }

          attributeValue = '' + value;
          break;
        }
      // Booleans

      case 'hidden':
        {
          if (value === false) {
            return;
          }

          {
            // overloaded Boolean
            {
              checkAttributeStringCoercion(value, attributeName);
            }

            attributeValue = '' + value;
          }

          break;
        }
      // Santized URLs

      case 'src':
      case 'href':
        {
          value = sanitizeURL(value);

          {
            checkAttributeStringCoercion(value, attributeName);
          }

          attributeValue = '' + value;
          break;
        }

      default:
        {
          if ( // unrecognized event handlers are not SSR'd and we (apparently)
          // use on* as hueristic for these handler props
          name.length > 2 && (name[0] === 'o' || name[0] === 'O') && (name[1] === 'n' || name[1] === 'N')) {
            return;
          }

          if (!isAttributeNameSafe(name)) {
            return;
          }

          {
            checkAttributeStringCoercion(value, attributeName);
          }

          attributeValue = '' + value;
        }
    }

    writeChunk(destination, arrayInterstitial);
    writeChunk(destination, stringToChunk(escapeJSObjectForInstructionScripts(attributeName)));
    writeChunk(destination, arrayInterstitial);
    writeChunk(destination, stringToChunk(escapeJSObjectForInstructionScripts(attributeValue)));
  } // This function writes a 2D array of strings to be embedded in an attribute
  // value and read with JSON.parse in ReactDOMServerExternalRuntime.js
  // E.g.
  //  [[&quot;JSON_escaped_string1&quot;, &quot;JSON_escaped_string2&quot;]]


  function writeStyleResourceDependenciesInAttr(destination, hoistableState) {
    writeChunk(destination, arrayFirstOpenBracket);
    var nextArrayOpenBrackChunk = arrayFirstOpenBracket;
    hoistableState.stylesheets.forEach(function (resource) {
      if (resource.state === PREAMBLE) ; else if (resource.state === LATE) {
        // We only need to emit the href because this resource flushed in an earlier
        // boundary already which encoded the attributes necessary to construct
        // the resource instance on the client.
        writeChunk(destination, nextArrayOpenBrackChunk);
        writeStyleResourceDependencyHrefOnlyInAttr(destination, resource.props.href);
        writeChunk(destination, arrayCloseBracket);
        nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
      } else {
        // We need to emit the whole resource for insertion on the client
        writeChunk(destination, nextArrayOpenBrackChunk);
        writeStyleResourceDependencyInAttr(destination, resource.props.href, resource.props['data-precedence'], resource.props);
        writeChunk(destination, arrayCloseBracket);
        nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
        resource.state = LATE;
      }
    });
    writeChunk(destination, arrayCloseBracket);
  }
  /* Helper functions */


  function writeStyleResourceDependencyHrefOnlyInAttr(destination, href) {
    // We should actually enforce this earlier when the resource is created but for
    // now we make sure we are actually dealing with a string here.
    {
      checkAttributeStringCoercion(href, 'href');
    }

    var coercedHref = '' + href;
    writeChunk(destination, stringToChunk(escapeTextForBrowser(JSON.stringify(coercedHref))));
  }

  function writeStyleResourceDependencyInAttr(destination, href, precedence, props) {
    // eslint-disable-next-line react-internal/safe-string-coercion
    var coercedHref = sanitizeURL('' + href);
    writeChunk(destination, stringToChunk(escapeTextForBrowser(JSON.stringify(coercedHref))));

    {
      checkAttributeStringCoercion(precedence, 'precedence');
    }

    var coercedPrecedence = '' + precedence;
    writeChunk(destination, arrayInterstitial);
    writeChunk(destination, stringToChunk(escapeTextForBrowser(JSON.stringify(coercedPrecedence))));

    for (var propKey in props) {
      if (hasOwnProperty.call(props, propKey)) {
        var propValue = props[propKey];

        if (propValue == null) {
          continue;
        }

        switch (propKey) {
          case 'href':
          case 'rel':
          case 'precedence':
          case 'data-precedence':
            {
              break;
            }

          case 'children':
          case 'dangerouslySetInnerHTML':
            throw new Error('link' + " is a self-closing tag and must neither have `children` nor " + 'use `dangerouslySetInnerHTML`.');

          default:
            writeStyleResourceAttributeInAttr(destination, propKey, propValue);
            break;
        }
      }
    }

    return null;
  }

  function writeStyleResourceAttributeInAttr(destination, name, value) // not null or undefined
  {
    var attributeName = name.toLowerCase();
    var attributeValue;

    switch (typeof value) {
      case 'function':
      case 'symbol':
        return;
    }

    switch (name) {
      // Reserved names
      case 'innerHTML':
      case 'dangerouslySetInnerHTML':
      case 'suppressContentEditableWarning':
      case 'suppressHydrationWarning':
      case 'style':
      case 'ref':
        // Ignored
        return;
      // Attribute renames

      case 'className':
        {
          attributeName = 'class';

          {
            checkAttributeStringCoercion(value, attributeName);
          }

          attributeValue = '' + value;
          break;
        }
      // Booleans

      case 'hidden':
        {
          if (value === false) {
            return;
          }

          {
            // overloaded Boolean
            {
              checkAttributeStringCoercion(value, attributeName);
            }

            attributeValue = '' + value;
          }

          break;
        }
      // Santized URLs

      case 'src':
      case 'href':
        {
          value = sanitizeURL(value);

          {
            checkAttributeStringCoercion(value, attributeName);
          }

          attributeValue = '' + value;
          break;
        }

      default:
        {
          if ( // unrecognized event handlers are not SSR'd and we (apparently)
          // use on* as hueristic for these handler props
          name.length > 2 && (name[0] === 'o' || name[0] === 'O') && (name[1] === 'n' || name[1] === 'N')) {
            return;
          }

          if (!isAttributeNameSafe(name)) {
            return;
          }

          {
            checkAttributeStringCoercion(value, attributeName);
          }

          attributeValue = '' + value;
        }
    }

    writeChunk(destination, arrayInterstitial);
    writeChunk(destination, stringToChunk(escapeTextForBrowser(JSON.stringify(attributeName))));
    writeChunk(destination, arrayInterstitial);
    writeChunk(destination, stringToChunk(escapeTextForBrowser(JSON.stringify(attributeValue))));
  }
  /**
   * Resources
   */


  var PENDING$1 = 0;
  var PRELOADED = 1;
  var PREAMBLE = 2;
  var LATE = 3;
  function createHoistableState() {
    return {
      styles: new Set(),
      stylesheets: new Set()
    };
  }

  function getResourceKey(href) {
    return href;
  }

  function getImageResourceKey(href, imageSrcSet, imageSizes) {
    if (imageSrcSet) {
      return imageSrcSet + '\n' + (imageSizes || '');
    }

    return href;
  }

  function prefetchDNS(href) {

    var request = resolveRequest();

    if (!request) {
      // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
      // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
      // the resources for this call in either case we opt to do nothing. We can consider making this a warning
      // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
      // fetching) and we don't want to warn in those cases.
      return;
    }

    var resumableState = getResumableState(request);
    var renderState = getRenderState(request);

    if (typeof href === 'string' && href) {
      var key = getResourceKey(href);

      if (!resumableState.dnsResources.hasOwnProperty(key)) {
        resumableState.dnsResources[key] = EXISTS;
        var headers = renderState.headers;
        var header;

        if (headers && headers.remainingCapacity > 0 && ( // Compute the header since we might be able to fit it in the max length
        header = getPrefetchDNSAsHeader(href), // We always consume the header length since once we find one header that doesn't fit
        // we assume all the rest won't as well. This is to avoid getting into a situation
        // where we have a very small remaining capacity but no headers will ever fit and we end
        // up constantly trying to see if the next resource might make it. In the future we can
        // make this behavior different between render and prerender since in the latter case
        // we are less sensitive to the current requests runtime per and more sensitive to maximizing
        // headers.
        (headers.remainingCapacity -= header.length) >= 2)) {
          // Store this as resettable in case we are prerendering and postpone in the Shell
          renderState.resets.dns[key] = EXISTS;

          if (headers.preconnects) {
            headers.preconnects += ', ';
          } // $FlowFixMe[unsafe-addition]: we assign header during the if condition


          headers.preconnects += header;
        } else {
          // Encode as element
          var resource = [];
          pushLinkImpl(resource, {
            href: href,
            rel: 'dns-prefetch'
          });
          renderState.preconnects.add(resource);
        }
      }

      flushResources(request);
    }
  }

  function preconnect(href, crossOrigin) {

    var request = resolveRequest();

    if (!request) {
      // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
      // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
      // the resources for this call in either case we opt to do nothing. We can consider making this a warning
      // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
      // fetching) and we don't want to warn in those cases.
      return;
    }

    var resumableState = getResumableState(request);
    var renderState = getRenderState(request);

    if (typeof href === 'string' && href) {
      var bucket = crossOrigin === 'use-credentials' ? 'credentials' : typeof crossOrigin === 'string' ? 'anonymous' : 'default';
      var key = getResourceKey(href);

      if (!resumableState.connectResources[bucket].hasOwnProperty(key)) {
        resumableState.connectResources[bucket][key] = EXISTS;
        var headers = renderState.headers;
        var header;

        if (headers && headers.remainingCapacity > 0 && ( // Compute the header since we might be able to fit it in the max length
        header = getPreconnectAsHeader(href, crossOrigin), // We always consume the header length since once we find one header that doesn't fit
        // we assume all the rest won't as well. This is to avoid getting into a situation
        // where we have a very small remaining capacity but no headers will ever fit and we end
        // up constantly trying to see if the next resource might make it. In the future we can
        // make this behavior different between render and prerender since in the latter case
        // we are less sensitive to the current requests runtime per and more sensitive to maximizing
        // headers.
        (headers.remainingCapacity -= header.length) >= 2)) {
          // Store this in resettableState in case we are prerending and postpone in the Shell
          renderState.resets.connect[bucket][key] = EXISTS;

          if (headers.preconnects) {
            headers.preconnects += ', ';
          } // $FlowFixMe[unsafe-addition]: we assign header during the if condition


          headers.preconnects += header;
        } else {
          var resource = [];
          pushLinkImpl(resource, {
            rel: 'preconnect',
            href: href,
            crossOrigin: crossOrigin
          });
          renderState.preconnects.add(resource);
        }
      }

      flushResources(request);
    }
  }

  function preload(href, as, options) {

    var request = resolveRequest();

    if (!request) {
      // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
      // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
      // the resources for this call in either case we opt to do nothing. We can consider making this a warning
      // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
      // fetching) and we don't want to warn in those cases.
      return;
    }

    var resumableState = getResumableState(request);
    var renderState = getRenderState(request);

    if (as && href) {
      switch (as) {
        case 'image':
          {
            var imageSrcSet, imageSizes, fetchPriority;

            if (options) {
              imageSrcSet = options.imageSrcSet;
              imageSizes = options.imageSizes;
              fetchPriority = options.fetchPriority;
            }

            var key = getImageResourceKey(href, imageSrcSet, imageSizes);

            if (resumableState.imageResources.hasOwnProperty(key)) {
              // we can return if we already have this resource
              return;
            }

            resumableState.imageResources[key] = PRELOAD_NO_CREDS;
            var headers = renderState.headers;
            var header;

            if (headers && headers.remainingCapacity > 0 && fetchPriority === 'high' && ( // Compute the header since we might be able to fit it in the max length
            header = getPreloadAsHeader(href, as, options), // We always consume the header length since once we find one header that doesn't fit
            // we assume all the rest won't as well. This is to avoid getting into a situation
            // where we have a very small remaining capacity but no headers will ever fit and we end
            // up constantly trying to see if the next resource might make it. In the future we can
            // make this behavior different between render and prerender since in the latter case
            // we are less sensitive to the current requests runtime per and more sensitive to maximizing
            // headers.
            (headers.remainingCapacity -= header.length) >= 2)) {
              // If we postpone in the shell we will still emit a preload as a header so we
              // track this to make sure we don't reset it.
              renderState.resets.image[key] = PRELOAD_NO_CREDS;

              if (headers.highImagePreloads) {
                headers.highImagePreloads += ', ';
              } // $FlowFixMe[unsafe-addition]: we assign header during the if condition


              headers.highImagePreloads += header;
            } else {
              // If we don't have headers to write to we have to encode as elements to flush in the head
              // When we have imageSrcSet the browser probably cannot load the right version from headers
              // (this should be verified by testing). For now we assume these need to go in the head
              // as elements even if headers are available.
              var resource = [];
              pushLinkImpl(resource, assign({
                rel: 'preload',
                // There is a bug in Safari where imageSrcSet is not respected on preload links
                // so we omit the href here if we have imageSrcSet b/c safari will load the wrong image.
                // This harms older browers that do not support imageSrcSet by making their preloads not work
                // but this population is shrinking fast and is already small so we accept this tradeoff.
                href: imageSrcSet ? undefined : href,
                as: as
              }, options));

              if (fetchPriority === 'high') {
                renderState.highImagePreloads.add(resource);
              } else {
                renderState.bulkPreloads.add(resource); // Stash the resource in case we need to promote it to higher priority
                // when an img tag is rendered

                renderState.preloads.images.set(key, resource);
              }
            }

            break;
          }

        case 'style':
          {
            var _key = getResourceKey(href);

            if (resumableState.styleResources.hasOwnProperty(_key)) {
              // we can return if we already have this resource
              return;
            }

            var _resource2 = [];
            pushLinkImpl(_resource2, assign({
              rel: 'preload',
              href: href,
              as: as
            }, options));
            resumableState.styleResources[_key] = options && (typeof options.crossOrigin === 'string' || typeof options.integrity === 'string') ? [options.crossOrigin, options.integrity] : PRELOAD_NO_CREDS;
            renderState.preloads.stylesheets.set(_key, _resource2);
            renderState.bulkPreloads.add(_resource2);
            break;
          }

        case 'script':
          {
            var _key2 = getResourceKey(href);

            if (resumableState.scriptResources.hasOwnProperty(_key2)) {
              // we can return if we already have this resource
              return;
            }

            var _resource3 = [];
            renderState.preloads.scripts.set(_key2, _resource3);
            renderState.bulkPreloads.add(_resource3);
            pushLinkImpl(_resource3, assign({
              rel: 'preload',
              href: href,
              as: as
            }, options));
            resumableState.scriptResources[_key2] = options && (typeof options.crossOrigin === 'string' || typeof options.integrity === 'string') ? [options.crossOrigin, options.integrity] : PRELOAD_NO_CREDS;
            break;
          }

        default:
          {
            var _key3 = getResourceKey(href);

            var hasAsType = resumableState.unknownResources.hasOwnProperty(as);
            var resources;

            if (hasAsType) {
              resources = resumableState.unknownResources[as];

              if (resources.hasOwnProperty(_key3)) {
                // we can return if we already have this resource
                return;
              }
            } else {
              resources = {};
              resumableState.unknownResources[as] = resources;
            }

            resources[_key3] = PRELOAD_NO_CREDS;
            var _headers = renderState.headers;

            var _header;

            if (_headers && _headers.remainingCapacity > 0 && as === 'font' && ( // We compute the header here because we might be able to fit it in the max length
            _header = getPreloadAsHeader(href, as, options), // We always consume the header length since once we find one header that doesn't fit
            // we assume all the rest won't as well. This is to avoid getting into a situation
            // where we have a very small remaining capacity but no headers will ever fit and we end
            // up constantly trying to see if the next resource might make it. In the future we can
            // make this behavior different between render and prerender since in the latter case
            // we are less sensitive to the current requests runtime per and more sensitive to maximizing
            // headers.
            (_headers.remainingCapacity -= _header.length) >= 2)) {
              // If we postpone in the shell we will still emit this preload so we
              // track it here to prevent it from being reset.
              renderState.resets.font[_key3] = PRELOAD_NO_CREDS;

              if (_headers.fontPreloads) {
                _headers.fontPreloads += ', ';
              } // $FlowFixMe[unsafe-addition]: we assign header during the if condition


              _headers.fontPreloads += _header;
            } else {
              // We either don't have headers or we are preloading something that does
              // not warrant elevated priority so we encode as an element.
              var _resource4 = [];

              var props = assign({
                rel: 'preload',
                href: href,
                as: as
              }, options);

              pushLinkImpl(_resource4, props);

              switch (as) {
                case 'font':
                  renderState.fontPreloads.add(_resource4);
                  break;
                // intentional fall through

                default:
                  renderState.bulkPreloads.add(_resource4);
              }
            }
          }
      } // If we got this far we created a new resource


      flushResources(request);
    }
  }

  function preloadModule(href, options) {

    var request = resolveRequest();

    if (!request) {
      // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
      // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
      // the resources for this call in either case we opt to do nothing. We can consider making this a warning
      // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
      // fetching) and we don't want to warn in those cases.
      return;
    }

    var resumableState = getResumableState(request);
    var renderState = getRenderState(request);

    if (href) {
      var key = getResourceKey(href);
      var as = options && typeof options.as === 'string' ? options.as : 'script';
      var resource;

      switch (as) {
        case 'script':
          {
            if (resumableState.moduleScriptResources.hasOwnProperty(key)) {
              // we can return if we already have this resource
              return;
            }

            resource = [];
            resumableState.moduleScriptResources[key] = options && (typeof options.crossOrigin === 'string' || typeof options.integrity === 'string') ? [options.crossOrigin, options.integrity] : PRELOAD_NO_CREDS;
            renderState.preloads.moduleScripts.set(key, resource);
            break;
          }

        default:
          {
            var hasAsType = resumableState.moduleUnknownResources.hasOwnProperty(as);
            var resources;

            if (hasAsType) {
              resources = resumableState.unknownResources[as];

              if (resources.hasOwnProperty(key)) {
                // we can return if we already have this resource
                return;
              }
            } else {
              resources = {};
              resumableState.moduleUnknownResources[as] = resources;
            }

            resource = [];
            resources[key] = PRELOAD_NO_CREDS;
          }
      }

      pushLinkImpl(resource, assign({
        rel: 'modulepreload',
        href: href
      }, options));
      renderState.bulkPreloads.add(resource); // If we got this far we created a new resource

      flushResources(request);
    }
  }

  function preinitStyle(href, precedence, options) {

    var request = resolveRequest();

    if (!request) {
      // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
      // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
      // the resources for this call in either case we opt to do nothing. We can consider making this a warning
      // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
      // fetching) and we don't want to warn in those cases.
      return;
    }

    var resumableState = getResumableState(request);
    var renderState = getRenderState(request);

    if (href) {
      precedence = precedence || 'default';
      var key = getResourceKey(href);
      var styleQueue = renderState.styles.get(precedence);
      var hasKey = resumableState.styleResources.hasOwnProperty(key);
      var resourceState = hasKey ? resumableState.styleResources[key] : undefined;

      if (resourceState !== EXISTS) {
        // We are going to create this resource now so it is marked as Exists
        resumableState.styleResources[key] = EXISTS; // If this is the first time we've encountered this precedence we need
        // to create a StyleQueue

        if (!styleQueue) {
          styleQueue = {
            precedence: stringToChunk(escapeTextForBrowser(precedence)),
            rules: [],
            hrefs: [],
            sheets: new Map()
          };
          renderState.styles.set(precedence, styleQueue);
        }

        var resource = {
          state: PENDING$1,
          props: assign({
            rel: 'stylesheet',
            href: href,
            'data-precedence': precedence
          }, options)
        };

        if (resourceState) {
          // When resourceState is truty it is a Preload state. We cast it for clarity
          var preloadState = resourceState;

          if (preloadState.length === 2) {
            adoptPreloadCredentials(resource.props, preloadState);
          }

          var preloadResource = renderState.preloads.stylesheets.get(key);

          if (preloadResource && preloadResource.length > 0) {
            // The Preload for this resource was created in this render pass and has not flushed yet so
            // we need to clear it to avoid it flushing.
            preloadResource.length = 0;
          } else {
            // Either the preload resource from this render already flushed in this render pass
            // or the preload flushed in a prior pass (prerender). In either case we need to mark
            // this resource as already having been preloaded.
            resource.state = PRELOADED;
          }
        } // We add the newly created resource to our StyleQueue and if necessary
        // track the resource with the currently rendering boundary


        styleQueue.sheets.set(key, resource); // Notify the request that there are resources to flush even if no work is currently happening

        flushResources(request);
      }
    }
  }

  function preinitScript(src, options) {

    var request = resolveRequest();

    if (!request) {
      // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
      // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
      // the resources for this call in either case we opt to do nothing. We can consider making this a warning
      // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
      // fetching) and we don't want to warn in those cases.
      return;
    }

    var resumableState = getResumableState(request);
    var renderState = getRenderState(request);

    if (src) {
      var key = getResourceKey(src);
      var hasKey = resumableState.scriptResources.hasOwnProperty(key);
      var resourceState = hasKey ? resumableState.scriptResources[key] : undefined;

      if (resourceState !== EXISTS) {
        // We are going to create this resource now so it is marked as Exists
        resumableState.scriptResources[key] = EXISTS;

        var props = assign({
          src: src,
          async: true
        }, options);

        if (resourceState) {
          // When resourceState is truty it is a Preload state. We cast it for clarity
          var preloadState = resourceState;

          if (preloadState.length === 2) {
            adoptPreloadCredentials(props, preloadState);
          }

          var preloadResource = renderState.preloads.scripts.get(key);

          if (preloadResource) {
            // the preload resource exists was created in this render. Now that we have
            // a script resource which will emit earlier than a preload would if it
            // hasn't already flushed we prevent it from flushing by zeroing the length
            preloadResource.length = 0;
          }
        }

        var resource = []; // Add to the script flushing queue

        renderState.scripts.add(resource); // encode the tag as Chunks

        pushScriptImpl(resource, props); // Notify the request that there are resources to flush even if no work is currently happening

        flushResources(request);
      }

      return;
    }
  }

  function preinitModuleScript(src, options) {

    var request = resolveRequest();

    if (!request) {
      // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
      // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
      // the resources for this call in either case we opt to do nothing. We can consider making this a warning
      // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
      // fetching) and we don't want to warn in those cases.
      return;
    }

    var resumableState = getResumableState(request);
    var renderState = getRenderState(request);

    if (src) {
      var key = getResourceKey(src);
      var hasKey = resumableState.moduleScriptResources.hasOwnProperty(key);
      var resourceState = hasKey ? resumableState.moduleScriptResources[key] : undefined;

      if (resourceState !== EXISTS) {
        // We are going to create this resource now so it is marked as Exists
        resumableState.moduleScriptResources[key] = EXISTS;

        var props = assign({
          src: src,
          type: 'module',
          async: true
        }, options);

        if (resourceState) {
          // When resourceState is truty it is a Preload state. We cast it for clarity
          var preloadState = resourceState;

          if (preloadState.length === 2) {
            adoptPreloadCredentials(props, preloadState);
          }

          var preloadResource = renderState.preloads.moduleScripts.get(key);

          if (preloadResource) {
            // the preload resource exists was created in this render. Now that we have
            // a script resource which will emit earlier than a preload would if it
            // hasn't already flushed we prevent it from flushing by zeroing the length
            preloadResource.length = 0;
          }
        }

        var resource = []; // Add to the script flushing queue

        renderState.scripts.add(resource); // encode the tag as Chunks

        pushScriptImpl(resource, props); // Notify the request that there are resources to flush even if no work is currently happening

        flushResources(request);
      }

      return;
    }
  } // This function is only safe to call at Request start time since it assumes
  // that each module has not already been preloaded. If we find a need to preload
  // scripts at any other point in time we will need to check whether the preload
  // already exists and not assume it


  function preloadBootstrapScriptOrModule(resumableState, renderState, href, props) {

    var key = getResourceKey(href);

    {
      if (resumableState.scriptResources.hasOwnProperty(key) || resumableState.moduleScriptResources.hasOwnProperty(key)) {
        // This is coded as a React error because it should be impossible for a userspace preload to preempt this call
        // If a userspace preload can preempt it then this assumption is broken and we need to reconsider this strategy
        // rather than instruct the user to not preload their bootstrap scripts themselves
        error('Internal React Error: React expected bootstrap script or module with src "%s" to not have been preloaded already. please file an issue', href);
      }
    } // The href used for bootstrap scripts and bootstrap modules should never be
    // used to preinit the resource. If a script can be preinited then it shouldn't
    // be a bootstrap script/module and if it is a bootstrap script/module then it
    // must not be safe to emit early. To avoid possibly allowing for preinits of
    // bootstrap scripts/modules we occlude these keys.


    resumableState.scriptResources[key] = EXISTS;
    resumableState.moduleScriptResources[key] = EXISTS;
    var resource = [];
    pushLinkImpl(resource, props);
    renderState.bootstrapScripts.add(resource);
  }

  function internalPreinitScript(resumableState, renderState, src, chunks) {
    var key = getResourceKey(src);

    if (!resumableState.scriptResources.hasOwnProperty(key)) {
      var resource = chunks;
      resumableState.scriptResources[key] = EXISTS;
      renderState.scripts.add(resource);
    }

    return;
  }

  function preloadAsStylePropsFromProps(href, props) {
    return {
      rel: 'preload',
      as: 'style',
      href: href,
      crossOrigin: props.crossOrigin,
      fetchPriority: props.fetchPriority,
      integrity: props.integrity,
      media: props.media,
      hrefLang: props.hrefLang,
      referrerPolicy: props.referrerPolicy
    };
  }

  function stylesheetPropsFromRawProps(rawProps) {
    return assign({}, rawProps, {
      'data-precedence': rawProps.precedence,
      precedence: null
    });
  }

  function adoptPreloadCredentials(target, preloadState) {
    if (target.crossOrigin == null) target.crossOrigin = preloadState[0];
    if (target.integrity == null) target.integrity = preloadState[1];
  }

  function getPrefetchDNSAsHeader(href) {
    var escapedHref = escapeHrefForLinkHeaderURLContext(href);
    return "<" + escapedHref + ">; rel=dns-prefetch";
  }

  function getPreconnectAsHeader(href, crossOrigin) {
    var escapedHref = escapeHrefForLinkHeaderURLContext(href);
    var value = "<" + escapedHref + ">; rel=preconnect";

    if (typeof crossOrigin === 'string') {
      var escapedCrossOrigin = escapeStringForLinkHeaderQuotedParamValueContext(crossOrigin, 'crossOrigin');
      value += "; crossorigin=\"" + escapedCrossOrigin + "\"";
    }

    return value;
  }

  function getPreloadAsHeader(href, as, params) {
    var escapedHref = escapeHrefForLinkHeaderURLContext(href);
    var escapedAs = escapeStringForLinkHeaderQuotedParamValueContext(as, 'as');
    var value = "<" + escapedHref + ">; rel=preload; as=\"" + escapedAs + "\"";

    for (var paramName in params) {
      if (hasOwnProperty.call(params, paramName)) {
        var paramValue = params[paramName];

        if (typeof paramValue === 'string') {
          value += "; " + paramName.toLowerCase() + "=\"" + escapeStringForLinkHeaderQuotedParamValueContext(paramValue, paramName) + "\"";
        }
      }
    }

    return value;
  }

  function getStylesheetPreloadAsHeader(stylesheet) {
    var props = stylesheet.props;
    var preloadOptions = {
      crossOrigin: props.crossOrigin,
      integrity: props.integrity,
      nonce: props.nonce,
      type: props.type,
      fetchPriority: props.fetchPriority,
      referrerPolicy: props.referrerPolicy,
      media: props.media
    };
    return getPreloadAsHeader(props.href, 'style', preloadOptions);
  } // This escaping function is only safe to use for href values being written into
  // a "Link" header in between `<` and `>` characters. The primary concern with the href is
  // to escape the bounding characters as well as new lines. This is unsafe to use in any other
  // context


  var regexForHrefInLinkHeaderURLContext = /[<>\r\n]/g;

  function escapeHrefForLinkHeaderURLContext(hrefInput) {
    {
      checkAttributeStringCoercion(hrefInput, 'href');
    }

    var coercedHref = '' + hrefInput;
    return coercedHref.replace(regexForHrefInLinkHeaderURLContext, escapeHrefForLinkHeaderURLContextReplacer);
  }

  function escapeHrefForLinkHeaderURLContextReplacer(match) {
    switch (match) {
      case '<':
        return '%3C';

      case '>':
        return '%3E';

      case '\n':
        return '%0A';

      case '\r':
        return '%0D';

      default:
        {
          // eslint-disable-next-line react-internal/prod-error-codes
          throw new Error('escapeLinkHrefForHeaderContextReplacer encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React');
        }
    }
  } // This escaping function is only safe to use for quoted param values in an HTTP header.
  // It is unsafe to use for any value not inside quote marks in parater value position.


  var regexForLinkHeaderQuotedParamValueContext = /["';,\r\n]/g;

  function escapeStringForLinkHeaderQuotedParamValueContext(value, name) {
    {
      checkOptionStringCoercion(value, name);
    }

    var coerced = '' + value;
    return coerced.replace(regexForLinkHeaderQuotedParamValueContext, escapeStringForLinkHeaderQuotedParamValueContextReplacer);
  }

  function escapeStringForLinkHeaderQuotedParamValueContextReplacer(match) {
    switch (match) {
      case '"':
        return '%22';

      case "'":
        return '%27';

      case ';':
        return '%3B';

      case ',':
        return '%2C';

      case '\n':
        return '%0A';

      case '\r':
        return '%0D';

      default:
        {
          // eslint-disable-next-line react-internal/prod-error-codes
          throw new Error('escapeStringForLinkHeaderQuotedParamValueContextReplacer encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React');
        }
    }
  }

  function hoistStyleQueueDependency(styleQueue) {
    this.styles.add(styleQueue);
  }

  function hoistStylesheetDependency(stylesheet) {
    this.stylesheets.add(stylesheet);
  }

  function hoistHoistables(parentState, childState) {
    childState.styles.forEach(hoistStyleQueueDependency, parentState);
    childState.stylesheets.forEach(hoistStylesheetDependency, parentState);
  } // This function is called at various times depending on whether we are rendering
  // or prerendering. In this implementation we only actually emit headers once and
  // subsequent calls are ignored. We track whether the request has a completed shell
  // to determine whether we will follow headers with a flush including stylesheets.
  // In the context of prerrender we don't have a completed shell when the request finishes
  // with a postpone in the shell. In the context of a render we don't have a completed shell
  // if this is called before the shell finishes rendering which usually will happen anytime
  // anything suspends in the shell.

  function emitEarlyPreloads(renderState, resumableState, shellComplete) {
    var onHeaders = renderState.onHeaders;

    if (onHeaders) {
      var headers = renderState.headers;

      if (headers) {
        // Even if onHeaders throws we don't want to call this again so
        // we drop the headers state from this point onwards.
        renderState.headers = null;
        var linkHeader = headers.preconnects;

        if (headers.fontPreloads) {
          if (linkHeader) {
            linkHeader += ', ';
          }

          linkHeader += headers.fontPreloads;
        }

        if (headers.highImagePreloads) {
          if (linkHeader) {
            linkHeader += ', ';
          }

          linkHeader += headers.highImagePreloads;
        }

        if (!shellComplete) {
          // We use raw iterators because we want to be able to halt iteration
          // We could refactor renderState to store these dually in arrays to
          // make this more efficient at the cost of additional memory and
          // write overhead. However this code only runs once per request so
          // for now I consider this sufficient.
          var queueIter = renderState.styles.values();

          outer: for (var queueStep = queueIter.next(); headers.remainingCapacity > 0 && !queueStep.done; queueStep = queueIter.next()) {
            var sheets = queueStep.value.sheets;
            var sheetIter = sheets.values();

            for (var sheetStep = sheetIter.next(); headers.remainingCapacity > 0 && !sheetStep.done; sheetStep = sheetIter.next()) {
              var sheet = sheetStep.value;
              var props = sheet.props;
              var key = getResourceKey(props.href);
              var header = getStylesheetPreloadAsHeader(sheet); // We mutate the capacity b/c we don't want to keep checking if later headers will fit.
              // This means that a particularly long header might close out the header queue where later
              // headers could still fit. We could in the future alter the behavior here based on prerender vs render
              // since during prerender we aren't as concerned with pure runtime performance.

              if ((headers.remainingCapacity -= header.length) >= 2) {
                renderState.resets.style[key] = PRELOAD_NO_CREDS;

                if (linkHeader) {
                  linkHeader += ', ';
                }

                linkHeader += header; // We already track that the resource exists in resumableState however
                // if the resumableState resets because we postponed in the shell
                // which is what is happening in this branch if we are prerendering
                // then we will end up resetting the resumableState. When it resets we
                // want to record the fact that this stylesheet was already preloaded

                renderState.resets.style[key] = typeof props.crossOrigin === 'string' || typeof props.integrity === 'string' ? [props.crossOrigin, props.integrity] : PRELOAD_NO_CREDS;
              } else {
                break outer;
              }
            }
          }
        }

        if (linkHeader) {
          onHeaders({
            Link: linkHeader
          });
        } else {
          // We still call this with no headers because a user may be using it as a signal that
          // it React will not provide any headers
          onHeaders({});
        }

        return;
      }
    }
  }
  var NotPendingTransition = NotPending;

  function getWrappedName(outerType, innerType, wrapperName) {
    var displayName = outerType.displayName;

    if (displayName) {
      return displayName;
    }

    var functionName = innerType.displayName || innerType.name || '';
    return functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName;
  } // Keep in sync with react-reconciler/getComponentNameFromFiber


  function getContextName(type) {
    return type.displayName || 'Context';
  }

  var REACT_CLIENT_REFERENCE = Symbol.for('react.client.reference'); // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.

  function getComponentNameFromType(type) {
    if (type == null) {
      // Host root, text node or just invalid type.
      return null;
    }

    if (typeof type === 'function') {
      if (type.$$typeof === REACT_CLIENT_REFERENCE) {
        // TODO: Create a convention for naming client references with debug info.
        return null;
      }

      return type.displayName || type.name || null;
    }

    if (typeof type === 'string') {
      return type;
    }

    switch (type) {
      case REACT_FRAGMENT_TYPE:
        return 'Fragment';

      case REACT_PORTAL_TYPE:
        return 'Portal';

      case REACT_PROFILER_TYPE:
        return 'Profiler';

      case REACT_STRICT_MODE_TYPE:
        return 'StrictMode';

      case REACT_SUSPENSE_TYPE:
        return 'Suspense';

      case REACT_SUSPENSE_LIST_TYPE:
        return 'SuspenseList';

      case REACT_CACHE_TYPE:
        {
          return 'Cache';
        }

    }

    if (typeof type === 'object') {
      {
        if (typeof type.tag === 'number') {
          error('Received an unexpected object in getComponentNameFromType(). ' + 'This is likely a bug in React. Please file an issue.');
        }
      }

      switch (type.$$typeof) {
        case REACT_PROVIDER_TYPE:
          {
            var provider = type;
            return getContextName(provider._context) + '.Provider';
          }

        case REACT_CONTEXT_TYPE:
          var context = type;

          {
            return getContextName(context) + '.Consumer';
          }

        case REACT_CONSUMER_TYPE:
          {
            return null;
          }

        case REACT_FORWARD_REF_TYPE:
          return getWrappedName(type, type.render, 'ForwardRef');

        case REACT_MEMO_TYPE:
          var outerName = type.displayName || null;

          if (outerName !== null) {
            return outerName;
          }

          return getComponentNameFromType(type.type) || 'Memo';

        case REACT_LAZY_TYPE:
          {
            var lazyComponent = type;
            var payload = lazyComponent._payload;
            var init = lazyComponent._init;

            try {
              return getComponentNameFromType(init(payload));
            } catch (x) {
              return null;
            }
          }
      }
    }

    return null;
  }

  var warnedAboutMissingGetChildContext;

  {
    warnedAboutMissingGetChildContext = {};
  }

  var emptyContextObject = {};

  {
    Object.freeze(emptyContextObject);
  }

  function getMaskedContext(type, unmaskedContext) {
    {
      var contextTypes = type.contextTypes;

      if (!contextTypes) {
        return emptyContextObject;
      }

      var context = {};

      for (var key in contextTypes) {
        context[key] = unmaskedContext[key];
      }

      return context;
    }
  }
  function processChildContext(instance, type, parentContext, childContextTypes) {
    {
      // TODO (bvaughn) Replace this behavior with an invariant() in the future.
      // It has only been added in Fiber to match the (unintentional) behavior in Stack.
      if (typeof instance.getChildContext !== 'function') {
        {
          var componentName = getComponentNameFromType(type) || 'Unknown';

          if (!warnedAboutMissingGetChildContext[componentName]) {
            warnedAboutMissingGetChildContext[componentName] = true;

            error('%s.childContextTypes is specified but there is no getChildContext() method ' + 'on the instance. You can either define getChildContext() on %s or remove ' + 'childContextTypes from it.', componentName, componentName);
          }
        }

        return parentContext;
      }

      var childContext = instance.getChildContext();

      for (var contextKey in childContext) {
        if (!(contextKey in childContextTypes)) {
          throw new Error((getComponentNameFromType(type) || 'Unknown') + ".getChildContext(): key \"" + contextKey + "\" is not defined in childContextTypes.");
        }
      }

      return assign({}, parentContext, childContext);
    }
  }

  var rendererSigil;

  {
    // Use this to detect multiple renderers using the same context
    rendererSigil = {};
  } // Used to store the parent path of all context overrides in a shared linked list.
  // Forming a reverse tree.
  // The structure of a context snapshot is an implementation of this file.
  // Currently, it's implemented as tracking the current active node.


  var rootContextSnapshot = null; // We assume that this runtime owns the "current" field on all ReactContext instances.
  // This global (actually thread local) state represents what state all those "current",
  // fields are currently in.

  var currentActiveSnapshot = null;

  function popNode(prev) {
    {
      prev.context._currentValue = prev.parentValue;
    }
  }

  function pushNode(next) {
    {
      next.context._currentValue = next.value;
    }
  }

  function popToNearestCommonAncestor(prev, next) {
    if (prev === next) ; else {
      popNode(prev);
      var parentPrev = prev.parent;
      var parentNext = next.parent;

      if (parentPrev === null) {
        if (parentNext !== null) {
          throw new Error('The stacks must reach the root at the same time. This is a bug in React.');
        }
      } else {
        if (parentNext === null) {
          throw new Error('The stacks must reach the root at the same time. This is a bug in React.');
        }

        popToNearestCommonAncestor(parentPrev, parentNext);
      } // On the way back, we push the new ones that weren't common.


      pushNode(next);
    }
  }

  function popAllPrevious(prev) {
    popNode(prev);
    var parentPrev = prev.parent;

    if (parentPrev !== null) {
      popAllPrevious(parentPrev);
    }
  }

  function pushAllNext(next) {
    var parentNext = next.parent;

    if (parentNext !== null) {
      pushAllNext(parentNext);
    }

    pushNode(next);
  }

  function popPreviousToCommonLevel(prev, next) {
    popNode(prev);
    var parentPrev = prev.parent;

    if (parentPrev === null) {
      throw new Error('The depth must equal at least at zero before reaching the root. This is a bug in React.');
    }

    if (parentPrev.depth === next.depth) {
      // We found the same level. Now we just need to find a shared ancestor.
      popToNearestCommonAncestor(parentPrev, next);
    } else {
      // We must still be deeper.
      popPreviousToCommonLevel(parentPrev, next);
    }
  }

  function popNextToCommonLevel(prev, next) {
    var parentNext = next.parent;

    if (parentNext === null) {
      throw new Error('The depth must equal at least at zero before reaching the root. This is a bug in React.');
    }

    if (prev.depth === parentNext.depth) {
      // We found the same level. Now we just need to find a shared ancestor.
      popToNearestCommonAncestor(prev, parentNext);
    } else {
      // We must still be deeper.
      popNextToCommonLevel(prev, parentNext);
    }

    pushNode(next);
  } // Perform context switching to the new snapshot.
  // To make it cheap to read many contexts, while not suspending, we make the switch eagerly by
  // updating all the context's current values. That way reads, always just read the current value.
  // At the cost of updating contexts even if they're never read by this subtree.


  function switchContext(newSnapshot) {
    // The basic algorithm we need to do is to pop back any contexts that are no longer on the stack.
    // We also need to update any new contexts that are now on the stack with the deepest value.
    // The easiest way to update new contexts is to just reapply them in reverse order from the
    // perspective of the backpointers. To avoid allocating a lot when switching, we use the stack
    // for that. Therefore this algorithm is recursive.
    // 1) First we pop which ever snapshot tree was deepest. Popping old contexts as we go.
    // 2) Then we find the nearest common ancestor from there. Popping old contexts as we go.
    // 3) Then we reapply new contexts on the way back up the stack.
    var prev = currentActiveSnapshot;
    var next = newSnapshot;

    if (prev !== next) {
      if (prev === null) {
        // $FlowFixMe[incompatible-call]: This has to be non-null since it's not equal to prev.
        pushAllNext(next);
      } else if (next === null) {
        popAllPrevious(prev);
      } else if (prev.depth === next.depth) {
        popToNearestCommonAncestor(prev, next);
      } else if (prev.depth > next.depth) {
        popPreviousToCommonLevel(prev, next);
      } else {
        popNextToCommonLevel(prev, next);
      }

      currentActiveSnapshot = next;
    }
  }
  function pushProvider(context, nextValue) {
    var prevValue;

    {
      prevValue = context._currentValue;
      context._currentValue = nextValue;

      {
        if (context._currentRenderer !== undefined && context._currentRenderer !== null && context._currentRenderer !== rendererSigil) {
          error('Detected multiple renderers concurrently rendering the ' + 'same context provider. This is currently unsupported.');
        }

        context._currentRenderer = rendererSigil;
      }
    }

    var prevNode = currentActiveSnapshot;
    var newNode = {
      parent: prevNode,
      depth: prevNode === null ? 0 : prevNode.depth + 1,
      context: context,
      parentValue: prevValue,
      value: nextValue
    };
    currentActiveSnapshot = newNode;
    return newNode;
  }
  function popProvider(context) {
    var prevSnapshot = currentActiveSnapshot;

    if (prevSnapshot === null) {
      throw new Error('Tried to pop a Context at the root of the app. This is a bug in React.');
    }

    {
      if (prevSnapshot.context !== context) {
        error('The parent context is not the expected context. This is probably a bug in React.');
      }
    }

    {
      var value = prevSnapshot.parentValue;
      prevSnapshot.context._currentValue = value;

      {
        if (context._currentRenderer !== undefined && context._currentRenderer !== null && context._currentRenderer !== rendererSigil) {
          error('Detected multiple renderers concurrently rendering the ' + 'same context provider. This is currently unsupported.');
        }

        context._currentRenderer = rendererSigil;
      }
    }

    return currentActiveSnapshot = prevSnapshot.parent;
  }
  function getActiveContext() {
    return currentActiveSnapshot;
  }
  function readContext$1(context) {
    var value = context._currentValue ;
    return value;
  }

  /**
   * `ReactInstanceMap` maintains a mapping from a public facing stateful
   * instance (key) and the internal representation (value). This allows public
   * methods to accept the user facing instance as an argument and map them back
   * to internal methods.
   *
   * Note that this module is currently shared and assumed to be stateless.
   * If this becomes an actual Map, that will break.
   */
  function get(key) {
    return key._reactInternals;
  }
  function set(key, value) {
    key._reactInternals = value;
  }

  var didWarnAboutNoopUpdateForComponent = {};
  var didWarnAboutDeprecatedWillMount = {};
  var didWarnAboutUninitializedState;
  var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate;
  var didWarnAboutLegacyLifecyclesAndDerivedState;
  var didWarnAboutUndefinedDerivedState;
  var didWarnAboutDirectlyAssigningPropsToState;
  var didWarnAboutContextTypeAndContextTypes;
  var didWarnAboutInvalidateContextType;
  var didWarnOnInvalidCallback;

  {
    didWarnAboutUninitializedState = new Set();
    didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = new Set();
    didWarnAboutLegacyLifecyclesAndDerivedState = new Set();
    didWarnAboutDirectlyAssigningPropsToState = new Set();
    didWarnAboutUndefinedDerivedState = new Set();
    didWarnAboutContextTypeAndContextTypes = new Set();
    didWarnAboutInvalidateContextType = new Set();
    didWarnOnInvalidCallback = new Set();
  }

  function warnOnInvalidCallback(callback) {
    {
      if (callback === null || typeof callback === 'function') {
        return;
      } // eslint-disable-next-line react-internal/safe-string-coercion


      var key = String(callback);

      if (!didWarnOnInvalidCallback.has(key)) {
        didWarnOnInvalidCallback.add(key);

        error('Expected the last optional `callback` argument to be a ' + 'function. Instead received: %s.', callback);
      }
    }
  }

  function warnOnUndefinedDerivedState(type, partialState) {
    {
      if (partialState === undefined) {
        var componentName = getComponentNameFromType(type) || 'Component';

        if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
          didWarnAboutUndefinedDerivedState.add(componentName);

          error('%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. ' + 'You have returned undefined.', componentName);
        }
      }
    }
  }

  function warnNoop(publicInstance, callerName) {
    {
      var _constructor = publicInstance.constructor;
      var componentName = _constructor && getComponentNameFromType(_constructor) || 'ReactClass';
      var warningKey = componentName + '.' + callerName;

      if (didWarnAboutNoopUpdateForComponent[warningKey]) {
        return;
      }

      error('Can only update a mounting component. ' + 'This usually means you called %s() outside componentWillMount() on the server. ' + 'This is a no-op.\n\nPlease check the code for the %s component.', callerName, componentName);

      didWarnAboutNoopUpdateForComponent[warningKey] = true;
    }
  }

  var classComponentUpdater = {
    isMounted: function (inst) {
      return false;
    },
    // $FlowFixMe[missing-local-annot]
    enqueueSetState: function (inst, payload, callback) {
      var internals = get(inst);

      if (internals.queue === null) {
        warnNoop(inst, 'setState');
      } else {
        internals.queue.push(payload);

        {
          if (callback !== undefined && callback !== null) {
            warnOnInvalidCallback(callback);
          }
        }
      }
    },
    enqueueReplaceState: function (inst, payload, callback) {
      var internals = get(inst);
      internals.replace = true;
      internals.queue = [payload];

      {
        if (callback !== undefined && callback !== null) {
          warnOnInvalidCallback(callback);
        }
      }
    },
    // $FlowFixMe[missing-local-annot]
    enqueueForceUpdate: function (inst, callback) {
      var internals = get(inst);

      if (internals.queue === null) {
        warnNoop(inst, 'forceUpdate');
      } else {
        {
          if (callback !== undefined && callback !== null) {
            warnOnInvalidCallback(callback);
          }
        }
      }
    }
  };

  function applyDerivedStateFromProps(instance, ctor, getDerivedStateFromProps, prevState, nextProps) {
    var partialState = getDerivedStateFromProps(nextProps, prevState);

    {
      warnOnUndefinedDerivedState(ctor, partialState);
    } // Merge the partial state and the previous state.


    var newState = partialState === null || partialState === undefined ? prevState : assign({}, prevState, partialState);
    return newState;
  }

  function constructClassInstance(ctor, props, maskedLegacyContext) {
    var context = emptyContextObject;
    var contextType = ctor.contextType;

    {
      if ('contextType' in ctor) {
        var isValid = // Allow null for conditional declaration
        contextType === null || contextType !== undefined && contextType.$$typeof === REACT_CONTEXT_TYPE;

        if (!isValid && !didWarnAboutInvalidateContextType.has(ctor)) {
          didWarnAboutInvalidateContextType.add(ctor);
          var addendum = '';

          if (contextType === undefined) {
            addendum = ' However, it is set to undefined. ' + 'This can be caused by a typo or by mixing up named and default imports. ' + 'This can also happen due to a circular dependency, so ' + 'try moving the createContext() call to a separate file.';
          } else if (typeof contextType !== 'object') {
            addendum = ' However, it is set to a ' + typeof contextType + '.';
          } else if (contextType.$$typeof === REACT_CONSUMER_TYPE) {
            addendum = ' Did you accidentally pass the Context.Consumer instead?';
          } else {
            addendum = ' However, it is set to an object with keys {' + Object.keys(contextType).join(', ') + '}.';
          }

          error('%s defines an invalid contextType. ' + 'contextType should point to the Context object returned by React.createContext().%s', getComponentNameFromType(ctor) || 'Component', addendum);
        }
      }
    }

    if (typeof contextType === 'object' && contextType !== null) {
      context = readContext$1(contextType);
    } else {
      context = maskedLegacyContext;
    }

    var instance = new ctor(props, context);

    {
      if (typeof ctor.getDerivedStateFromProps === 'function' && (instance.state === null || instance.state === undefined)) {
        var componentName = getComponentNameFromType(ctor) || 'Component';

        if (!didWarnAboutUninitializedState.has(componentName)) {
          didWarnAboutUninitializedState.add(componentName);

          error('`%s` uses `getDerivedStateFromProps` but its initial state is ' + '%s. This is not recommended. Instead, define the initial state by ' + 'assigning an object to `this.state` in the constructor of `%s`. ' + 'This ensures that `getDerivedStateFromProps` arguments have a consistent shape.', componentName, instance.state === null ? 'null' : 'undefined', componentName);
        }
      } // If new component APIs are defined, "unsafe" lifecycles won't be called.
      // Warn about these lifecycles if they are present.
      // Don't warn about react-lifecycles-compat polyfilled methods though.


      if (typeof ctor.getDerivedStateFromProps === 'function' || typeof instance.getSnapshotBeforeUpdate === 'function') {
        var foundWillMountName = null;
        var foundWillReceivePropsName = null;
        var foundWillUpdateName = null;

        if (typeof instance.componentWillMount === 'function' && instance.componentWillMount.__suppressDeprecationWarning !== true) {
          foundWillMountName = 'componentWillMount';
        } else if (typeof instance.UNSAFE_componentWillMount === 'function') {
          foundWillMountName = 'UNSAFE_componentWillMount';
        }

        if (typeof instance.componentWillReceiveProps === 'function' && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
          foundWillReceivePropsName = 'componentWillReceiveProps';
        } else if (typeof instance.UNSAFE_componentWillReceiveProps === 'function') {
          foundWillReceivePropsName = 'UNSAFE_componentWillReceiveProps';
        }

        if (typeof instance.componentWillUpdate === 'function' && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
          foundWillUpdateName = 'componentWillUpdate';
        } else if (typeof instance.UNSAFE_componentWillUpdate === 'function') {
          foundWillUpdateName = 'UNSAFE_componentWillUpdate';
        }

        if (foundWillMountName !== null || foundWillReceivePropsName !== null || foundWillUpdateName !== null) {
          var _componentName = getComponentNameFromType(ctor) || 'Component';

          var newApiName = typeof ctor.getDerivedStateFromProps === 'function' ? 'getDerivedStateFromProps()' : 'getSnapshotBeforeUpdate()';

          if (!didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName)) {
            didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName);

            error('Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' + '%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\n' + 'The above lifecycles should be removed. Learn more about this warning here:\n' + 'https://reactjs.org/link/unsafe-component-lifecycles', _componentName, newApiName, foundWillMountName !== null ? "\n  " + foundWillMountName : '', foundWillReceivePropsName !== null ? "\n  " + foundWillReceivePropsName : '', foundWillUpdateName !== null ? "\n  " + foundWillUpdateName : '');
          }
        }
      }
    }

    return instance;
  }

  function checkClassInstance(instance, ctor, newProps) {
    {
      var name = getComponentNameFromType(ctor) || 'Component';
      var renderPresent = instance.render;

      if (!renderPresent) {
        if (ctor.prototype && typeof ctor.prototype.render === 'function') {
          error('No `render` method found on the %s ' + 'instance: did you accidentally return an object from the constructor?', name);
        } else {
          error('No `render` method found on the %s ' + 'instance: you may have forgotten to define `render`.', name);
        }
      }

      if (instance.getInitialState && !instance.getInitialState.isReactClassApproved && !instance.state) {
        error('getInitialState was defined on %s, a plain JavaScript class. ' + 'This is only supported for classes created using React.createClass. ' + 'Did you mean to define a state property instead?', name);
      }

      if (instance.getDefaultProps && !instance.getDefaultProps.isReactClassApproved) {
        error('getDefaultProps was defined on %s, a plain JavaScript class. ' + 'This is only supported for classes created using React.createClass. ' + 'Use a static property to define defaultProps instead.', name);
      }

      if (instance.propTypes) {
        error('propTypes was defined as an instance property on %s. Use a static ' + 'property to define propTypes instead.', name);
      }

      if (instance.contextType) {
        error('contextType was defined as an instance property on %s. Use a static ' + 'property to define contextType instead.', name);
      }

      {
        if (instance.contextTypes) {
          error('contextTypes was defined as an instance property on %s. Use a static ' + 'property to define contextTypes instead.', name);
        }

        if (ctor.contextType && ctor.contextTypes && !didWarnAboutContextTypeAndContextTypes.has(ctor)) {
          didWarnAboutContextTypeAndContextTypes.add(ctor);

          error('%s declares both contextTypes and contextType static properties. ' + 'The legacy contextTypes property will be ignored.', name);
        }
      }

      if (typeof instance.componentShouldUpdate === 'function') {
        error('%s has a method called ' + 'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' + 'The name is phrased as a question because the function is ' + 'expected to return a value.', name);
      }

      if (ctor.prototype && ctor.prototype.isPureReactComponent && typeof instance.shouldComponentUpdate !== 'undefined') {
        error('%s has a method called shouldComponentUpdate(). ' + 'shouldComponentUpdate should not be used when extending React.PureComponent. ' + 'Please extend React.Component if shouldComponentUpdate is used.', getComponentNameFromType(ctor) || 'A pure component');
      }

      if (typeof instance.componentDidUnmount === 'function') {
        error('%s has a method called ' + 'componentDidUnmount(). But there is no such lifecycle method. ' + 'Did you mean componentWillUnmount()?', name);
      }

      if (typeof instance.componentDidReceiveProps === 'function') {
        error('%s has a method called ' + 'componentDidReceiveProps(). But there is no such lifecycle method. ' + 'If you meant to update the state in response to changing props, ' + 'use componentWillReceiveProps(). If you meant to fetch data or ' + 'run side-effects or mutations after React has updated the UI, use componentDidUpdate().', name);
      }

      if (typeof instance.componentWillRecieveProps === 'function') {
        error('%s has a method called ' + 'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?', name);
      }

      if (typeof instance.UNSAFE_componentWillRecieveProps === 'function') {
        error('%s has a method called ' + 'UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?', name);
      }

      var hasMutatedProps = instance.props !== newProps;

      if (instance.props !== undefined && hasMutatedProps) {
        error('When calling super() in `%s`, make sure to pass ' + "up the same props that your component's constructor was passed.", name);
      }

      if (instance.defaultProps) {
        error('Setting defaultProps as an instance property on %s is not supported and will be ignored.' + ' Instead, define defaultProps as a static property on %s.', name, name);
      }

      if (typeof instance.getSnapshotBeforeUpdate === 'function' && typeof instance.componentDidUpdate !== 'function' && !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(ctor)) {
        didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(ctor);

        error('%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). ' + 'This component defines getSnapshotBeforeUpdate() only.', getComponentNameFromType(ctor));
      }

      if (typeof instance.getDerivedStateFromProps === 'function') {
        error('%s: getDerivedStateFromProps() is defined as an instance method ' + 'and will be ignored. Instead, declare it as a static method.', name);
      }

      if (typeof instance.getDerivedStateFromError === 'function') {
        error('%s: getDerivedStateFromError() is defined as an instance method ' + 'and will be ignored. Instead, declare it as a static method.', name);
      }

      if (typeof ctor.getSnapshotBeforeUpdate === 'function') {
        error('%s: getSnapshotBeforeUpdate() is defined as a static method ' + 'and will be ignored. Instead, declare it as an instance method.', name);
      }

      var state = instance.state;

      if (state && (typeof state !== 'object' || isArray(state))) {
        error('%s.state: must be set to an object or null', name);
      }

      if (typeof instance.getChildContext === 'function' && typeof ctor.childContextTypes !== 'object') {
        error('%s.getChildContext(): childContextTypes must be defined in order to ' + 'use getChildContext().', name);
      }
    }
  }

  function callComponentWillMount(type, instance) {
    var oldState = instance.state;

    if (typeof instance.componentWillMount === 'function') {
      {
        if (instance.componentWillMount.__suppressDeprecationWarning !== true) {
          var componentName = getComponentNameFromType(type) || 'Unknown';

          if (!didWarnAboutDeprecatedWillMount[componentName]) {
            warn( // keep this warning in sync with ReactStrictModeWarning.js
            'componentWillMount has been renamed, and is not recommended for use. ' + 'See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n' + '* Move code from componentWillMount to componentDidMount (preferred in most cases) ' + 'or the constructor.\n' + '\nPlease update the following components: %s', componentName);

            didWarnAboutDeprecatedWillMount[componentName] = true;
          }
        }
      }

      instance.componentWillMount();
    }

    if (typeof instance.UNSAFE_componentWillMount === 'function') {
      instance.UNSAFE_componentWillMount();
    }

    if (oldState !== instance.state) {
      {
        error('%s.componentWillMount(): Assigning directly to this.state is ' + "deprecated (except inside a component's " + 'constructor). Use setState instead.', getComponentNameFromType(type) || 'Component');
      }

      classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
    }
  }

  function processUpdateQueue(internalInstance, inst, props, maskedLegacyContext) {
    if (internalInstance.queue !== null && internalInstance.queue.length > 0) {
      var oldQueue = internalInstance.queue;
      var oldReplace = internalInstance.replace;
      internalInstance.queue = null;
      internalInstance.replace = false;

      if (oldReplace && oldQueue.length === 1) {
        inst.state = oldQueue[0];
      } else {
        var nextState = oldReplace ? oldQueue[0] : inst.state;
        var dontMutate = true;

        for (var i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
          var partial = oldQueue[i];
          var partialState = typeof partial === 'function' ? partial.call(inst, nextState, props, maskedLegacyContext) : partial;

          if (partialState != null) {
            if (dontMutate) {
              dontMutate = false;
              nextState = assign({}, nextState, partialState);
            } else {
              assign(nextState, partialState);
            }
          }
        }

        inst.state = nextState;
      }
    } else {
      internalInstance.queue = null;
    }
  } // Invokes the mount life-cycles on a previously never rendered instance.


  function mountClassInstance(instance, ctor, newProps, maskedLegacyContext) {
    {
      checkClassInstance(instance, ctor, newProps);
    }

    var initialState = instance.state !== undefined ? instance.state : null;
    instance.updater = classComponentUpdater;
    instance.props = newProps;
    instance.state = initialState; // We don't bother initializing the refs object on the server, since we're not going to resolve them anyway.
    // The internal instance will be used to manage updates that happen during this mount.

    var internalInstance = {
      queue: [],
      replace: false
    };
    set(instance, internalInstance);
    var contextType = ctor.contextType;

    if (typeof contextType === 'object' && contextType !== null) {
      instance.context = readContext$1(contextType);
    } else {
      instance.context = maskedLegacyContext;
    }

    {
      if (instance.state === newProps) {
        var componentName = getComponentNameFromType(ctor) || 'Component';

        if (!didWarnAboutDirectlyAssigningPropsToState.has(componentName)) {
          didWarnAboutDirectlyAssigningPropsToState.add(componentName);

          error('%s: It is not recommended to assign props directly to state ' + "because updates to props won't be reflected in state. " + 'In most cases, it is better to use props directly.', componentName);
        }
      }
    }

    var getDerivedStateFromProps = ctor.getDerivedStateFromProps;

    if (typeof getDerivedStateFromProps === 'function') {
      instance.state = applyDerivedStateFromProps(instance, ctor, getDerivedStateFromProps, initialState, newProps);
    } // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.


    if (typeof ctor.getDerivedStateFromProps !== 'function' && typeof instance.getSnapshotBeforeUpdate !== 'function' && (typeof instance.UNSAFE_componentWillMount === 'function' || typeof instance.componentWillMount === 'function')) {
      callComponentWillMount(ctor, instance); // If we had additional state updates during this life-cycle, let's
      // process them now.

      processUpdateQueue(internalInstance, instance, newProps, maskedLegacyContext);
    }
  }

  // Ids are base 32 strings whose binary representation corresponds to the
  // position of a node in a tree.
  // Every time the tree forks into multiple children, we add additional bits to
  // the left of the sequence that represent the position of the child within the
  // current level of children.
  //
  //      00101       00010001011010101
  //      ╰─┬─╯       ╰───────┬───────╯
  //   Fork 5 of 20       Parent id
  //
  // The leading 0s are important. In the above example, you only need 3 bits to
  // represent slot 5. However, you need 5 bits to represent all the forks at
  // the current level, so we must account for the empty bits at the end.
  //
  // For this same reason, slots are 1-indexed instead of 0-indexed. Otherwise,
  // the zeroth id at a level would be indistinguishable from its parent.
  //
  // If a node has only one child, and does not materialize an id (i.e. does not
  // contain a useId hook), then we don't need to allocate any space in the
  // sequence. It's treated as a transparent indirection. For example, these two
  // trees produce the same ids:
  //
  // <>                          <>
  //   <Indirection>               <A />
  //     <A />                     <B />
  //   </Indirection>            </>
  //   <B />
  // </>
  //
  // However, we cannot skip any node that materializes an id. Otherwise, a parent
  // id that does not fork would be indistinguishable from its child id. For
  // example, this tree does not fork, but the parent and child must have
  // different ids.
  //
  // <Parent>
  //   <Child />
  // </Parent>
  //
  // To handle this scenario, every time we materialize an id, we allocate a
  // new level with a single slot. You can think of this as a fork with only one
  // prong, or an array of children with length 1.
  //
  // It's possible for the size of the sequence to exceed 32 bits, the max
  // size for bitwise operations. When this happens, we make more room by
  // converting the right part of the id to a string and storing it in an overflow
  // variable. We use a base 32 string representation, because 32 is the largest
  // power of 2 that is supported by toString(). We want the base to be large so
  // that the resulting ids are compact, and we want the base to be a power of 2
  // because every log2(base) bits corresponds to a single character, i.e. every
  // log2(32) = 5 bits. That means we can lop bits off the end 5 at a time without
  // affecting the final result.
  var emptyTreeContext = {
    id: 1,
    overflow: ''
  };
  function getTreeId(context) {
    var overflow = context.overflow;
    var idWithLeadingBit = context.id;
    var id = idWithLeadingBit & ~getLeadingBit(idWithLeadingBit);
    return id.toString(32) + overflow;
  }
  function pushTreeContext(baseContext, totalChildren, index) {
    var baseIdWithLeadingBit = baseContext.id;
    var baseOverflow = baseContext.overflow; // The leftmost 1 marks the end of the sequence, non-inclusive. It's not part
    // of the id; we use it to account for leading 0s.

    var baseLength = getBitLength(baseIdWithLeadingBit) - 1;
    var baseId = baseIdWithLeadingBit & ~(1 << baseLength);
    var slot = index + 1;
    var length = getBitLength(totalChildren) + baseLength; // 30 is the max length we can store without overflowing, taking into
    // consideration the leading 1 we use to mark the end of the sequence.

    if (length > 30) {
      // We overflowed the bitwise-safe range. Fall back to slower algorithm.
      // This branch assumes the length of the base id is greater than 5; it won't
      // work for smaller ids, because you need 5 bits per character.
      //
      // We encode the id in multiple steps: first the base id, then the
      // remaining digits.
      //
      // Each 5 bit sequence corresponds to a single base 32 character. So for
      // example, if the current id is 23 bits long, we can convert 20 of those
      // bits into a string of 4 characters, with 3 bits left over.
      //
      // First calculate how many bits in the base id represent a complete
      // sequence of characters.
      var numberOfOverflowBits = baseLength - baseLength % 5; // Then create a bitmask that selects only those bits.

      var newOverflowBits = (1 << numberOfOverflowBits) - 1; // Select the bits, and convert them to a base 32 string.

      var newOverflow = (baseId & newOverflowBits).toString(32); // Now we can remove those bits from the base id.

      var restOfBaseId = baseId >> numberOfOverflowBits;
      var restOfBaseLength = baseLength - numberOfOverflowBits; // Finally, encode the rest of the bits using the normal algorithm. Because
      // we made more room, this time it won't overflow.

      var restOfLength = getBitLength(totalChildren) + restOfBaseLength;
      var restOfNewBits = slot << restOfBaseLength;
      var id = restOfNewBits | restOfBaseId;
      var overflow = newOverflow + baseOverflow;
      return {
        id: 1 << restOfLength | id,
        overflow: overflow
      };
    } else {
      // Normal path
      var newBits = slot << baseLength;

      var _id = newBits | baseId;

      var _overflow = baseOverflow;
      return {
        id: 1 << length | _id,
        overflow: _overflow
      };
    }
  }

  function getBitLength(number) {
    return 32 - clz32(number);
  }

  function getLeadingBit(id) {
    return 1 << getBitLength(id) - 1;
  } // TODO: Math.clz32 is supported in Node 12+. Maybe we can drop the fallback.


  var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback; // Count leading zeros.
  // Based on:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

  var log = Math.log;
  var LN2 = Math.LN2;

  function clz32Fallback(x) {
    var asUint = x >>> 0;

    if (asUint === 0) {
      return 32;
    }

    return 31 - (log(asUint) / LN2 | 0) | 0;
  }

  // Corresponds to ReactFiberWakeable and ReactFlightWakeable modules. Generally,
  // changes to one module should be reflected in the others.
  // TODO: Rename this module and the corresponding Fiber one to "Thenable"
  // instead of "Wakeable". Or some other more appropriate name.
  // An error that is thrown (e.g. by `use`) to trigger Suspense. If we
  // detect this is caught by userspace, we'll log a warning in development.
  var SuspenseException = new Error("Suspense Exception: This is not a real error! It's an implementation " + 'detail of `use` to interrupt the current render. You must either ' + 'rethrow it immediately, or move the `use` call outside of the ' + '`try/catch` block. Capturing without rethrowing will lead to ' + 'unexpected behavior.\n\n' + 'To handle async errors, wrap your component in an error boundary, or ' + "call the promise's `.catch` method and pass the result to `use`");
  function createThenableState() {
    // The ThenableState is created the first time a component suspends. If it
    // suspends again, we'll reuse the same state.
    return [];
  }

  function noop$2() {}

  function trackUsedThenable(thenableState, thenable, index) {
    var previous = thenableState[index];

    if (previous === undefined) {
      thenableState.push(thenable);
    } else {
      if (previous !== thenable) {
        // Reuse the previous thenable, and drop the new one. We can assume
        // they represent the same value, because components are idempotent.
        // Avoid an unhandled rejection errors for the Promises that we'll
        // intentionally ignore.
        thenable.then(noop$2, noop$2);
        thenable = previous;
      }
    } // We use an expando to track the status and result of a thenable so that we
    // can synchronously unwrap the value. Think of this as an extension of the
    // Promise API, or a custom interface that is a superset of Thenable.
    //
    // If the thenable doesn't have a status, set it to "pending" and attach
    // a listener that will update its status and result when it resolves.


    switch (thenable.status) {
      case 'fulfilled':
        {
          var fulfilledValue = thenable.value;
          return fulfilledValue;
        }

      case 'rejected':
        {
          var rejectedError = thenable.reason;
          throw rejectedError;
        }

      default:
        {
          if (typeof thenable.status === 'string') ; else {
            var pendingThenable = thenable;
            pendingThenable.status = 'pending';
            pendingThenable.then(function (fulfilledValue) {
              if (thenable.status === 'pending') {
                var fulfilledThenable = thenable;
                fulfilledThenable.status = 'fulfilled';
                fulfilledThenable.value = fulfilledValue;
              }
            }, function (error) {
              if (thenable.status === 'pending') {
                var rejectedThenable = thenable;
                rejectedThenable.status = 'rejected';
                rejectedThenable.reason = error;
              }
            }); // Check one more time in case the thenable resolved synchronously

            switch (thenable.status) {
              case 'fulfilled':
                {
                  var fulfilledThenable = thenable;
                  return fulfilledThenable.value;
                }

              case 'rejected':
                {
                  var rejectedThenable = thenable;
                  throw rejectedThenable.reason;
                }
            }
          } // Suspend.
          //
          // Throwing here is an implementation detail that allows us to unwind the
          // call stack. But we shouldn't allow it to leak into userspace. Throw an
          // opaque placeholder value instead of the actual thenable. If it doesn't
          // get captured by the work loop, log a warning, because that means
          // something in userspace must have caught it.


          suspendedThenable = thenable;
          throw SuspenseException;
        }
    }
  } // This is used to track the actual thenable that suspended so it can be
  // passed to the rest of the Suspense implementation — which, for historical
  // reasons, expects to receive a thenable.

  var suspendedThenable = null;
  function getSuspendedThenable() {
    // This is called right after `use` suspends by throwing an exception. `use`
    // throws an opaque value instead of the thenable itself so that it can't be
    // caught in userspace. Then the work loop accesses the actual thenable using
    // this function.
    if (suspendedThenable === null) {
      throw new Error('Expected a suspended thenable. This is a bug in React. Please file ' + 'an issue.');
    }

    var thenable = suspendedThenable;
    suspendedThenable = null;
    return thenable;
  }

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  function is(x, y) {
    return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y // eslint-disable-line no-self-compare
    ;
  }

  var objectIs = // $FlowFixMe[method-unbinding]
  typeof Object.is === 'function' ? Object.is : is;

  var currentlyRenderingComponent = null;
  var currentlyRenderingTask = null;
  var currentlyRenderingRequest = null;
  var currentlyRenderingKeyPath = null;
  var firstWorkInProgressHook = null;
  var workInProgressHook = null; // Whether the work-in-progress hook is a re-rendered hook

  var isReRender = false; // Whether an update was scheduled during the currently executing render pass.

  var didScheduleRenderPhaseUpdate = false; // Counts the number of useId hooks in this component

  var localIdCounter = 0; // Chunks that should be pushed to the stream once the component
  // finishes rendering.
  // Counts the number of useFormState calls in this component

  var formStateCounter = 0; // The index of the useFormState hook that matches the one passed in at the
  // root during an MPA navigation, if any.

  var formStateMatchingIndex = -1; // Counts the number of use(thenable) calls in this component

  var thenableIndexCounter = 0;
  var thenableState = null; // Lazily created map of render-phase updates

  var renderPhaseUpdates = null; // Counter to prevent infinite loops.

  var numberOfReRenders = 0;
  var RE_RENDER_LIMIT = 25;
  var isInHookUserCodeInDev = false; // In DEV, this is the name of the currently executing primitive hook

  var currentHookNameInDev;

  function resolveCurrentlyRenderingComponent() {
    if (currentlyRenderingComponent === null) {
      throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' + ' one of the following reasons:\n' + '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' + '2. You might be breaking the Rules of Hooks\n' + '3. You might have more than one copy of React in the same app\n' + 'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.');
    }

    {
      if (isInHookUserCodeInDev) {
        error('Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. ' + 'You can only call Hooks at the top level of your React function. ' + 'For more information, see ' + 'https://reactjs.org/link/rules-of-hooks');
      }
    }

    return currentlyRenderingComponent;
  }

  function areHookInputsEqual(nextDeps, prevDeps) {
    if (prevDeps === null) {
      {
        error('%s received a final argument during this render, but not during ' + 'the previous render. Even though the final argument is optional, ' + 'its type cannot change between renders.', currentHookNameInDev);
      }

      return false;
    }

    {
      // Don't bother comparing lengths in prod because these arrays should be
      // passed inline.
      if (nextDeps.length !== prevDeps.length) {
        error('The final argument passed to %s changed size between renders. The ' + 'order and size of this array must remain constant.\n\n' + 'Previous: %s\n' + 'Incoming: %s', currentHookNameInDev, "[" + nextDeps.join(', ') + "]", "[" + prevDeps.join(', ') + "]");
      }
    } // $FlowFixMe[incompatible-use] found when upgrading Flow


    for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      if (objectIs(nextDeps[i], prevDeps[i])) {
        continue;
      }

      return false;
    }

    return true;
  }

  function createHook() {
    if (numberOfReRenders > 0) {
      throw new Error('Rendered more hooks than during the previous render');
    }

    return {
      memoizedState: null,
      queue: null,
      next: null
    };
  }

  function createWorkInProgressHook() {
    if (workInProgressHook === null) {
      // This is the first hook in the list
      if (firstWorkInProgressHook === null) {
        isReRender = false;
        firstWorkInProgressHook = workInProgressHook = createHook();
      } else {
        // There's already a work-in-progress. Reuse it.
        isReRender = true;
        workInProgressHook = firstWorkInProgressHook;
      }
    } else {
      if (workInProgressHook.next === null) {
        isReRender = false; // Append to the end of the list

        workInProgressHook = workInProgressHook.next = createHook();
      } else {
        // There's already a work-in-progress. Reuse it.
        isReRender = true;
        workInProgressHook = workInProgressHook.next;
      }
    }

    return workInProgressHook;
  }

  function prepareToUseHooks(request, task, keyPath, componentIdentity, prevThenableState) {
    currentlyRenderingComponent = componentIdentity;
    currentlyRenderingTask = task;
    currentlyRenderingRequest = request;
    currentlyRenderingKeyPath = keyPath;

    {
      isInHookUserCodeInDev = false;
    } // The following should have already been reset
    // didScheduleRenderPhaseUpdate = false;
    // firstWorkInProgressHook = null;
    // numberOfReRenders = 0;
    // renderPhaseUpdates = null;
    // workInProgressHook = null;


    localIdCounter = 0;
    formStateCounter = 0;
    formStateMatchingIndex = -1;
    thenableIndexCounter = 0;
    thenableState = prevThenableState;
  }
  function finishHooks(Component, props, children, refOrContext) {
    // This must be called after every function component to prevent hooks from
    // being used in classes.
    while (didScheduleRenderPhaseUpdate) {
      // Updates were scheduled during the render phase. They are stored in
      // the `renderPhaseUpdates` map. Call the component again, reusing the
      // work-in-progress hooks and applying the additional updates on top. Keep
      // restarting until no more updates are scheduled.
      didScheduleRenderPhaseUpdate = false;
      localIdCounter = 0;
      formStateCounter = 0;
      formStateMatchingIndex = -1;
      thenableIndexCounter = 0;
      numberOfReRenders += 1; // Start over from the beginning of the list

      workInProgressHook = null;
      children = Component(props, refOrContext);
    }

    resetHooksState();
    return children;
  }
  function getThenableStateAfterSuspending() {
    var state = thenableState;
    thenableState = null;
    return state;
  }
  function checkDidRenderIdHook() {
    // This should be called immediately after every finishHooks call.
    // Conceptually, it's part of the return value of finishHooks; it's only a
    // separate function to avoid using an array tuple.
    var didRenderIdHook = localIdCounter !== 0;
    return didRenderIdHook;
  }
  function getFormStateCount() {
    // This should be called immediately after every finishHooks call.
    // Conceptually, it's part of the return value of finishHooks; it's only a
    // separate function to avoid using an array tuple.
    return formStateCounter;
  }
  function getFormStateMatchingIndex() {
    // This should be called immediately after every finishHooks call.
    // Conceptually, it's part of the return value of finishHooks; it's only a
    // separate function to avoid using an array tuple.
    return formStateMatchingIndex;
  } // Reset the internal hooks state if an error occurs while rendering a component

  function resetHooksState() {
    {
      isInHookUserCodeInDev = false;
    }

    currentlyRenderingComponent = null;
    currentlyRenderingTask = null;
    currentlyRenderingRequest = null;
    currentlyRenderingKeyPath = null;
    didScheduleRenderPhaseUpdate = false;
    firstWorkInProgressHook = null;
    numberOfReRenders = 0;
    renderPhaseUpdates = null;
    workInProgressHook = null;
  }

  function readContext(context) {
    {
      if (isInHookUserCodeInDev) {
        error('Context can only be read while React is rendering. ' + 'In classes, you can read it in the render method or getDerivedStateFromProps. ' + 'In function components, you can read it directly in the function body, but not ' + 'inside Hooks like useReducer() or useMemo().');
      }
    }

    return readContext$1(context);
  }

  function useContext(context) {
    {
      currentHookNameInDev = 'useContext';
    }

    resolveCurrentlyRenderingComponent();
    return readContext$1(context);
  }

  function basicStateReducer(state, action) {
    // $FlowFixMe[incompatible-use]: Flow doesn't like mixed types
    return typeof action === 'function' ? action(state) : action;
  }

  function useState(initialState) {
    {
      currentHookNameInDev = 'useState';
    }

    return useReducer(basicStateReducer, // useReducer has a special case to support lazy useState initializers
    initialState);
  }
  function useReducer(reducer, initialArg, init) {
    {
      if (reducer !== basicStateReducer) {
        currentHookNameInDev = 'useReducer';
      }
    }

    currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
    workInProgressHook = createWorkInProgressHook();

    if (isReRender) {
      // This is a re-render. Apply the new render phase updates to the previous
      // current hook.
      var queue = workInProgressHook.queue;
      var dispatch = queue.dispatch;

      if (renderPhaseUpdates !== null) {
        // Render phase updates are stored in a map of queue -> linked list
        var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

        if (firstRenderPhaseUpdate !== undefined) {
          // $FlowFixMe[incompatible-use] found when upgrading Flow
          renderPhaseUpdates.delete(queue); // $FlowFixMe[incompatible-use] found when upgrading Flow

          var newState = workInProgressHook.memoizedState;
          var update = firstRenderPhaseUpdate;

          do {
            // Process this render phase update. We don't have to check the
            // priority because it will always be the same as the current
            // render's.
            var action = update.action;

            {
              isInHookUserCodeInDev = true;
            }

            newState = reducer(newState, action);

            {
              isInHookUserCodeInDev = false;
            } // $FlowFixMe[incompatible-type] we bail out when we get a null


            update = update.next;
          } while (update !== null); // $FlowFixMe[incompatible-use] found when upgrading Flow


          workInProgressHook.memoizedState = newState;
          return [newState, dispatch];
        }
      } // $FlowFixMe[incompatible-use] found when upgrading Flow


      return [workInProgressHook.memoizedState, dispatch];
    } else {
      {
        isInHookUserCodeInDev = true;
      }

      var initialState;

      if (reducer === basicStateReducer) {
        // Special case for `useState`.
        initialState = typeof initialArg === 'function' ? initialArg() : initialArg;
      } else {
        initialState = init !== undefined ? init(initialArg) : initialArg;
      }

      {
        isInHookUserCodeInDev = false;
      } // $FlowFixMe[incompatible-use] found when upgrading Flow


      workInProgressHook.memoizedState = initialState; // $FlowFixMe[incompatible-use] found when upgrading Flow

      var _queue = workInProgressHook.queue = {
        last: null,
        dispatch: null
      };

      var _dispatch = _queue.dispatch = dispatchAction.bind(null, currentlyRenderingComponent, _queue); // $FlowFixMe[incompatible-use] found when upgrading Flow


      return [workInProgressHook.memoizedState, _dispatch];
    }
  }

  function useMemo(nextCreate, deps) {
    currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
    workInProgressHook = createWorkInProgressHook();
    var nextDeps = deps === undefined ? null : deps;

    if (workInProgressHook !== null) {
      var prevState = workInProgressHook.memoizedState;

      if (prevState !== null) {
        if (nextDeps !== null) {
          var prevDeps = prevState[1];

          if (areHookInputsEqual(nextDeps, prevDeps)) {
            return prevState[0];
          }
        }
      }
    }

    {
      isInHookUserCodeInDev = true;
    }

    var nextValue = nextCreate();

    {
      isInHookUserCodeInDev = false;
    } // $FlowFixMe[incompatible-use] found when upgrading Flow


    workInProgressHook.memoizedState = [nextValue, nextDeps];
    return nextValue;
  }

  function useRef(initialValue) {
    currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
    workInProgressHook = createWorkInProgressHook();
    var previousRef = workInProgressHook.memoizedState;

    if (previousRef === null) {
      var ref = {
        current: initialValue
      };

      {
        Object.seal(ref);
      } // $FlowFixMe[incompatible-use] found when upgrading Flow


      workInProgressHook.memoizedState = ref;
      return ref;
    } else {
      return previousRef;
    }
  }

  function dispatchAction(componentIdentity, queue, action) {
    if (numberOfReRenders >= RE_RENDER_LIMIT) {
      throw new Error('Too many re-renders. React limits the number of renders to prevent ' + 'an infinite loop.');
    }

    if (componentIdentity === currentlyRenderingComponent) {
      // This is a render phase update. Stash it in a lazily-created map of
      // queue -> linked list of updates. After this render pass, we'll restart
      // and apply the stashed updates on top of the work-in-progress hook.
      didScheduleRenderPhaseUpdate = true;
      var update = {
        action: action,
        next: null
      };

      if (renderPhaseUpdates === null) {
        renderPhaseUpdates = new Map();
      }

      var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

      if (firstRenderPhaseUpdate === undefined) {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        renderPhaseUpdates.set(queue, update);
      } else {
        // Append the update to the end of the list.
        var lastRenderPhaseUpdate = firstRenderPhaseUpdate;

        while (lastRenderPhaseUpdate.next !== null) {
          lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
        }

        lastRenderPhaseUpdate.next = update;
      }
    }
  }

  function useCallback(callback, deps) {
    return useMemo(function () {
      return callback;
    }, deps);
  }

  function throwOnUseEffectEventCall() {
    throw new Error("A function wrapped in useEffectEvent can't be called during rendering.");
  }

  function useEffectEvent(callback) {
    // $FlowIgnore[incompatible-return]
    return throwOnUseEffectEventCall;
  }

  function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
    if (getServerSnapshot === undefined) {
      throw new Error('Missing getServerSnapshot, which is required for ' + 'server-rendered content. Will revert to client rendering.');
    }

    return getServerSnapshot();
  }

  function useDeferredValue(value, initialValue) {
    resolveCurrentlyRenderingComponent();

    {
      return initialValue !== undefined ? initialValue : value;
    }
  }

  function unsupportedStartTransition() {
    throw new Error('startTransition cannot be called during server rendering.');
  }

  function useTransition() {
    resolveCurrentlyRenderingComponent();
    return [false, unsupportedStartTransition];
  }

  function useHostTransitionStatus() {
    resolveCurrentlyRenderingComponent();
    return NotPendingTransition;
  }

  function unsupportedSetOptimisticState() {
    throw new Error('Cannot update optimistic state while rendering.');
  }

  function useOptimistic(passthrough, reducer) {
    resolveCurrentlyRenderingComponent();
    return [passthrough, unsupportedSetOptimisticState];
  }

  function createPostbackFormStateKey(permalink, componentKeyPath, hookIndex) {
    if (permalink !== undefined) {
      // Don't bother to hash a permalink-based key since it's already short.
      return 'p' + permalink;
    } else {
      // Append a node to the key path that represents the form state hook.
      var keyPath = [componentKeyPath, null, hookIndex]; // Key paths are hashed to reduce the size. It does not need to be secure,
      // and it's more important that it's fast than that it's completely
      // collision-free.

      var keyPathHash = createFastHashJS(JSON.stringify(keyPath));
      return 'k' + keyPathHash;
    }
  }

  function useFormState(action, initialState, permalink) {
    resolveCurrentlyRenderingComponent(); // Count the number of useFormState hooks per component. We also use this to
    // track the position of this useFormState hook relative to the other ones in
    // this component, so we can generate a unique key for each one.

    var formStateHookIndex = formStateCounter++;
    var request = currentlyRenderingRequest; // $FlowIgnore[prop-missing]

    var formAction = action.$$FORM_ACTION;

    if (typeof formAction === 'function') {
      // This is a server action. These have additional features to enable
      // MPA-style form submissions with progressive enhancement.
      // TODO: If the same permalink is passed to multiple useFormStates, and
      // they all have the same action signature, Fizz will pass the postback
      // state to all of them. We should probably only pass it to the first one,
      // and/or warn.
      // The key is lazily generated and deduped so the that the keypath doesn't
      // get JSON.stringify-ed unnecessarily, and at most once.
      var nextPostbackStateKey = null; // Determine the current form state. If we received state during an MPA form
      // submission, then we will reuse that, if the action identity matches.
      // Otherwise we'll use the initial state argument. We will emit a comment
      // marker into the stream that indicates whether the state was reused.

      var state = initialState;
      var componentKeyPath = currentlyRenderingKeyPath;
      var postbackFormState = getFormState(request); // $FlowIgnore[prop-missing]

      var isSignatureEqual = action.$$IS_SIGNATURE_EQUAL;

      if (postbackFormState !== null && typeof isSignatureEqual === 'function') {
        var postbackKey = postbackFormState[1];
        var postbackReferenceId = postbackFormState[2];
        var postbackBoundArity = postbackFormState[3];

        if (isSignatureEqual.call(action, postbackReferenceId, postbackBoundArity)) {
          nextPostbackStateKey = createPostbackFormStateKey(permalink, componentKeyPath, formStateHookIndex);

          if (postbackKey === nextPostbackStateKey) {
            // This was a match
            formStateMatchingIndex = formStateHookIndex; // Reuse the state that was submitted by the form.

            state = postbackFormState[0];
          }
        }
      } // Bind the state to the first argument of the action.


      var boundAction = action.bind(null, state); // Wrap the action so the return value is void.

      var dispatch = function (payload) {
        boundAction(payload);
      }; // $FlowIgnore[prop-missing]


      if (typeof boundAction.$$FORM_ACTION === 'function') {
        // $FlowIgnore[prop-missing]
        dispatch.$$FORM_ACTION = function (prefix) {
          var metadata = boundAction.$$FORM_ACTION(prefix); // Override the action URL

          if (permalink !== undefined) {
            {
              checkAttributeStringCoercion(permalink, 'target');
            }

            permalink += '';
            metadata.action = permalink;
          }

          var formData = metadata.data;

          if (formData) {
            if (nextPostbackStateKey === null) {
              nextPostbackStateKey = createPostbackFormStateKey(permalink, componentKeyPath, formStateHookIndex);
            }

            formData.append('$ACTION_KEY', nextPostbackStateKey);
          }

          return metadata;
        };
      }

      return [state, dispatch];
    } else {
      // This is not a server action, so the implementation is much simpler.
      // Bind the state to the first argument of the action.
      var _boundAction = action.bind(null, initialState); // Wrap the action so the return value is void.


      var _dispatch2 = function (payload) {
        _boundAction(payload);
      };

      return [initialState, _dispatch2];
    }
  }

  function useId() {
    var task = currentlyRenderingTask;
    var treeId = getTreeId(task.treeContext);
    var resumableState = currentResumableState;

    if (resumableState === null) {
      throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component.');
    }

    var localId = localIdCounter++;
    return makeId(resumableState, treeId, localId);
  }

  function use(usable) {
    if (usable !== null && typeof usable === 'object') {
      // $FlowFixMe[method-unbinding]
      if (typeof usable.then === 'function') {
        // This is a thenable.
        var thenable = usable;
        return unwrapThenable(thenable);
      } else if (usable.$$typeof === REACT_CONTEXT_TYPE) {
        var context = usable;
        return readContext(context);
      }
    } // eslint-disable-next-line react-internal/safe-string-coercion


    throw new Error('An unsupported type was passed to use(): ' + String(usable));
  }

  function unwrapThenable(thenable) {
    var index = thenableIndexCounter;
    thenableIndexCounter += 1;

    if (thenableState === null) {
      thenableState = createThenableState();
    }

    return trackUsedThenable(thenableState, thenable, index);
  }

  function unsupportedRefresh() {
    throw new Error('Cache cannot be refreshed during server rendering.');
  }

  function useCacheRefresh() {
    return unsupportedRefresh;
  }

  function useMemoCache(size) {
    var data = new Array(size);

    for (var i = 0; i < size; i++) {
      data[i] = REACT_MEMO_CACHE_SENTINEL;
    }

    return data;
  }

  function noop$1() {}

  var HooksDispatcher = {
    readContext: readContext,
    use: use,
    useContext: useContext,
    useMemo: useMemo,
    useReducer: useReducer,
    useRef: useRef,
    useState: useState,
    useInsertionEffect: noop$1,
    useLayoutEffect: noop$1,
    useCallback: useCallback,
    // useImperativeHandle is not run in the server environment
    useImperativeHandle: noop$1,
    // Effects are not run in the server environment.
    useEffect: noop$1,
    // Debugging effect
    useDebugValue: noop$1,
    useDeferredValue: useDeferredValue,
    useTransition: useTransition,
    useId: useId,
    // Subscriptions are not setup in a server environment.
    useSyncExternalStore: useSyncExternalStore
  };

  {
    HooksDispatcher.useCacheRefresh = useCacheRefresh;
  }

  {
    HooksDispatcher.useEffectEvent = useEffectEvent;
  }

  {
    HooksDispatcher.useMemoCache = useMemoCache;
  }

  {
    HooksDispatcher.useHostTransitionStatus = useHostTransitionStatus;
  }

  {
    HooksDispatcher.useOptimistic = useOptimistic;
    HooksDispatcher.useFormState = useFormState;
  }

  var currentResumableState = null;
  function setCurrentResumableState(resumableState) {
    currentResumableState = resumableState;
  }

  function getCacheSignal() {
    throw new Error('Not implemented.');
  }

  function getCacheForType(resourceType) {
    throw new Error('Not implemented.');
  }

  var DefaultCacheDispatcher = {
    getCacheSignal: getCacheSignal,
    getCacheForType: getCacheForType
  };

  // Helpers to patch console.logs to avoid logging during side-effect free
  // replaying on render function. This currently only patches the object
  // lazily which won't cover if the log function was extracted eagerly.
  // We could also eagerly patch the method.
  var disabledDepth = 0;
  var prevLog;
  var prevInfo;
  var prevWarn;
  var prevError;
  var prevGroup;
  var prevGroupCollapsed;
  var prevGroupEnd;

  function disabledLog() {}

  disabledLog.__reactDisabledLog = true;
  function disableLogs() {
    {
      if (disabledDepth === 0) {
        /* eslint-disable react-internal/no-production-logging */
        prevLog = console.log;
        prevInfo = console.info;
        prevWarn = console.warn;
        prevError = console.error;
        prevGroup = console.group;
        prevGroupCollapsed = console.groupCollapsed;
        prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

        var props = {
          configurable: true,
          enumerable: true,
          value: disabledLog,
          writable: true
        }; // $FlowFixMe[cannot-write] Flow thinks console is immutable.

        Object.defineProperties(console, {
          info: props,
          log: props,
          warn: props,
          error: props,
          group: props,
          groupCollapsed: props,
          groupEnd: props
        });
        /* eslint-enable react-internal/no-production-logging */
      }

      disabledDepth++;
    }
  }
  function reenableLogs() {
    {
      disabledDepth--;

      if (disabledDepth === 0) {
        /* eslint-disable react-internal/no-production-logging */
        var props = {
          configurable: true,
          enumerable: true,
          writable: true
        }; // $FlowFixMe[cannot-write] Flow thinks console is immutable.

        Object.defineProperties(console, {
          log: assign({}, props, {
            value: prevLog
          }),
          info: assign({}, props, {
            value: prevInfo
          }),
          warn: assign({}, props, {
            value: prevWarn
          }),
          error: assign({}, props, {
            value: prevError
          }),
          group: assign({}, props, {
            value: prevGroup
          }),
          groupCollapsed: assign({}, props, {
            value: prevGroupCollapsed
          }),
          groupEnd: assign({}, props, {
            value: prevGroupEnd
          })
        });
        /* eslint-enable react-internal/no-production-logging */
      }

      if (disabledDepth < 0) {
        error('disabledDepth fell below zero. ' + 'This is a bug in React. Please file an issue.');
      }
    }
  }

  var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
  var prefix;
  function describeBuiltInComponentFrame(name, ownerFn) {
    {
      if (prefix === undefined) {
        // Extract the VM specific prefix used by each line.
        try {
          throw Error();
        } catch (x) {
          var match = x.stack.trim().match(/\n( *(at )?)/);
          prefix = match && match[1] || '';
        }
      } // We use the prefix to ensure our stacks line up with native stack frames.


      return '\n' + prefix + name;
    }
  }
  var reentry = false;
  var componentFrameCache;

  {
    var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
    componentFrameCache = new PossiblyWeakMap();
  }
  /**
   * Leverages native browser/VM stack frames to get proper details (e.g.
   * filename, line + col number) for a single component in a component stack. We
   * do this by:
   *   (1) throwing and catching an error in the function - this will be our
   *       control error.
   *   (2) calling the component which will eventually throw an error that we'll
   *       catch - this will be our sample error.
   *   (3) diffing the control and sample error stacks to find the stack frame
   *       which represents our component.
   */


  function describeNativeComponentFrame(fn, construct) {
    // If something asked for a stack inside a fake render, it should get ignored.
    if (!fn || reentry) {
      return '';
    }

    {
      var frame = componentFrameCache.get(fn);

      if (frame !== undefined) {
        return frame;
      }
    }

    reentry = true;
    var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe[incompatible-type] It does accept undefined.

    Error.prepareStackTrace = undefined;
    var previousDispatcher;

    {
      previousDispatcher = ReactCurrentDispatcher$1.current; // Set the dispatcher in DEV because this might be call in the render function
      // for warnings.

      ReactCurrentDispatcher$1.current = null;
      disableLogs();
    }
    /**
     * Finding a common stack frame between sample and control errors can be
     * tricky given the different types and levels of stack trace truncation from
     * different JS VMs. So instead we'll attempt to control what that common
     * frame should be through this object method:
     * Having both the sample and control errors be in the function under the
     * `DescribeNativeComponentFrameRoot` property, + setting the `name` and
     * `displayName` properties of the function ensures that a stack
     * frame exists that has the method name `DescribeNativeComponentFrameRoot` in
     * it for both control and sample stacks.
     */


    var RunInRootFrame = {
      DetermineComponentFrameRoot: function () {
        var control;

        try {
          // This should throw.
          if (construct) {
            // Something should be setting the props in the constructor.
            var Fake = function () {
              throw Error();
            }; // $FlowFixMe[prop-missing]


            Object.defineProperty(Fake.prototype, 'props', {
              set: function () {
                // We use a throwing setter instead of frozen or non-writable props
                // because that won't throw in a non-strict mode function.
                throw Error();
              }
            });

            if (typeof Reflect === 'object' && Reflect.construct) {
              // We construct a different control for this case to include any extra
              // frames added by the construct call.
              try {
                Reflect.construct(Fake, []);
              } catch (x) {
                control = x;
              }

              Reflect.construct(fn, [], Fake);
            } else {
              try {
                Fake.call();
              } catch (x) {
                control = x;
              } // $FlowFixMe[prop-missing] found when upgrading Flow


              fn.call(Fake.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (x) {
              control = x;
            } // TODO(luna): This will currently only throw if the function component
            // tries to access React/ReactDOM/props. We should probably make this throw
            // in simple components too


            var maybePromise = fn(); // If the function component returns a promise, it's likely an async
            // component, which we don't yet support. Attach a noop catch handler to
            // silence the error.
            // TODO: Implement component stacks for async client components?

            if (maybePromise && typeof maybePromise.catch === 'function') {
              maybePromise.catch(function () {});
            }
          }
        } catch (sample) {
          // This is inlined manually because closure doesn't do it for us.
          if (sample && control && typeof sample.stack === 'string') {
            return [sample.stack, control.stack];
          }
        }

        return [null, null];
      }
    }; // $FlowFixMe[prop-missing]

    RunInRootFrame.DetermineComponentFrameRoot.displayName = 'DetermineComponentFrameRoot';
    var namePropDescriptor = Object.getOwnPropertyDescriptor(RunInRootFrame.DetermineComponentFrameRoot, 'name'); // Before ES6, the `name` property was not configurable.

    if (namePropDescriptor && namePropDescriptor.configurable) {
      // V8 utilizes a function's `name` property when generating a stack trace.
      Object.defineProperty(RunInRootFrame.DetermineComponentFrameRoot, // Configurable properties can be updated even if its writable descriptor
      // is set to `false`.
      // $FlowFixMe[cannot-write]
      'name', {
        value: 'DetermineComponentFrameRoot'
      });
    }

    try {
      var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(),
          sampleStack = _RunInRootFrame$Deter[0],
          controlStack = _RunInRootFrame$Deter[1];

      if (sampleStack && controlStack) {
        // This extracts the first frame from the sample that isn't also in the control.
        // Skipping one frame that we assume is the frame that calls the two.
        var sampleLines = sampleStack.split('\n');
        var controlLines = controlStack.split('\n');
        var s = 0;
        var c = 0;

        while (s < sampleLines.length && !sampleLines[s].includes('DetermineComponentFrameRoot')) {
          s++;
        }

        while (c < controlLines.length && !controlLines[c].includes('DetermineComponentFrameRoot')) {
          c++;
        } // We couldn't find our intentionally injected common root frame, attempt
        // to find another common root frame by search from the bottom of the
        // control stack...


        if (s === sampleLines.length || c === controlLines.length) {
          s = sampleLines.length - 1;
          c = controlLines.length - 1;

          while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
            // We expect at least one stack frame to be shared.
            // Typically this will be the root most one. However, stack frames may be
            // cut off due to maximum stack limits. In this case, one maybe cut off
            // earlier than the other. We assume that the sample is longer or the same
            // and there for cut off earlier. So we should find the root most frame in
            // the sample somewhere in the control.
            c--;
          }
        }

        for (; s >= 1 && c >= 0; s--, c--) {
          // Next we find the first one that isn't the same which should be the
          // frame that called our sample function and the control.
          if (sampleLines[s] !== controlLines[c]) {
            // In V8, the first line is describing the message but other VMs don't.
            // If we're about to return the first line, and the control is also on the same
            // line, that's a pretty good indicator that our sample threw at same line as
            // the control. I.e. before we entered the sample frame. So we ignore this result.
            // This can happen if you passed a class to function component, or non-function.
            if (s !== 1 || c !== 1) {
              do {
                s--;
                c--; // We may still have similar intermediate frames from the construct call.
                // The next one that isn't the same should be our match though.

                if (c < 0 || sampleLines[s] !== controlLines[c]) {
                  // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
                  var _frame = '\n' + sampleLines[s].replace(' at new ', ' at '); // If our component frame is labeled "<anonymous>"
                  // but we have a user-provided "displayName"
                  // splice it in to make the stack more readable.


                  if (fn.displayName && _frame.includes('<anonymous>')) {
                    _frame = _frame.replace('<anonymous>', fn.displayName);
                  }

                  if (true) {
                    if (typeof fn === 'function') {
                      componentFrameCache.set(fn, _frame);
                    }
                  } // Return the line we found.


                  return _frame;
                }
              } while (s >= 1 && c >= 0);
            }

            break;
          }
        }
      }
    } finally {
      reentry = false;

      {
        ReactCurrentDispatcher$1.current = previousDispatcher;
        reenableLogs();
      }

      Error.prepareStackTrace = previousPrepareStackTrace;
    } // Fallback to just using the name if we couldn't make it throw.


    var name = fn ? fn.displayName || fn.name : '';
    var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';

    {
      if (typeof fn === 'function') {
        componentFrameCache.set(fn, syntheticFrame);
      }
    }

    return syntheticFrame;
  }

  function describeClassComponentFrame(ctor, ownerFn) {
    {
      return describeNativeComponentFrame(ctor, true);
    }
  }
  function describeFunctionComponentFrame(fn, ownerFn) {
    {
      return describeNativeComponentFrame(fn, false);
    }
  }

  function getStackByComponentStackNode(componentStack) {
    try {
      var info = '';
      var node = componentStack;

      do {
        switch (node.tag) {
          case 0:
            info += describeBuiltInComponentFrame(node.type, null);
            break;

          case 1:
            info += describeFunctionComponentFrame(node.type, null);
            break;

          case 2:
            info += describeClassComponentFrame(node.type, null);
            break;
        } // $FlowFixMe[incompatible-type] we bail out when we get a null


        node = node.parent;
      } while (node);

      return info;
    } catch (x) {
      return '\nError generating stack: ' + x.message + '\n' + x.stack;
    }
  }

  var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
  var ReactCurrentCache = ReactSharedInternals.ReactCurrentCache;
  var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame; // Linked list representing the identity of a component given the component/tag name and key.
  // The name might be minified but we assume that it's going to be the same generated name. Typically
  // because it's just the same compiled output in practice.
  // resume with segmentID at the index

  var CLIENT_RENDERED = 4; // if it errors or infinitely suspends

  var PENDING = 0;
  var COMPLETED = 1;
  var FLUSHED = 2;
  var ABORTED = 3;
  var ERRORED = 4;
  var POSTPONED = 5;
  var OPEN = 0;
  var CLOSING = 1;
  var CLOSED = 2; // This is a default heuristic for how to split up the HTML content into progressive
  // loading. Our goal is to be able to display additional new content about every 500ms.
  // Faster than that is unnecessary and should be throttled on the client. It also
  // adds unnecessary overhead to do more splits. We don't know if it's a higher or lower
  // end device but higher end suffer less from the overhead than lower end does from
  // not getting small enough pieces. We error on the side of low end.
  // We base this on low end 3G speeds which is about 500kbits per second. We assume
  // that there can be a reasonable drop off from max bandwidth which leaves you with
  // as little as 80%. We can receive half of that each 500ms - at best. In practice,
  // a little bandwidth is lost to processing and contention - e.g. CSS and images that
  // are downloaded along with the main content. So we estimate about half of that to be
  // the lower end throughput. In other words, we expect that you can at least show
  // about 12.5kb of content per 500ms. Not counting starting latency for the first
  // paint.
  // 500 * 1024 / 8 * .8 * 0.5 / 2

  var DEFAULT_PROGRESSIVE_CHUNK_SIZE = 12800;

  function defaultErrorHandler(error) {
    console['error'](error); // Don't transform to our wrapper

    return null;
  }

  function noop() {}

  function createRequest(children, resumableState, renderState, rootFormatContext, progressiveChunkSize, onError, onAllReady, onShellReady, onShellError, onFatalError, onPostpone, formState) {
    prepareHostDispatcher();
    var pingedTasks = [];
    var abortSet = new Set();
    var request = {
      destination: null,
      flushScheduled: false,
      resumableState: resumableState,
      renderState: renderState,
      rootFormatContext: rootFormatContext,
      progressiveChunkSize: progressiveChunkSize === undefined ? DEFAULT_PROGRESSIVE_CHUNK_SIZE : progressiveChunkSize,
      status: OPEN,
      fatalError: null,
      nextSegmentId: 0,
      allPendingTasks: 0,
      pendingRootTasks: 0,
      completedRootSegment: null,
      abortableTasks: abortSet,
      pingedTasks: pingedTasks,
      clientRenderedBoundaries: [],
      completedBoundaries: [],
      partialBoundaries: [],
      trackedPostpones: null,
      onError: onError === undefined ? defaultErrorHandler : onError,
      onPostpone: onPostpone === undefined ? noop : onPostpone,
      onAllReady: onAllReady === undefined ? noop : onAllReady,
      onShellReady: onShellReady === undefined ? noop : onShellReady,
      onShellError: onShellError === undefined ? noop : onShellError,
      onFatalError: onFatalError === undefined ? noop : onFatalError,
      formState: formState === undefined ? null : formState
    }; // This segment represents the root fallback.

    var rootSegment = createPendingSegment(request, 0, null, rootFormatContext, // Root segments are never embedded in Text on either edge
    false, false); // There is no parent so conceptually, we're unblocked to flush this segment.

    rootSegment.parentFlushed = true;
    var rootTask = createRenderTask(request, null, children, -1, null, rootSegment, null, abortSet, null, rootFormatContext, emptyContextObject, rootContextSnapshot, emptyTreeContext, null, false);
    pingedTasks.push(rootTask);
    return request;
  }
  function createPrerenderRequest(children, resumableState, renderState, rootFormatContext, progressiveChunkSize, onError, onAllReady, onShellReady, onShellError, onFatalError, onPostpone) {
    var request = createRequest(children, resumableState, renderState, rootFormatContext, progressiveChunkSize, onError, onAllReady, onShellReady, onShellError, onFatalError, onPostpone, undefined); // Start tracking postponed holes during this render.

    request.trackedPostpones = {
      workingMap: new Map(),
      rootNodes: [],
      rootSlots: null
    };
    return request;
  }
  function resumeRequest(children, postponedState, renderState, onError, onAllReady, onShellReady, onShellError, onFatalError, onPostpone) {
    prepareHostDispatcher();
    var pingedTasks = [];
    var abortSet = new Set();
    var request = {
      destination: null,
      flushScheduled: false,
      resumableState: postponedState.resumableState,
      renderState: renderState,
      rootFormatContext: postponedState.rootFormatContext,
      progressiveChunkSize: postponedState.progressiveChunkSize,
      status: OPEN,
      fatalError: null,
      nextSegmentId: postponedState.nextSegmentId,
      allPendingTasks: 0,
      pendingRootTasks: 0,
      completedRootSegment: null,
      abortableTasks: abortSet,
      pingedTasks: pingedTasks,
      clientRenderedBoundaries: [],
      completedBoundaries: [],
      partialBoundaries: [],
      trackedPostpones: null,
      onError: onError === undefined ? defaultErrorHandler : onError,
      onPostpone: onPostpone === undefined ? noop : onPostpone,
      onAllReady: onAllReady === undefined ? noop : onAllReady,
      onShellReady: onShellReady === undefined ? noop : onShellReady,
      onShellError: onShellError === undefined ? noop : onShellError,
      onFatalError: onFatalError === undefined ? noop : onFatalError,
      formState: null
    };

    if (typeof postponedState.replaySlots === 'number') {
      var resumedId = postponedState.replaySlots; // We have a resume slot at the very root. This is effectively just a full rerender.

      var rootSegment = createPendingSegment(request, 0, null, postponedState.rootFormatContext, // Root segments are never embedded in Text on either edge
      false, false);
      rootSegment.id = resumedId; // There is no parent so conceptually, we're unblocked to flush this segment.

      rootSegment.parentFlushed = true;

      var _rootTask = createRenderTask(request, null, children, -1, null, rootSegment, null, abortSet, null, postponedState.rootFormatContext, emptyContextObject, rootContextSnapshot, emptyTreeContext, null, false);

      pingedTasks.push(_rootTask);
      return request;
    }

    var replay = {
      nodes: postponedState.replayNodes,
      slots: postponedState.replaySlots,
      pendingTasks: 0
    };
    var rootTask = createReplayTask(request, null, replay, children, -1, null, null, abortSet, null, postponedState.rootFormatContext, emptyContextObject, rootContextSnapshot, emptyTreeContext, null, false);
    pingedTasks.push(rootTask);
    return request;
  }
  var currentRequest = null;
  function resolveRequest() {
    if (currentRequest) return currentRequest;

    return null;
  }

  function pingTask(request, task) {
    var pingedTasks = request.pingedTasks;
    pingedTasks.push(task);

    if (request.pingedTasks.length === 1) {
      request.flushScheduled = request.destination !== null;
      scheduleWork(function () {
        return performWork(request);
      });
    }
  }

  function createSuspenseBoundary(request, fallbackAbortableTasks) {
    return {
      status: PENDING,
      rootSegmentID: -1,
      parentFlushed: false,
      pendingTasks: 0,
      completedSegments: [],
      byteSize: 0,
      fallbackAbortableTasks: fallbackAbortableTasks,
      errorDigest: null,
      contentState: createHoistableState(),
      fallbackState: createHoistableState(),
      trackedContentKeyPath: null,
      trackedFallbackNode: null
    };
  }

  function createRenderTask(request, thenableState, node, childIndex, blockedBoundary, blockedSegment, hoistableState, abortSet, keyPath, formatContext, legacyContext, context, treeContext, componentStack, isFallback) {
    request.allPendingTasks++;

    if (blockedBoundary === null) {
      request.pendingRootTasks++;
    } else {
      blockedBoundary.pendingTasks++;
    }

    var task = {
      replay: null,
      node: node,
      childIndex: childIndex,
      ping: function () {
        return pingTask(request, task);
      },
      blockedBoundary: blockedBoundary,
      blockedSegment: blockedSegment,
      hoistableState: hoistableState,
      abortSet: abortSet,
      keyPath: keyPath,
      formatContext: formatContext,
      legacyContext: legacyContext,
      context: context,
      treeContext: treeContext,
      componentStack: componentStack,
      thenableState: thenableState,
      isFallback: isFallback
    };
    abortSet.add(task);
    return task;
  }

  function createReplayTask(request, thenableState, replay, node, childIndex, blockedBoundary, hoistableState, abortSet, keyPath, formatContext, legacyContext, context, treeContext, componentStack, isFallback) {
    request.allPendingTasks++;

    if (blockedBoundary === null) {
      request.pendingRootTasks++;
    } else {
      blockedBoundary.pendingTasks++;
    }

    replay.pendingTasks++;
    var task = {
      replay: replay,
      node: node,
      childIndex: childIndex,
      ping: function () {
        return pingTask(request, task);
      },
      blockedBoundary: blockedBoundary,
      blockedSegment: null,
      hoistableState: hoistableState,
      abortSet: abortSet,
      keyPath: keyPath,
      formatContext: formatContext,
      legacyContext: legacyContext,
      context: context,
      treeContext: treeContext,
      componentStack: componentStack,
      thenableState: thenableState,
      isFallback: isFallback
    };
    abortSet.add(task);
    return task;
  }

  function createPendingSegment(request, index, boundary, parentFormatContext, lastPushedText, textEmbedded) {
    return {
      status: PENDING,
      id: -1,
      // lazily assigned later
      index: index,
      parentFlushed: false,
      chunks: [],
      children: [],
      parentFormatContext: parentFormatContext,
      boundary: boundary,
      lastPushedText: lastPushedText,
      textEmbedded: textEmbedded
    };
  } // DEV-only global reference to the currently executing task


  var currentTaskInDEV = null;

  function getCurrentStackInDEV() {
    {
      if (currentTaskInDEV === null || currentTaskInDEV.componentStack === null) {
        return '';
      }

      return getStackByComponentStackNode(currentTaskInDEV.componentStack);
    }
  }

  function getStackFromNode(stackNode) {
    return getStackByComponentStackNode(stackNode);
  }

  function createBuiltInComponentStack(task, type) {
    return {
      tag: 0,
      parent: task.componentStack,
      type: type
    };
  }

  function createFunctionComponentStack(task, type) {
    return {
      tag: 1,
      parent: task.componentStack,
      type: type
    };
  }

  function createClassComponentStack(task, type) {
    return {
      tag: 2,
      parent: task.componentStack,
      type: type
    };
  } // While we track component stacks in prod all the time we only produce a reified stack in dev and
  // during prerender in Prod. The reason for this is that the stack is useful for prerender where the timeliness
  // of the request is less critical than the observability of the execution. For renders and resumes however we
  // prioritize speed of the request.


  function getThrownInfo(request, node) {
    if (node && ( // Always produce a stack in dev
    true )) {
      return {
        componentStack: getStackFromNode(node)
      };
    } else {
      return {};
    }
  }

  function encodeErrorForBoundary(boundary, digest, error, thrownInfo) {
    boundary.errorDigest = digest;

    {
      var message; // In dev we additionally encode the error message and component stack on the boundary

      if (error instanceof Error) {
        // eslint-disable-next-line react-internal/safe-string-coercion
        message = String(error.message);
      } else if (typeof error === 'object' && error !== null) {
        message = describeObjectForErrorMessage(error);
      } else {
        // eslint-disable-next-line react-internal/safe-string-coercion
        message = String(error);
      }

      boundary.errorMessage = message;
      boundary.errorComponentStack = thrownInfo.componentStack;
    }
  }

  function logPostpone(request, reason, postponeInfo) {
    // If this callback errors, we intentionally let that error bubble up to become a fatal error
    // so that someone fixes the error reporting instead of hiding it.
    request.onPostpone(reason, postponeInfo);
  }

  function logRecoverableError(request, error$1, errorInfo) {
    // If this callback errors, we intentionally let that error bubble up to become a fatal error
    // so that someone fixes the error reporting instead of hiding it.
    var errorDigest = request.onError(error$1, errorInfo);

    if (errorDigest != null && typeof errorDigest !== 'string') {
      // We used to throw here but since this gets called from a variety of unprotected places it
      // seems better to just warn and discard the returned value.
      {
        error('onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "%s" instead', typeof errorDigest);
      }

      return;
    }

    return errorDigest;
  }

  function fatalError(request, error) {
    // This is called outside error handling code such as if the root errors outside
    // a suspense boundary or if the root suspense boundary's fallback errors.
    // It's also called if React itself or its host configs errors.
    var onShellError = request.onShellError;
    onShellError(error);
    var onFatalError = request.onFatalError;
    onFatalError(error);

    if (request.destination !== null) {
      request.status = CLOSED;
      closeWithError(request.destination, error);
    } else {
      request.status = CLOSING;
      request.fatalError = error;
    }
  }

  function renderSuspenseBoundary(request, someTask, keyPath, props) {
    if (someTask.replay !== null) {
      // If we're replaying through this pass, it means we're replaying through
      // an already completed Suspense boundary. It's too late to do anything about it
      // so we can just render through it.
      var _prevKeyPath = someTask.keyPath;
      someTask.keyPath = keyPath;
      var _content = props.children;

      try {
        renderNode(request, someTask, _content, -1);
      } finally {
        someTask.keyPath = _prevKeyPath;
      }

      return;
    } // $FlowFixMe: Refined.


    var task = someTask;
    var previousComponentStack = task.componentStack; // If we end up creating the fallback task we need it to have the correct stack which is
    // the stack for the boundary itself. We stash it here so we can use it if needed later

    var suspenseComponentStack = task.componentStack = createBuiltInComponentStack(task, 'Suspense');
    var prevKeyPath = task.keyPath;
    var parentBoundary = task.blockedBoundary;
    var parentHoistableState = task.hoistableState;
    var parentSegment = task.blockedSegment; // Each time we enter a suspense boundary, we split out into a new segment for
    // the fallback so that we can later replace that segment with the content.
    // This also lets us split out the main content even if it doesn't suspend,
    // in case it ends up generating a large subtree of content.

    var fallback = props.fallback;
    var content = props.children;
    var fallbackAbortSet = new Set();
    var newBoundary = createSuspenseBoundary(request, fallbackAbortSet);

    if (request.trackedPostpones !== null) {
      newBoundary.trackedContentKeyPath = keyPath;
    }

    var insertionIndex = parentSegment.chunks.length; // The children of the boundary segment is actually the fallback.

    var boundarySegment = createPendingSegment(request, insertionIndex, newBoundary, task.formatContext, // boundaries never require text embedding at their edges because comment nodes bound them
    false, false);
    parentSegment.children.push(boundarySegment); // The parentSegment has a child Segment at this index so we reset the lastPushedText marker on the parent

    parentSegment.lastPushedText = false; // This segment is the actual child content. We can start rendering that immediately.

    var contentRootSegment = createPendingSegment(request, 0, null, task.formatContext, // boundaries never require text embedding at their edges because comment nodes bound them
    false, false); // We mark the root segment as having its parent flushed. It's not really flushed but there is
    // no parent segment so there's nothing to wait on.

    contentRootSegment.parentFlushed = true; // Currently this is running synchronously. We could instead schedule this to pingedTasks.
    // I suspect that there might be some efficiency benefits from not creating the suspended task
    // and instead just using the stack if possible.
    // TODO: Call this directly instead of messing with saving and restoring contexts.
    // We can reuse the current context and task to render the content immediately without
    // context switching. We just need to temporarily switch which boundary and which segment
    // we're writing to. If something suspends, it'll spawn new suspended task with that context.

    task.blockedBoundary = newBoundary;
    task.hoistableState = newBoundary.contentState;
    task.blockedSegment = contentRootSegment;
    task.keyPath = keyPath;

    try {
      // We use the safe form because we don't handle suspending here. Only error handling.
      renderNode(request, task, content, -1);
      pushSegmentFinale(contentRootSegment.chunks, request.renderState, contentRootSegment.lastPushedText, contentRootSegment.textEmbedded);
      contentRootSegment.status = COMPLETED;
      queueCompletedSegment(newBoundary, contentRootSegment);

      if (newBoundary.pendingTasks === 0 && newBoundary.status === PENDING) {
        // This must have been the last segment we were waiting on. This boundary is now complete.
        // Therefore we won't need the fallback. We early return so that we don't have to create
        // the fallback.
        newBoundary.status = COMPLETED; // We are returning early so we need to restore the

        task.componentStack = previousComponentStack;
        return;
      }
    } catch (error) {
      contentRootSegment.status = ERRORED;
      newBoundary.status = CLIENT_RENDERED;
      var thrownInfo = getThrownInfo(request, task.componentStack);
      var errorDigest;

      if (typeof error === 'object' && error !== null && error.$$typeof === REACT_POSTPONE_TYPE) {
        var postponeInstance = error;
        logPostpone(request, postponeInstance.message, thrownInfo); // TODO: Figure out a better signal than a magic digest value.

        errorDigest = 'POSTPONE';
      } else {
        errorDigest = logRecoverableError(request, error, thrownInfo);
      }

      encodeErrorForBoundary(newBoundary, errorDigest, error, thrownInfo);
      untrackBoundary(request, newBoundary); // We don't need to decrement any task numbers because we didn't spawn any new task.
      // We don't need to schedule any task because we know the parent has written yet.
      // We do need to fallthrough to create the fallback though.
    } finally {
      task.blockedBoundary = parentBoundary;
      task.hoistableState = parentHoistableState;
      task.blockedSegment = parentSegment;
      task.keyPath = prevKeyPath;
      task.componentStack = previousComponentStack;
    }

    var fallbackKeyPath = [keyPath[0], 'Suspense Fallback', keyPath[2]];
    var trackedPostpones = request.trackedPostpones;

    if (trackedPostpones !== null) {
      // We create a detached replay node to track any postpones inside the fallback.
      var fallbackReplayNode = [fallbackKeyPath[1], fallbackKeyPath[2], [], null];
      trackedPostpones.workingMap.set(fallbackKeyPath, fallbackReplayNode);

      if (newBoundary.status === POSTPONED) {
        // This must exist now.
        var boundaryReplayNode = trackedPostpones.workingMap.get(keyPath);
        boundaryReplayNode[4] = fallbackReplayNode;
      } else {
        // We might not inject it into the postponed tree, unless the content actually
        // postpones too. We need to keep track of it until that happpens.
        newBoundary.trackedFallbackNode = fallbackReplayNode;
      }
    } // We create suspended task for the fallback because we don't want to actually work
    // on it yet in case we finish the main content, so we queue for later.


    var suspendedFallbackTask = createRenderTask(request, null, fallback, -1, parentBoundary, boundarySegment, newBoundary.fallbackState, fallbackAbortSet, fallbackKeyPath, task.formatContext, task.legacyContext, task.context, task.treeContext, // This stack should be the Suspense boundary stack because while the fallback is actually a child segment
    // of the parent boundary from a component standpoint the fallback is a child of the Suspense boundary itself
    suspenseComponentStack, true); // TODO: This should be queued at a separate lower priority queue so that we only work
    // on preparing fallbacks if we don't have any more main content to task on.

    request.pingedTasks.push(suspendedFallbackTask);
  }

  function replaySuspenseBoundary(request, task, keyPath, props, id, childNodes, childSlots, fallbackNodes, fallbackSlots) {
    var previousComponentStack = task.componentStack; // If we end up creating the fallback task we need it to have the correct stack which is
    // the stack for the boundary itself. We stash it here so we can use it if needed later

    var suspenseComponentStack = task.componentStack = createBuiltInComponentStack(task, 'Suspense');
    var prevKeyPath = task.keyPath;
    var previousReplaySet = task.replay;
    var parentBoundary = task.blockedBoundary;
    var parentHoistableState = task.hoistableState;
    var content = props.children;
    var fallback = props.fallback;
    var fallbackAbortSet = new Set();
    var resumedBoundary = createSuspenseBoundary(request, fallbackAbortSet);
    resumedBoundary.parentFlushed = true; // We restore the same id of this boundary as was used during prerender.

    resumedBoundary.rootSegmentID = id; // We can reuse the current context and task to render the content immediately without
    // context switching. We just need to temporarily switch which boundary and replay node
    // we're writing to. If something suspends, it'll spawn new suspended task with that context.

    task.blockedBoundary = resumedBoundary;
    task.hoistableState = resumedBoundary.contentState;
    task.replay = {
      nodes: childNodes,
      slots: childSlots,
      pendingTasks: 1
    };

    try {
      // We use the safe form because we don't handle suspending here. Only error handling.
      renderNode(request, task, content, -1);

      if (task.replay.pendingTasks === 1 && task.replay.nodes.length > 0) {
        throw new Error("Couldn't find all resumable slots by key/index during replaying. " + "The tree doesn't match so React will fallback to client rendering.");
      }

      task.replay.pendingTasks--;

      if (resumedBoundary.pendingTasks === 0 && resumedBoundary.status === PENDING) {
        // This must have been the last segment we were waiting on. This boundary is now complete.
        // Therefore we won't need the fallback. We early return so that we don't have to create
        // the fallback.
        resumedBoundary.status = COMPLETED;
        request.completedBoundaries.push(resumedBoundary); // We restore the parent componentStack. Semantically this is the same as
        // popComponentStack(task) but we do this instead because it should be slightly
        // faster

        return;
      }
    } catch (error) {
      resumedBoundary.status = CLIENT_RENDERED;
      var thrownInfo = getThrownInfo(request, task.componentStack);
      var errorDigest;

      if (typeof error === 'object' && error !== null && error.$$typeof === REACT_POSTPONE_TYPE) {
        var postponeInstance = error;
        logPostpone(request, postponeInstance.message, thrownInfo); // TODO: Figure out a better signal than a magic digest value.

        errorDigest = 'POSTPONE';
      } else {
        errorDigest = logRecoverableError(request, error, thrownInfo);
      }

      encodeErrorForBoundary(resumedBoundary, errorDigest, error, thrownInfo);
      task.replay.pendingTasks--; // The parent already flushed in the prerender so we need to schedule this to be emitted.

      request.clientRenderedBoundaries.push(resumedBoundary); // We don't need to decrement any task numbers because we didn't spawn any new task.
      // We don't need to schedule any task because we know the parent has written yet.
      // We do need to fallthrough to create the fallback though.
    } finally {
      task.blockedBoundary = parentBoundary;
      task.hoistableState = parentHoistableState;
      task.replay = previousReplaySet;
      task.keyPath = prevKeyPath;
      task.componentStack = previousComponentStack;
    }

    var fallbackKeyPath = [keyPath[0], 'Suspense Fallback', keyPath[2]]; // We create suspended task for the fallback because we don't want to actually work
    // on it yet in case we finish the main content, so we queue for later.

    var fallbackReplay = {
      nodes: fallbackNodes,
      slots: fallbackSlots,
      pendingTasks: 0
    };
    var suspendedFallbackTask = createReplayTask(request, null, fallbackReplay, fallback, -1, parentBoundary, resumedBoundary.fallbackState, fallbackAbortSet, fallbackKeyPath, task.formatContext, task.legacyContext, task.context, task.treeContext, // This stack should be the Suspense boundary stack because while the fallback is actually a child segment
    // of the parent boundary from a component standpoint the fallback is a child of the Suspense boundary itself
    suspenseComponentStack, true); // TODO: This should be queued at a separate lower priority queue so that we only work
    // on preparing fallbacks if we don't have any more main content to task on.

    request.pingedTasks.push(suspendedFallbackTask);
  }

  function renderHostElement(request, task, keyPath, type, props) {
    var previousComponentStack = task.componentStack;
    task.componentStack = createBuiltInComponentStack(task, type);
    var segment = task.blockedSegment;

    if (segment === null) {
      // Replay
      var children = props.children; // TODO: Make this a Config for replaying.

      var prevContext = task.formatContext;
      var prevKeyPath = task.keyPath;
      task.formatContext = getChildFormatContext(prevContext, type, props);
      task.keyPath = keyPath; // We use the non-destructive form because if something suspends, we still
      // need to pop back up and finish this subtree of HTML.

      renderNode(request, task, children, -1); // We expect that errors will fatal the whole task and that we don't need
      // the correct context. Therefore this is not in a finally.

      task.formatContext = prevContext;
      task.keyPath = prevKeyPath;
    } else {
      // Render
      var _children = pushStartInstance(segment.chunks, type, props, request.resumableState, request.renderState, task.hoistableState, task.formatContext, segment.lastPushedText, task.isFallback);

      segment.lastPushedText = false;
      var _prevContext = task.formatContext;
      var _prevKeyPath2 = task.keyPath;
      task.formatContext = getChildFormatContext(_prevContext, type, props);
      task.keyPath = keyPath; // We use the non-destructive form because if something suspends, we still
      // need to pop back up and finish this subtree of HTML.

      renderNode(request, task, _children, -1); // We expect that errors will fatal the whole task and that we don't need
      // the correct context. Therefore this is not in a finally.

      task.formatContext = _prevContext;
      task.keyPath = _prevKeyPath2;
      pushEndInstance(segment.chunks, type, props, request.resumableState, _prevContext);
      segment.lastPushedText = false;
    }

    task.componentStack = previousComponentStack;
  }

  function shouldConstruct(Component) {
    return Component.prototype && Component.prototype.isReactComponent;
  }

  function renderWithHooks(request, task, keyPath, Component, props, secondArg) {
    // Reset the task's thenable state before continuing, so that if a later
    // component suspends we can reuse the same task object. If the same
    // component suspends again, the thenable state will be restored.
    var prevThenableState = task.thenableState;
    task.thenableState = null;
    var componentIdentity = {};
    prepareToUseHooks(request, task, keyPath, componentIdentity, prevThenableState);
    var result = Component(props, secondArg);
    return finishHooks(Component, props, result, secondArg);
  }

  function finishClassComponent(request, task, keyPath, instance, Component, props) {
    var nextChildren = instance.render();

    {
      if (instance.props !== props) {
        if (!didWarnAboutReassigningProps) {
          error('It looks like %s is reassigning its own `this.props` while rendering. ' + 'This is not supported and can lead to confusing bugs.', getComponentNameFromType(Component) || 'a component');
        }

        didWarnAboutReassigningProps = true;
      }
    }

    {
      var childContextTypes = Component.childContextTypes;

      if (childContextTypes !== null && childContextTypes !== undefined) {
        var previousContext = task.legacyContext;
        var mergedContext = processChildContext(instance, Component, previousContext, childContextTypes);
        task.legacyContext = mergedContext;
        renderNodeDestructive(request, task, nextChildren, -1);
        task.legacyContext = previousContext;
        return;
      }
    }

    var prevKeyPath = task.keyPath;
    task.keyPath = keyPath;
    renderNodeDestructive(request, task, nextChildren, -1);
    task.keyPath = prevKeyPath;
  }

  function renderClassComponent(request, task, keyPath, Component, props) {
    var previousComponentStack = task.componentStack;
    task.componentStack = createClassComponentStack(task, Component);
    var maskedContext = getMaskedContext(Component, task.legacyContext) ;
    var instance = constructClassInstance(Component, props, maskedContext);
    mountClassInstance(instance, Component, props, maskedContext);
    finishClassComponent(request, task, keyPath, instance, Component, props);
    task.componentStack = previousComponentStack;
  }

  var didWarnAboutBadClass = {};
  var didWarnAboutModulePatternComponent = {};
  var didWarnAboutContextTypeOnFunctionComponent = {};
  var didWarnAboutGetDerivedStateOnFunctionComponent = {};
  var didWarnAboutReassigningProps = false;
  var didWarnAboutDefaultPropsOnFunctionComponent = {};
  var didWarnAboutGenerators = false;
  var didWarnAboutMaps = false; // This would typically be a function component but we still support module pattern
  // components for some reason.

  function renderIndeterminateComponent(request, task, keyPath, Component, props) {
    var legacyContext;

    {
      legacyContext = getMaskedContext(Component, task.legacyContext);
    }

    var previousComponentStack = task.componentStack;
    task.componentStack = createFunctionComponentStack(task, Component);

    {
      if (Component.prototype && typeof Component.prototype.render === 'function') {
        var componentName = getComponentNameFromType(Component) || 'Unknown';

        if (!didWarnAboutBadClass[componentName]) {
          error("The <%s /> component appears to have a render method, but doesn't extend React.Component. " + 'This is likely to cause errors. Change %s to extend React.Component instead.', componentName, componentName);

          didWarnAboutBadClass[componentName] = true;
        }
      }
    }

    var value = renderWithHooks(request, task, keyPath, Component, props, legacyContext);
    var hasId = checkDidRenderIdHook();
    var formStateCount = getFormStateCount();
    var formStateMatchingIndex = getFormStateMatchingIndex();

    {
      // Support for module components is deprecated and is removed behind a flag.
      // Whether or not it would crash later, we want to show a good message in DEV first.
      if (typeof value === 'object' && value !== null && typeof value.render === 'function' && value.$$typeof === undefined) {
        var _componentName = getComponentNameFromType(Component) || 'Unknown';

        if (!didWarnAboutModulePatternComponent[_componentName]) {
          error('The <%s /> component appears to be a function component that returns a class instance. ' + 'Change %s to a class that extends React.Component instead. ' + "If you can't use a class try assigning the prototype on the function as a workaround. " + "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " + 'cannot be called with `new` by React.', _componentName, _componentName, _componentName);

          didWarnAboutModulePatternComponent[_componentName] = true;
        }
      }
    }

    if ( // Run these checks in production only if the flag is off.
    // Eventually we'll delete this branch altogether.
    typeof value === 'object' && value !== null && typeof value.render === 'function' && value.$$typeof === undefined) {
      {
        var _componentName2 = getComponentNameFromType(Component) || 'Unknown';

        if (!didWarnAboutModulePatternComponent[_componentName2]) {
          error('The <%s /> component appears to be a function component that returns a class instance. ' + 'Change %s to a class that extends React.Component instead. ' + "If you can't use a class try assigning the prototype on the function as a workaround. " + "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " + 'cannot be called with `new` by React.', _componentName2, _componentName2, _componentName2);

          didWarnAboutModulePatternComponent[_componentName2] = true;
        }
      }

      mountClassInstance(value, Component, props, legacyContext);
      finishClassComponent(request, task, keyPath, value, Component, props);
    } else {

      {
        validateFunctionComponentInDev(Component);
      }

      finishFunctionComponent(request, task, keyPath, value, hasId, formStateCount, formStateMatchingIndex);
    }

    task.componentStack = previousComponentStack;
  }

  function finishFunctionComponent(request, task, keyPath, children, hasId, formStateCount, formStateMatchingIndex) {
    var didEmitFormStateMarkers = false;

    if (formStateCount !== 0 && request.formState !== null) {
      // For each useFormState hook, emit a marker that indicates whether we
      // rendered using the form state passed at the root. We only emit these
      // markers if form state is passed at the root.
      var segment = task.blockedSegment;

      if (segment === null) ; else {
        didEmitFormStateMarkers = true;
        var target = segment.chunks;

        for (var i = 0; i < formStateCount; i++) {
          if (i === formStateMatchingIndex) {
            pushFormStateMarkerIsMatching(target);
          } else {
            pushFormStateMarkerIsNotMatching(target);
          }
        }
      }
    }

    var prevKeyPath = task.keyPath;
    task.keyPath = keyPath;

    if (hasId) {
      // This component materialized an id. We treat this as its own level, with
      // a single "child" slot.
      var prevTreeContext = task.treeContext;
      var totalChildren = 1;
      var index = 0; // Modify the id context. Because we'll need to reset this if something
      // suspends or errors, we'll use the non-destructive render path.

      task.treeContext = pushTreeContext(prevTreeContext, totalChildren, index);
      renderNode(request, task, children, -1); // Like the other contexts, this does not need to be in a finally block
      // because renderNode takes care of unwinding the stack.

      task.treeContext = prevTreeContext;
    } else if (didEmitFormStateMarkers) {
      // If there were formState hooks, we must use the non-destructive path
      // because this component is not a pure indirection; we emitted markers
      // to the stream.
      renderNode(request, task, children, -1);
    } else {
      // We're now successfully past this task, and we haven't modified the
      // context stack. We don't have to pop back to the previous task every
      // again, so we can use the destructive recursive form.
      renderNodeDestructive(request, task, children, -1);
    }

    task.keyPath = prevKeyPath;
  }

  function validateFunctionComponentInDev(Component) {
    {
      if (Component) {
        if (Component.childContextTypes) {
          error('childContextTypes cannot be defined on a function component.\n' + '  %s.childContextTypes = ...', Component.displayName || Component.name || 'Component');
        }
      }

      if (Component.defaultProps !== undefined) {
        var componentName = getComponentNameFromType(Component) || 'Unknown';

        if (!didWarnAboutDefaultPropsOnFunctionComponent[componentName]) {
          error('%s: Support for defaultProps will be removed from function components ' + 'in a future major release. Use JavaScript default parameters instead.', componentName);

          didWarnAboutDefaultPropsOnFunctionComponent[componentName] = true;
        }
      }

      if (typeof Component.getDerivedStateFromProps === 'function') {
        var _componentName3 = getComponentNameFromType(Component) || 'Unknown';

        if (!didWarnAboutGetDerivedStateOnFunctionComponent[_componentName3]) {
          error('%s: Function components do not support getDerivedStateFromProps.', _componentName3);

          didWarnAboutGetDerivedStateOnFunctionComponent[_componentName3] = true;
        }
      }

      if (typeof Component.contextType === 'object' && Component.contextType !== null) {
        var _componentName4 = getComponentNameFromType(Component) || 'Unknown';

        if (!didWarnAboutContextTypeOnFunctionComponent[_componentName4]) {
          error('%s: Function components do not support contextType.', _componentName4);

          didWarnAboutContextTypeOnFunctionComponent[_componentName4] = true;
        }
      }
    }
  }

  function resolveDefaultProps(Component, baseProps) {
    if (Component && Component.defaultProps) {
      // Resolve default props. Taken from ReactElement
      var props = assign({}, baseProps);
      var defaultProps = Component.defaultProps;

      for (var propName in defaultProps) {
        if (props[propName] === undefined) {
          props[propName] = defaultProps[propName];
        }
      }

      return props;
    }

    return baseProps;
  }

  function renderForwardRef(request, task, keyPath, type, props, ref) {
    var previousComponentStack = task.componentStack;
    task.componentStack = createFunctionComponentStack(task, type.render);
    var propsWithoutRef;

    if ('ref' in props) {
      // `ref` is just a prop now, but `forwardRef` expects it to not appear in
      // the props object. This used to happen in the JSX runtime, but now we do
      // it here.
      propsWithoutRef = {};

      for (var key in props) {
        // Since `ref` should only appear in props via the JSX transform, we can
        // assume that this is a plain object. So we don't need a
        // hasOwnProperty check.
        if (key !== 'ref') {
          propsWithoutRef[key] = props[key];
        }
      }
    } else {
      propsWithoutRef = props;
    }

    var children = renderWithHooks(request, task, keyPath, type.render, propsWithoutRef, ref);
    var hasId = checkDidRenderIdHook();
    var formStateCount = getFormStateCount();
    var formStateMatchingIndex = getFormStateMatchingIndex();
    finishFunctionComponent(request, task, keyPath, children, hasId, formStateCount, formStateMatchingIndex);
    task.componentStack = previousComponentStack;
  }

  function renderMemo(request, task, keyPath, type, props, ref) {
    var innerType = type.type;
    var resolvedProps = resolveDefaultProps(innerType, props);
    renderElement(request, task, keyPath, innerType, resolvedProps, ref);
  }

  function renderContextConsumer(request, task, keyPath, context, props) {
    var render = props.children;

    {
      if (typeof render !== 'function') {
        error('A context consumer was rendered with multiple children, or a child ' + "that isn't a function. A context consumer expects a single child " + 'that is a function. If you did pass a function, make sure there ' + 'is no trailing or leading whitespace around it.');
      }
    }

    var newValue = readContext$1(context);
    var newChildren = render(newValue);
    var prevKeyPath = task.keyPath;
    task.keyPath = keyPath;
    renderNodeDestructive(request, task, newChildren, -1);
    task.keyPath = prevKeyPath;
  }

  function renderContextProvider(request, task, keyPath, context, props) {
    var value = props.value;
    var children = props.children;
    var prevSnapshot;

    {
      prevSnapshot = task.context;
    }

    var prevKeyPath = task.keyPath;
    task.context = pushProvider(context, value);
    task.keyPath = keyPath;
    renderNodeDestructive(request, task, children, -1);
    task.context = popProvider(context);
    task.keyPath = prevKeyPath;

    {
      if (prevSnapshot !== task.context) {
        error('Popping the context provider did not return back to the original snapshot. This is a bug in React.');
      }
    }
  }

  function renderLazyComponent(request, task, keyPath, lazyComponent, props, ref) {
    var previousComponentStack = task.componentStack;
    task.componentStack = createBuiltInComponentStack(task, 'Lazy');
    var payload = lazyComponent._payload;
    var init = lazyComponent._init;
    var Component = init(payload);
    var resolvedProps = resolveDefaultProps(Component, props);
    renderElement(request, task, keyPath, Component, resolvedProps, ref);
    task.componentStack = previousComponentStack;
  }

  function renderOffscreen(request, task, keyPath, props) {
    var mode = props.mode;

    if (mode === 'hidden') ; else {
      // A visible Offscreen boundary is treated exactly like a fragment: a
      // pure indirection.
      var prevKeyPath = task.keyPath;
      task.keyPath = keyPath;
      renderNodeDestructive(request, task, props.children, -1);
      task.keyPath = prevKeyPath;
    }
  }

  function renderElement(request, task, keyPath, type, props, ref) {
    if (typeof type === 'function') {
      if (shouldConstruct(type)) {
        renderClassComponent(request, task, keyPath, type, props);
        return;
      } else {
        renderIndeterminateComponent(request, task, keyPath, type, props);
        return;
      }
    }

    if (typeof type === 'string') {
      renderHostElement(request, task, keyPath, type, props);
      return;
    }

    switch (type) {
      // LegacyHidden acts the same as a fragment. This only works because we
      // currently assume that every instance of LegacyHidden is accompanied by a
      // host component wrapper. In the hidden mode, the host component is given a
      // `hidden` attribute, which ensures that the initial HTML is not visible.
      // To support the use of LegacyHidden as a true fragment, without an extra
      // DOM node, we would have to hide the initial HTML in some other way.
      // TODO: Delete in LegacyHidden. It's an unstable API only used in the
      // www build. As a migration step, we could add a special prop to Offscreen
      // that simulates the old behavior (no hiding, no change to effects).
      case REACT_LEGACY_HIDDEN_TYPE:
      case REACT_DEBUG_TRACING_MODE_TYPE:
      case REACT_STRICT_MODE_TYPE:
      case REACT_PROFILER_TYPE:
      case REACT_FRAGMENT_TYPE:
        {
          var prevKeyPath = task.keyPath;
          task.keyPath = keyPath;
          renderNodeDestructive(request, task, props.children, -1);
          task.keyPath = prevKeyPath;
          return;
        }

      case REACT_OFFSCREEN_TYPE:
        {
          renderOffscreen(request, task, keyPath, props);
          return;
        }

      case REACT_SUSPENSE_LIST_TYPE:
        {
          var preiousComponentStack = task.componentStack;
          task.componentStack = createBuiltInComponentStack(task, 'SuspenseList'); // TODO: SuspenseList should control the boundaries.

          var _prevKeyPath3 = task.keyPath;
          task.keyPath = keyPath;
          renderNodeDestructive(request, task, props.children, -1);
          task.keyPath = _prevKeyPath3;
          task.componentStack = preiousComponentStack;
          return;
        }

      case REACT_SCOPE_TYPE:
        {

          throw new Error('ReactDOMServer does not yet support scope components.');
        }

      case REACT_SUSPENSE_TYPE:
        {
          {
            renderSuspenseBoundary(request, task, keyPath, props);
          }

          return;
        }
    }

    if (typeof type === 'object' && type !== null) {
      switch (type.$$typeof) {
        case REACT_FORWARD_REF_TYPE:
          {
            renderForwardRef(request, task, keyPath, type, props, ref);
            return;
          }

        case REACT_MEMO_TYPE:
          {
            renderMemo(request, task, keyPath, type, props, ref);
            return;
          }

        case REACT_PROVIDER_TYPE:
          {
            {
              var context = type._context;
              renderContextProvider(request, task, keyPath, context, props);
              return;
            } // Fall through

          }

        case REACT_CONTEXT_TYPE:
          {
            {
              var _context2 = type;

              {
                if (_context2._context !== undefined) {
                  _context2 = _context2._context;
                }
              }

              renderContextConsumer(request, task, keyPath, _context2, props);
              return;
            }
          }

        case REACT_CONSUMER_TYPE:

        case REACT_LAZY_TYPE:
          {
            renderLazyComponent(request, task, keyPath, type, props);
            return;
          }
      }
    }

    var info = '';

    {
      if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
        info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and " + 'named imports.';
      }
    }

    throw new Error('Element type is invalid: expected a string (for built-in ' + 'components) or a class/function (for composite components) ' + ("but got: " + (type == null ? type : typeof type) + "." + info));
  }

  function resumeNode(request, task, segmentId, node, childIndex) {
    var prevReplay = task.replay;
    var blockedBoundary = task.blockedBoundary;
    var resumedSegment = createPendingSegment(request, 0, null, task.formatContext, false, false);
    resumedSegment.id = segmentId;
    resumedSegment.parentFlushed = true;

    try {
      // Convert the current ReplayTask to a RenderTask.
      var renderTask = task;
      renderTask.replay = null;
      renderTask.blockedSegment = resumedSegment;
      renderNode(request, task, node, childIndex);
      resumedSegment.status = COMPLETED;

      if (blockedBoundary === null) {
        request.completedRootSegment = resumedSegment;
      } else {
        queueCompletedSegment(blockedBoundary, resumedSegment);

        if (blockedBoundary.parentFlushed) {
          request.partialBoundaries.push(blockedBoundary);
        }
      }
    } finally {
      // Restore to a ReplayTask.
      task.replay = prevReplay;
      task.blockedSegment = null;
    }
  }

  function replayElement(request, task, keyPath, name, keyOrIndex, childIndex, type, props, ref, replay) {
    // We're replaying. Find the path to follow.
    var replayNodes = replay.nodes;

    for (var i = 0; i < replayNodes.length; i++) {
      // Flow doesn't support refinement on tuples so we do it manually here.
      var node = replayNodes[i];

      if (keyOrIndex !== node[1]) {
        continue;
      }

      if (node.length === 4) {
        // Matched a replayable path.
        // Let's double check that the component name matches as a precaution.
        if (name !== null && name !== node[0]) {
          throw new Error('Expected the resume to render <' + node[0] + '> in this slot but instead it rendered <' + name + '>. ' + "The tree doesn't match so React will fallback to client rendering.");
        }

        var childNodes = node[2];
        var childSlots = node[3];
        var currentNode = task.node;
        task.replay = {
          nodes: childNodes,
          slots: childSlots,
          pendingTasks: 1
        };

        try {
          renderElement(request, task, keyPath, type, props, ref);

          if (task.replay.pendingTasks === 1 && task.replay.nodes.length > 0 // TODO check remaining slots
          ) {
              throw new Error("Couldn't find all resumable slots by key/index during replaying. " + "The tree doesn't match so React will fallback to client rendering.");
            }

          task.replay.pendingTasks--;
        } catch (x) {
          if (typeof x === 'object' && x !== null && (x === SuspenseException || typeof x.then === 'function')) {
            // Suspend
            if (task.node === currentNode) {
              // This same element suspended so we need to pop the replay we just added.
              task.replay = replay;
            }

            throw x;
          }

          task.replay.pendingTasks--; // Unlike regular render, we don't terminate the siblings if we error
          // during a replay. That's because this component didn't actually error
          // in the original prerender. What's unable to complete is the child
          // replay nodes which might be Suspense boundaries which are able to
          // absorb the error and we can still continue with siblings.

          var thrownInfo = getThrownInfo(request, task.componentStack);
          erroredReplay(request, task.blockedBoundary, x, thrownInfo, childNodes, childSlots);
        }

        task.replay = replay;
      } else {
        // Let's double check that the component type matches.
        if (type !== REACT_SUSPENSE_TYPE) {
          var expectedType = 'Suspense';
          throw new Error('Expected the resume to render <' + expectedType + '> in this slot but instead it rendered <' + (getComponentNameFromType(type) || 'Unknown') + '>. ' + "The tree doesn't match so React will fallback to client rendering.");
        } // Matched a replayable path.


        replaySuspenseBoundary(request, task, keyPath, props, node[5], node[2], node[3], node[4] === null ? [] : node[4][2], node[4] === null ? null : node[4][3]);
      } // We finished rendering this node, so now we can consume this
      // slot. This must happen after in case we rerender this task.


      replayNodes.splice(i, 1);
      return;
    } // We didn't find any matching nodes. We assume that this element was already
    // rendered in the prelude and skip it.

  } // $FlowFixMe[missing-local-annot]


  function validateIterable(iterable, iteratorFn) {
    {
      // We don't support rendering Generators because it's a mutation.
      // See https://github.com/facebook/react/issues/12995
      if (typeof Symbol === 'function' && iterable[Symbol.toStringTag] === 'Generator') {
        if (!didWarnAboutGenerators) {
          error('Using Generators as children is unsupported and will likely yield ' + 'unexpected results because enumerating a generator mutates it. ' + 'You may convert it to an array with `Array.from()` or the ' + '`[...spread]` operator before rendering. Keep in mind ' + 'you might need to polyfill these features for older browsers.');
        }

        didWarnAboutGenerators = true;
      } // Warn about using Maps as children


      if (iterable.entries === iteratorFn) {
        if (!didWarnAboutMaps) {
          error('Using Maps as children is not supported. ' + 'Use an array of keyed ReactElements instead.');
        }

        didWarnAboutMaps = true;
      }
    }
  }

  function warnOnFunctionType(invalidChild) {
    {
      var name = invalidChild.displayName || invalidChild.name || 'Component';

      error('Functions are not valid as a React child. This may happen if ' + 'you return %s instead of <%s /> from render. ' + 'Or maybe you meant to call this function rather than return it.', name, name);
    }
  }

  function warnOnSymbolType(invalidChild) {
    {
      // eslint-disable-next-line react-internal/safe-string-coercion
      var name = String(invalidChild);

      error('Symbols are not valid as a React child.\n' + '  %s', name);
    }
  } // This function by it self renders a node and consumes the task by mutating it
  // to update the current execution state.


  function renderNodeDestructive(request, task, node, childIndex) {
    if (task.replay !== null && typeof task.replay.slots === 'number') {
      // TODO: Figure out a cheaper place than this hot path to do this check.
      var resumeSegmentID = task.replay.slots;
      resumeNode(request, task, resumeSegmentID, node, childIndex);
      return;
    } // Stash the node we're working on. We'll pick up from this task in case
    // something suspends.


    task.node = node;
    task.childIndex = childIndex;

    if (node === null) {
      return;
    } // Handle object types


    if (typeof node === 'object') {
      switch (node.$$typeof) {
        case REACT_ELEMENT_TYPE:
          {
            var element = node;
            var type = element.type;
            var key = element.key;
            var props = element.props;
            var ref;

            {
              // TODO: This is a temporary, intermediate step. Once the feature
              // flag is removed, we should get the ref off the props object right
              // before using it.
              var refProp = props.ref;
              ref = refProp !== undefined ? refProp : null;
            }

            var name = getComponentNameFromType(type);
            var keyOrIndex = key == null ? childIndex === -1 ? 0 : childIndex : key;
            var keyPath = [task.keyPath, name, keyOrIndex];

            if (task.replay !== null) {
              replayElement(request, task, keyPath, name, keyOrIndex, childIndex, type, props, ref, task.replay); // No matches found for this node. We assume it's already emitted in the
              // prelude and skip it during the replay.
            } else {
              // We're doing a plain render.
              renderElement(request, task, keyPath, type, props, ref);
            }

            return;
          }

        case REACT_PORTAL_TYPE:
          throw new Error('Portals are not currently supported by the server renderer. ' + 'Render them conditionally so that they only appear on the client render.');

        case REACT_LAZY_TYPE:
          {
            var previousComponentStack = task.componentStack;
            task.componentStack = createBuiltInComponentStack(task, 'Lazy');
            var lazyNode = node;
            var payload = lazyNode._payload;
            var init = lazyNode._init;
            var resolvedNode = init(payload); // We restore the stack before rendering the resolved node because once the Lazy
            // has resolved any future errors

            task.componentStack = previousComponentStack; // Now we render the resolved node

            renderNodeDestructive(request, task, resolvedNode, childIndex);
            return;
          }
      }

      if (isArray(node)) {
        renderChildrenArray(request, task, node, childIndex);
        return;
      }

      var iteratorFn = getIteratorFn(node);

      if (iteratorFn) {
        {
          validateIterable(node, iteratorFn);
        }

        var iterator = iteratorFn.call(node);

        if (iterator) {
          // We need to know how many total children are in this set, so that we
          // can allocate enough id slots to acommodate them. So we must exhaust
          // the iterator before we start recursively rendering the children.
          // TODO: This is not great but I think it's inherent to the id
          // generation algorithm.
          var step = iterator.next(); // If there are not entries, we need to push an empty so we start by checking that.

          if (!step.done) {
            var children = [];

            do {
              children.push(step.value);
              step = iterator.next();
            } while (!step.done);

            renderChildrenArray(request, task, children, childIndex);
            return;
          }

          return;
        }
      } // Usables are a valid React node type. When React encounters a Usable in
      // a child position, it unwraps it using the same algorithm as `use`. For
      // example, for promises, React will throw an exception to unwind the
      // stack, then replay the component once the promise resolves.
      //
      // A difference from `use` is that React will keep unwrapping the value
      // until it reaches a non-Usable type.
      //
      // e.g. Usable<Usable<Usable<T>>> should resolve to T


      var maybeUsable = node;

      if (typeof maybeUsable.then === 'function') {
        // Clear any previous thenable state that was created by the unwrapping.
        task.thenableState = null;
        var thenable = maybeUsable;
        return renderNodeDestructive(request, task, unwrapThenable(thenable), childIndex);
      }

      if (maybeUsable.$$typeof === REACT_CONTEXT_TYPE) {
        var context = maybeUsable;
        return renderNodeDestructive(request, task, readContext$1(context), childIndex);
      } // $FlowFixMe[method-unbinding]


      var childString = Object.prototype.toString.call(node);
      throw new Error("Objects are not valid as a React child (found: " + (childString === '[object Object]' ? 'object with keys {' + Object.keys(node).join(', ') + '}' : childString) + "). " + 'If you meant to render a collection of children, use an array ' + 'instead.');
    }

    if (typeof node === 'string') {
      var segment = task.blockedSegment;

      if (segment === null) ; else {
        segment.lastPushedText = pushTextInstance(segment.chunks, node, request.renderState, segment.lastPushedText);
      }

      return;
    }

    if (typeof node === 'number' || typeof node === 'bigint') {
      var _segment = task.blockedSegment;

      if (_segment === null) ; else {
        _segment.lastPushedText = pushTextInstance(_segment.chunks, '' + node, request.renderState, _segment.lastPushedText);
      }

      return;
    }

    {
      if (typeof node === 'function') {
        warnOnFunctionType(node);
      }

      if (typeof node === 'symbol') {
        warnOnSymbolType(node);
      }
    }
  }

  function replayFragment(request, task, children, childIndex) {
    // If we're supposed follow this array, we'd expect to see a ReplayNode matching
    // this fragment.
    var replay = task.replay;
    var replayNodes = replay.nodes;

    for (var j = 0; j < replayNodes.length; j++) {
      var node = replayNodes[j];

      if (node[1] !== childIndex) {
        continue;
      } // Matched a replayable path.


      var childNodes = node[2];
      var childSlots = node[3];
      task.replay = {
        nodes: childNodes,
        slots: childSlots,
        pendingTasks: 1
      };

      try {
        renderChildrenArray(request, task, children, -1);

        if (task.replay.pendingTasks === 1 && task.replay.nodes.length > 0) {
          throw new Error("Couldn't find all resumable slots by key/index during replaying. " + "The tree doesn't match so React will fallback to client rendering.");
        }

        task.replay.pendingTasks--;
      } catch (x) {
        if (typeof x === 'object' && x !== null && (x === SuspenseException || typeof x.then === 'function')) {
          // Suspend
          throw x;
        }

        task.replay.pendingTasks--; // Unlike regular render, we don't terminate the siblings if we error
        // during a replay. That's because this component didn't actually error
        // in the original prerender. What's unable to complete is the child
        // replay nodes which might be Suspense boundaries which are able to
        // absorb the error and we can still continue with siblings.
        // This is an error, stash the component stack if it is null.

        var thrownInfo = getThrownInfo(request, task.componentStack);
        erroredReplay(request, task.blockedBoundary, x, thrownInfo, childNodes, childSlots);
      }

      task.replay = replay; // We finished rendering this node, so now we can consume this
      // slot. This must happen after in case we rerender this task.

      replayNodes.splice(j, 1);
      break;
    }
  }

  function renderChildrenArray(request, task, children, childIndex) {
    var prevKeyPath = task.keyPath;

    if (childIndex !== -1) {
      task.keyPath = [task.keyPath, 'Fragment', childIndex];

      if (task.replay !== null) {
        replayFragment(request, // $FlowFixMe: Refined.
        task, children, childIndex);
        task.keyPath = prevKeyPath;
        return;
      }
    }

    var prevTreeContext = task.treeContext;
    var totalChildren = children.length;

    if (task.replay !== null) {
      // Replay
      // First we need to check if we have any resume slots at this level.
      var resumeSlots = task.replay.slots;

      if (resumeSlots !== null && typeof resumeSlots === 'object') {
        for (var i = 0; i < totalChildren; i++) {
          var node = children[i];
          task.treeContext = pushTreeContext(prevTreeContext, totalChildren, i); // We need to use the non-destructive form so that we can safely pop back
          // up and render the sibling if something suspends.

          var resumeSegmentID = resumeSlots[i]; // TODO: If this errors we should still continue with the next sibling.

          if (typeof resumeSegmentID === 'number') {
            resumeNode(request, task, resumeSegmentID, node, i); // We finished rendering this node, so now we can consume this
            // slot. This must happen after in case we rerender this task.

            delete resumeSlots[i];
          } else {
            renderNode(request, task, node, i);
          }
        }

        task.treeContext = prevTreeContext;
        task.keyPath = prevKeyPath;
        return;
      }
    }

    for (var _i = 0; _i < totalChildren; _i++) {
      var _node = children[_i];
      task.treeContext = pushTreeContext(prevTreeContext, totalChildren, _i); // We need to use the non-destructive form so that we can safely pop back
      // up and render the sibling if something suspends.

      renderNode(request, task, _node, _i);
    } // Because this context is always set right before rendering every child, we
    // only need to reset it to the previous value at the very end.


    task.treeContext = prevTreeContext;
    task.keyPath = prevKeyPath;
  }

  function trackPostpone(request, trackedPostpones, task, segment) {
    segment.status = POSTPONED;
    var keyPath = task.keyPath;
    var boundary = task.blockedBoundary;

    if (boundary === null) {
      segment.id = request.nextSegmentId++;
      trackedPostpones.rootSlots = segment.id;

      if (request.completedRootSegment !== null) {
        // Postpone the root if this was a deeper segment.
        request.completedRootSegment.status = POSTPONED;
      }

      return;
    }

    if (boundary !== null && boundary.status === PENDING) {
      boundary.status = POSTPONED; // We need to eagerly assign it an ID because we'll need to refer to
      // it before flushing and we know that we can't inline it.

      boundary.rootSegmentID = request.nextSegmentId++;
      var boundaryKeyPath = boundary.trackedContentKeyPath;

      if (boundaryKeyPath === null) {
        throw new Error('It should not be possible to postpone at the root. This is a bug in React.');
      }

      var fallbackReplayNode = boundary.trackedFallbackNode;
      var children = [];

      if (boundaryKeyPath === keyPath && task.childIndex === -1) {
        // Assign ID
        if (segment.id === -1) {
          if (segment.parentFlushed) {
            // If this segment's parent was already flushed, it means we really just
            // skipped the parent and this segment is now the root.
            segment.id = boundary.rootSegmentID;
          } else {
            segment.id = request.nextSegmentId++;
          }
        } // We postponed directly inside the Suspense boundary so we mark this for resuming.


        var boundaryNode = [boundaryKeyPath[1], boundaryKeyPath[2], children, segment.id, fallbackReplayNode, boundary.rootSegmentID];
        trackedPostpones.workingMap.set(boundaryKeyPath, boundaryNode);
        addToReplayParent(boundaryNode, boundaryKeyPath[0], trackedPostpones);
        return;
      } else {
        var _boundaryNode = trackedPostpones.workingMap.get(boundaryKeyPath);

        if (_boundaryNode === undefined) {
          _boundaryNode = [boundaryKeyPath[1], boundaryKeyPath[2], children, null, fallbackReplayNode, boundary.rootSegmentID];
          trackedPostpones.workingMap.set(boundaryKeyPath, _boundaryNode);
          addToReplayParent(_boundaryNode, boundaryKeyPath[0], trackedPostpones);
        } else {
          // Upgrade to ReplaySuspenseBoundary.
          var suspenseBoundary = _boundaryNode;
          suspenseBoundary[4] = fallbackReplayNode;
          suspenseBoundary[5] = boundary.rootSegmentID;
        } // Fall through to add the child node.

      }
    } // We know that this will leave a hole so we might as well assign an ID now.
    // We might have one already if we had a parent that gave us its ID.


    if (segment.id === -1) {
      if (segment.parentFlushed && boundary !== null) {
        // If this segment's parent was already flushed, it means we really just
        // skipped the parent and this segment is now the root.
        segment.id = boundary.rootSegmentID;
      } else {
        segment.id = request.nextSegmentId++;
      }
    }

    if (task.childIndex === -1) {
      // Resume starting from directly inside the previous parent element.
      if (keyPath === null) {
        trackedPostpones.rootSlots = segment.id;
      } else {
        var workingMap = trackedPostpones.workingMap;
        var resumableNode = workingMap.get(keyPath);

        if (resumableNode === undefined) {
          resumableNode = [keyPath[1], keyPath[2], [], segment.id];
          addToReplayParent(resumableNode, keyPath[0], trackedPostpones);
        } else {
          resumableNode[3] = segment.id;
        }
      }
    } else {
      var slots;

      if (keyPath === null) {
        slots = trackedPostpones.rootSlots;

        if (slots === null) {
          slots = trackedPostpones.rootSlots = {};
        } else if (typeof slots === 'number') {
          throw new Error('It should not be possible to postpone both at the root of an element ' + 'as well as a slot below. This is a bug in React.');
        }
      } else {
        var _workingMap = trackedPostpones.workingMap;

        var _resumableNode = _workingMap.get(keyPath);

        if (_resumableNode === undefined) {
          slots = {};
          _resumableNode = [keyPath[1], keyPath[2], [], slots];

          _workingMap.set(keyPath, _resumableNode);

          addToReplayParent(_resumableNode, keyPath[0], trackedPostpones);
        } else {
          slots = _resumableNode[3];

          if (slots === null) {
            slots = _resumableNode[3] = {};
          } else if (typeof slots === 'number') {
            throw new Error('It should not be possible to postpone both at the root of an element ' + 'as well as a slot below. This is a bug in React.');
          }
        }
      }

      slots[task.childIndex] = segment.id;
    }
  } // In case a boundary errors, we need to stop tracking it because we won't
  // resume it.


  function untrackBoundary(request, boundary) {
    var trackedPostpones = request.trackedPostpones;

    if (trackedPostpones === null) {
      return;
    }

    var boundaryKeyPath = boundary.trackedContentKeyPath;

    if (boundaryKeyPath === null) {
      return;
    }

    var boundaryNode = trackedPostpones.workingMap.get(boundaryKeyPath);

    if (boundaryNode === undefined) {
      return;
    } // Downgrade to plain ReplayNode since we won't replay through it.
    // $FlowFixMe[cannot-write]: We intentionally downgrade this to the other tuple.


    boundaryNode.length = 4; // Remove any resumable slots.

    boundaryNode[2] = [];
    boundaryNode[3] = null; // TODO: We should really just remove the boundary from all parent paths too so
    // we don't replay the path to it.
  }

  function injectPostponedHole(request, task, reason, thrownInfo) {
    logPostpone(request, reason, thrownInfo); // Something suspended, we'll need to create a new segment and resolve it later.

    var segment = task.blockedSegment;
    var insertionIndex = segment.chunks.length;
    var newSegment = createPendingSegment(request, insertionIndex, null, task.formatContext, // Adopt the parent segment's leading text embed
    segment.lastPushedText, // Assume we are text embedded at the trailing edge
    true);
    segment.children.push(newSegment); // Reset lastPushedText for current Segment since the new Segment "consumed" it

    segment.lastPushedText = false;
    return newSegment;
  }

  function spawnNewSuspendedReplayTask(request, task, thenableState, x) {
    var newTask = createReplayTask(request, thenableState, task.replay, task.node, task.childIndex, task.blockedBoundary, task.hoistableState, task.abortSet, task.keyPath, task.formatContext, task.legacyContext, task.context, task.treeContext, // We pop one task off the stack because the node that suspended will be tried again,
    // which will add it back onto the stack.
    task.componentStack !== null ? task.componentStack.parent : null, task.isFallback);
    var ping = newTask.ping;
    x.then(ping, ping);
  }

  function spawnNewSuspendedRenderTask(request, task, thenableState, x) {
    // Something suspended, we'll need to create a new segment and resolve it later.
    var segment = task.blockedSegment;
    var insertionIndex = segment.chunks.length;
    var newSegment = createPendingSegment(request, insertionIndex, null, task.formatContext, // Adopt the parent segment's leading text embed
    segment.lastPushedText, // Assume we are text embedded at the trailing edge
    true);
    segment.children.push(newSegment); // Reset lastPushedText for current Segment since the new Segment "consumed" it

    segment.lastPushedText = false;
    var newTask = createRenderTask(request, thenableState, task.node, task.childIndex, task.blockedBoundary, newSegment, task.hoistableState, task.abortSet, task.keyPath, task.formatContext, task.legacyContext, task.context, task.treeContext, // We pop one task off the stack because the node that suspended will be tried again,
    // which will add it back onto the stack.
    task.componentStack !== null ? task.componentStack.parent : null, task.isFallback);
    var ping = newTask.ping;
    x.then(ping, ping);
  } // This is a non-destructive form of rendering a node. If it suspends it spawns
  // a new task and restores the context of this task to what it was before.


  function renderNode(request, task, node, childIndex) {
    // Snapshot the current context in case something throws to interrupt the
    // process.
    var previousFormatContext = task.formatContext;
    var previousLegacyContext = task.legacyContext;
    var previousContext = task.context;
    var previousKeyPath = task.keyPath;
    var previousTreeContext = task.treeContext;
    var previousComponentStack = task.componentStack;
    var x; // Store how much we've pushed at this point so we can reset it in case something
    // suspended partially through writing something.

    var segment = task.blockedSegment;

    if (segment === null) {
      // Replay
      try {
        return renderNodeDestructive(request, task, node, childIndex);
      } catch (thrownValue) {
        resetHooksState();
        x = thrownValue === SuspenseException ? // This is a special type of exception used for Suspense. For historical
        // reasons, the rest of the Suspense implementation expects the thrown
        // value to be a thenable, because before `use` existed that was the
        // (unstable) API for suspending. This implementation detail can change
        // later, once we deprecate the old API in favor of `use`.
        getSuspendedThenable() : thrownValue;

        if (typeof x === 'object' && x !== null) {
          // $FlowFixMe[method-unbinding]
          if (typeof x.then === 'function') {
            var wakeable = x;
            var thenableState = getThenableStateAfterSuspending();
            spawnNewSuspendedReplayTask(request, // $FlowFixMe: Refined.
            task, thenableState, wakeable); // Restore the context. We assume that this will be restored by the inner
            // functions in case nothing throws so we don't use "finally" here.

            task.formatContext = previousFormatContext;
            task.legacyContext = previousLegacyContext;
            task.context = previousContext;
            task.keyPath = previousKeyPath;
            task.treeContext = previousTreeContext;
            task.componentStack = previousComponentStack; // Restore all active ReactContexts to what they were before.

            switchContext(previousContext);
            return;
          }
        } // TODO: Abort any undiscovered Suspense boundaries in the ReplayNode.

      }
    } else {
      // Render
      var childrenLength = segment.children.length;
      var chunkLength = segment.chunks.length;

      try {
        return renderNodeDestructive(request, task, node, childIndex);
      } catch (thrownValue) {
        resetHooksState(); // Reset the write pointers to where we started.

        segment.children.length = childrenLength;
        segment.chunks.length = chunkLength;
        x = thrownValue === SuspenseException ? // This is a special type of exception used for Suspense. For historical
        // reasons, the rest of the Suspense implementation expects the thrown
        // value to be a thenable, because before `use` existed that was the
        // (unstable) API for suspending. This implementation detail can change
        // later, once we deprecate the old API in favor of `use`.
        getSuspendedThenable() : thrownValue;

        if (typeof x === 'object' && x !== null) {
          // $FlowFixMe[method-unbinding]
          if (typeof x.then === 'function') {
            var _wakeable = x;

            var _thenableState = getThenableStateAfterSuspending();

            spawnNewSuspendedRenderTask(request, // $FlowFixMe: Refined.
            task, _thenableState, _wakeable); // Restore the context. We assume that this will be restored by the inner
            // functions in case nothing throws so we don't use "finally" here.

            task.formatContext = previousFormatContext;
            task.legacyContext = previousLegacyContext;
            task.context = previousContext;
            task.keyPath = previousKeyPath;
            task.treeContext = previousTreeContext;
            task.componentStack = previousComponentStack; // Restore all active ReactContexts to what they were before.

            switchContext(previousContext);
            return;
          }

          if (x.$$typeof === REACT_POSTPONE_TYPE && request.trackedPostpones !== null && task.blockedBoundary !== null // bubble if we're postponing in the shell
          ) {
              // If we're tracking postpones, we inject a hole here and continue rendering
              // sibling. Similar to suspending. If we're not tracking, we treat it more like
              // an error. Notably this doesn't spawn a new task since nothing will fill it
              // in during this prerender.
              var trackedPostpones = request.trackedPostpones;
              var postponeInstance = x;
              var thrownInfo = getThrownInfo(request, task.componentStack);
              var postponedSegment = injectPostponedHole(request, task, // We don't use ReplayTasks in prerenders.
              postponeInstance.message, thrownInfo);
              trackPostpone(request, trackedPostpones, task, postponedSegment); // Restore the context. We assume that this will be restored by the inner
              // functions in case nothing throws so we don't use "finally" here.

              task.formatContext = previousFormatContext;
              task.legacyContext = previousLegacyContext;
              task.context = previousContext;
              task.keyPath = previousKeyPath;
              task.treeContext = previousTreeContext;
              task.componentStack = previousComponentStack; // Restore all active ReactContexts to what they were before.

              switchContext(previousContext);
              return;
            }
        }
      }
    } // Restore the context. We assume that this will be restored by the inner
    // functions in case nothing throws so we don't use "finally" here.


    task.formatContext = previousFormatContext;
    task.legacyContext = previousLegacyContext;
    task.context = previousContext;
    task.keyPath = previousKeyPath;
    task.treeContext = previousTreeContext; // We intentionally do not restore the component stack on the error pathway
    // Whatever handles the error needs to use this stack which is the location of the
    // error. We must restore the stack wherever we handle this
    // Restore all active ReactContexts to what they were before.

    switchContext(previousContext);
    throw x;
  }

  function erroredReplay(request, boundary, error, errorInfo, replayNodes, resumeSlots) {
    // Erroring during a replay doesn't actually cause an error by itself because
    // that component has already rendered. What causes the error is the resumable
    // points that we did not yet finish which will be below the point of the reset.
    // For example, if we're replaying a path to a Suspense boundary that is not done
    // that doesn't error the parent Suspense boundary.
    // This might be a bit strange that the error in a parent gets thrown at a child.
    // We log it only once and reuse the digest.
    var errorDigest;

    if (typeof error === 'object' && error !== null && error.$$typeof === REACT_POSTPONE_TYPE) {
      var postponeInstance = error;
      logPostpone(request, postponeInstance.message, errorInfo); // TODO: Figure out a better signal than a magic digest value.

      errorDigest = 'POSTPONE';
    } else {
      errorDigest = logRecoverableError(request, error, errorInfo);
    }

    abortRemainingReplayNodes(request, boundary, replayNodes, resumeSlots, error, errorDigest, errorInfo);
  }

  function erroredTask(request, boundary, error, errorInfo) {
    // Report the error to a global handler.
    var errorDigest;

    if (typeof error === 'object' && error !== null && error.$$typeof === REACT_POSTPONE_TYPE) {
      var postponeInstance = error;
      logPostpone(request, postponeInstance.message, errorInfo); // TODO: Figure out a better signal than a magic digest value.

      errorDigest = 'POSTPONE';
    } else {
      errorDigest = logRecoverableError(request, error, errorInfo);
    }

    if (boundary === null) {
      fatalError(request, error);
    } else {
      boundary.pendingTasks--;

      if (boundary.status !== CLIENT_RENDERED) {
        boundary.status = CLIENT_RENDERED;
        encodeErrorForBoundary(boundary, errorDigest, error, errorInfo);
        untrackBoundary(request, boundary); // Regardless of what happens next, this boundary won't be displayed,
        // so we can flush it, if the parent already flushed.

        if (boundary.parentFlushed) {
          // We don't have a preference where in the queue this goes since it's likely
          // to error on the client anyway. However, intentionally client-rendered
          // boundaries should be flushed earlier so that they can start on the client.
          // We reuse the same queue for errors.
          request.clientRenderedBoundaries.push(boundary);
        }
      }
    }

    request.allPendingTasks--;

    if (request.allPendingTasks === 0) {
      completeAll(request);
    }
  }

  function abortTaskSoft(task) {
    // This aborts task without aborting the parent boundary that it blocks.
    // It's used for when we didn't need this task to complete the tree.
    // If task was needed, then it should use abortTask instead.
    var request = this;
    var boundary = task.blockedBoundary;
    var segment = task.blockedSegment;

    if (segment !== null) {
      segment.status = ABORTED;
      finishedTask(request, boundary, segment);
    }
  }

  function abortRemainingSuspenseBoundary(request, rootSegmentID, error, errorDigest, errorInfo) {
    var resumedBoundary = createSuspenseBoundary(request, new Set());
    resumedBoundary.parentFlushed = true; // We restore the same id of this boundary as was used during prerender.

    resumedBoundary.rootSegmentID = rootSegmentID;
    resumedBoundary.status = CLIENT_RENDERED;
    var errorMessage = error;

    {
      var errorPrefix = 'The server did not finish this Suspense boundary: ';

      if (error && typeof error.message === 'string') {
        errorMessage = errorPrefix + error.message;
      } else {
        // eslint-disable-next-line react-internal/safe-string-coercion
        errorMessage = errorPrefix + String(error);
      }
    }

    encodeErrorForBoundary(resumedBoundary, errorDigest, errorMessage, errorInfo);

    if (resumedBoundary.parentFlushed) {
      request.clientRenderedBoundaries.push(resumedBoundary);
    }
  }

  function abortRemainingReplayNodes(request, boundary, nodes, slots, error, errorDigest, errorInfo) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];

      if (node.length === 4) {
        abortRemainingReplayNodes(request, boundary, node[2], node[3], error, errorDigest, errorInfo);
      } else {
        var boundaryNode = node;
        var rootSegmentID = boundaryNode[5];
        abortRemainingSuspenseBoundary(request, rootSegmentID, error, errorDigest, errorInfo);
      }
    } // Empty the set, since we've cleared it now.


    nodes.length = 0;

    if (slots !== null) {
      // We had something still to resume in the parent boundary. We must trigger
      // the error on the parent boundary since it's not able to complete.
      if (boundary === null) {
        throw new Error('We should not have any resumable nodes in the shell. ' + 'This is a bug in React.');
      } else if (boundary.status !== CLIENT_RENDERED) {
        boundary.status = CLIENT_RENDERED;
        encodeErrorForBoundary(boundary, errorDigest, error, errorInfo);

        if (boundary.parentFlushed) {
          request.clientRenderedBoundaries.push(boundary);
        }
      } // Empty the set


      if (typeof slots === 'object') {
        for (var index in slots) {
          delete slots[index];
        }
      }
    }
  }

  function abortTask(task, request, error) {
    // This aborts the task and aborts the parent that it blocks, putting it into
    // client rendered mode.
    var boundary = task.blockedBoundary;
    var segment = task.blockedSegment;

    if (segment !== null) {
      segment.status = ABORTED;
    }

    if (boundary === null) {
      var errorInfo = {};

      if (request.status !== CLOSING && request.status !== CLOSED) {
        var replay = task.replay;

        if (replay === null) {
          // We didn't complete the root so we have nothing to show. We can close
          // the request;
          if (typeof error === 'object' && error !== null && error.$$typeof === REACT_POSTPONE_TYPE) {
            var postponeInstance = error;
            var fatal = new Error('The render was aborted with postpone when the shell is incomplete. Reason: ' + postponeInstance.message);
            logRecoverableError(request, fatal, errorInfo);
            fatalError(request, fatal);
          } else {
            logRecoverableError(request, error, errorInfo);
            fatalError(request, error);
          }

          return;
        } else {
          // If the shell aborts during a replay, that's not a fatal error. Instead
          // we should be able to recover by client rendering all the root boundaries in
          // the ReplaySet.
          replay.pendingTasks--;

          if (replay.pendingTasks === 0 && replay.nodes.length > 0) {
            var errorDigest;

            if (typeof error === 'object' && error !== null && error.$$typeof === REACT_POSTPONE_TYPE) {
              var _postponeInstance = error;
              logPostpone(request, _postponeInstance.message, errorInfo); // TODO: Figure out a better signal than a magic digest value.

              errorDigest = 'POSTPONE';
            } else {
              errorDigest = logRecoverableError(request, error, errorInfo);
            }

            abortRemainingReplayNodes(request, null, replay.nodes, replay.slots, error, errorDigest, errorInfo);
          }

          request.pendingRootTasks--;

          if (request.pendingRootTasks === 0) {
            completeShell(request);
          }
        }
      }
    } else {
      boundary.pendingTasks--;

      if (boundary.status !== CLIENT_RENDERED) {
        boundary.status = CLIENT_RENDERED; // We construct an errorInfo from the boundary's componentStack so the error in dev will indicate which
        // boundary the message is referring to

        var _errorInfo = getThrownInfo(request, task.componentStack);

        var _errorDigest;

        if (typeof error === 'object' && error !== null && error.$$typeof === REACT_POSTPONE_TYPE) {
          var _postponeInstance2 = error;
          logPostpone(request, _postponeInstance2.message, _errorInfo); // TODO: Figure out a better signal than a magic digest value.

          _errorDigest = 'POSTPONE';
        } else {
          _errorDigest = logRecoverableError(request, error, _errorInfo);
        }

        var errorMessage = error;

        {
          var errorPrefix = 'The server did not finish this Suspense boundary: ';

          if (error && typeof error.message === 'string') {
            errorMessage = errorPrefix + error.message;
          } else {
            // eslint-disable-next-line react-internal/safe-string-coercion
            errorMessage = errorPrefix + String(error);
          }
        }

        encodeErrorForBoundary(boundary, _errorDigest, errorMessage, _errorInfo);
        untrackBoundary(request, boundary);

        if (boundary.parentFlushed) {
          request.clientRenderedBoundaries.push(boundary);
        }
      } // If this boundary was still pending then we haven't already cancelled its fallbacks.
      // We'll need to abort the fallbacks, which will also error that parent boundary.


      boundary.fallbackAbortableTasks.forEach(function (fallbackTask) {
        return abortTask(fallbackTask, request, error);
      });
      boundary.fallbackAbortableTasks.clear();
    }

    request.allPendingTasks--;

    if (request.allPendingTasks === 0) {
      completeAll(request);
    }
  }

  function safelyEmitEarlyPreloads(request, shellComplete) {
    try {
      emitEarlyPreloads(request.renderState, request.resumableState, shellComplete);
    } catch (error) {
      // We assume preloads are optimistic and thus non-fatal if errored.
      var errorInfo = {};
      logRecoverableError(request, error, errorInfo);
    }
  } // I extracted this function out because we want to ensure we consistently emit preloads before
  // transitioning to the next request stage and this transition can happen in multiple places in this
  // implementation.


  function completeShell(request) {
    if (request.trackedPostpones === null) {
      // We only emit early preloads on shell completion for renders. For prerenders
      // we wait for the entire Request to finish because we are not responding to a
      // live request and can wait for as much data as possible.
      // we should only be calling completeShell when the shell is complete so we
      // just use a literal here
      var shellComplete = true;
      safelyEmitEarlyPreloads(request, shellComplete);
    } // We have completed the shell so the shell can't error anymore.


    request.onShellError = noop;
    var onShellReady = request.onShellReady;
    onShellReady();
  } // I extracted this function out because we want to ensure we consistently emit preloads before
  // transitioning to the next request stage and this transition can happen in multiple places in this
  // implementation.


  function completeAll(request) {
    // During a render the shell must be complete if the entire request is finished
    // however during a Prerender it is possible that the shell is incomplete because
    // it postponed. We cannot use rootPendingTasks in the prerender case because
    // those hit zero even when the shell postpones. Instead we look at the completedRootSegment
    var shellComplete = request.trackedPostpones === null ? // Render, we assume it is completed
    true : // Prerender Request, we use the state of the root segment
    request.completedRootSegment === null || request.completedRootSegment.status !== POSTPONED;
    safelyEmitEarlyPreloads(request, shellComplete);
    var onAllReady = request.onAllReady;
    onAllReady();
  }

  function queueCompletedSegment(boundary, segment) {
    if (segment.chunks.length === 0 && segment.children.length === 1 && segment.children[0].boundary === null && segment.children[0].id === -1) {
      // This is an empty segment. There's nothing to write, so we can instead transfer the ID
      // to the child. That way any existing references point to the child.
      var childSegment = segment.children[0];
      childSegment.id = segment.id;
      childSegment.parentFlushed = true;

      if (childSegment.status === COMPLETED) {
        queueCompletedSegment(boundary, childSegment);
      }
    } else {
      var completedSegments = boundary.completedSegments;
      completedSegments.push(segment);
    }
  }

  function finishedTask(request, boundary, segment) {
    if (boundary === null) {
      if (segment !== null && segment.parentFlushed) {
        if (request.completedRootSegment !== null) {
          throw new Error('There can only be one root segment. This is a bug in React.');
        }

        request.completedRootSegment = segment;
      }

      request.pendingRootTasks--;

      if (request.pendingRootTasks === 0) {
        completeShell(request);
      }
    } else {
      boundary.pendingTasks--;

      if (boundary.status === CLIENT_RENDERED) ; else if (boundary.pendingTasks === 0) {
        if (boundary.status === PENDING) {
          boundary.status = COMPLETED;
        } // This must have been the last segment we were waiting on. This boundary is now complete.


        if (segment !== null && segment.parentFlushed) {
          // Our parent segment already flushed, so we need to schedule this segment to be emitted.
          // If it is a segment that was aborted, we'll write other content instead so we don't need
          // to emit it.
          if (segment.status === COMPLETED) {
            queueCompletedSegment(boundary, segment);
          }
        }

        if (boundary.parentFlushed) {
          // The segment might be part of a segment that didn't flush yet, but if the boundary's
          // parent flushed, we need to schedule the boundary to be emitted.
          request.completedBoundaries.push(boundary);
        } // We can now cancel any pending task on the fallback since we won't need to show it anymore.
        // This needs to happen after we read the parentFlushed flags because aborting can finish
        // work which can trigger user code, which can start flushing, which can change those flags.
        // If the boundary was POSTPONED, we still need to finish the fallback first.


        if (boundary.status === COMPLETED) {
          boundary.fallbackAbortableTasks.forEach(abortTaskSoft, request);
          boundary.fallbackAbortableTasks.clear();
        }
      } else {
        if (segment !== null && segment.parentFlushed) {
          // Our parent already flushed, so we need to schedule this segment to be emitted.
          // If it is a segment that was aborted, we'll write other content instead so we don't need
          // to emit it.
          if (segment.status === COMPLETED) {
            queueCompletedSegment(boundary, segment);
            var completedSegments = boundary.completedSegments;

            if (completedSegments.length === 1) {
              // This is the first time since we last flushed that we completed anything.
              // We can schedule this boundary to emit its partially completed segments early
              // in case the parent has already been flushed.
              if (boundary.parentFlushed) {
                request.partialBoundaries.push(boundary);
              }
            }
          }
        }
      }
    }

    request.allPendingTasks--;

    if (request.allPendingTasks === 0) {
      completeAll(request);
    }
  }

  function retryTask(request, task) {
    var segment = task.blockedSegment;

    if (segment === null) {
      retryReplayTask(request, // $FlowFixMe: Refined.
      task);
    } else {
      retryRenderTask(request, // $FlowFixMe: Refined.
      task, segment);
    }
  }

  function retryRenderTask(request, task, segment) {
    if (segment.status !== PENDING) {
      // We completed this by other means before we had a chance to retry it.
      return;
    } // We restore the context to what it was when we suspended.
    // We don't restore it after we leave because it's likely that we'll end up
    // needing a very similar context soon again.


    switchContext(task.context);
    var prevTaskInDEV = null;

    {
      prevTaskInDEV = currentTaskInDEV;
      currentTaskInDEV = task;
    }

    var childrenLength = segment.children.length;
    var chunkLength = segment.chunks.length;

    try {
      // We call the destructive form that mutates this task. That way if something
      // suspends again, we can reuse the same task instead of spawning a new one.
      renderNodeDestructive(request, task, task.node, task.childIndex);
      pushSegmentFinale(segment.chunks, request.renderState, segment.lastPushedText, segment.textEmbedded);
      task.abortSet.delete(task);
      segment.status = COMPLETED;
      finishedTask(request, task.blockedBoundary, segment);
    } catch (thrownValue) {
      resetHooksState(); // Reset the write pointers to where we started.

      segment.children.length = childrenLength;
      segment.chunks.length = chunkLength;
      var x = thrownValue === SuspenseException ? // This is a special type of exception used for Suspense. For historical
      // reasons, the rest of the Suspense implementation expects the thrown
      // value to be a thenable, because before `use` existed that was the
      // (unstable) API for suspending. This implementation detail can change
      // later, once we deprecate the old API in favor of `use`.
      getSuspendedThenable() : thrownValue;

      if (typeof x === 'object' && x !== null) {
        // $FlowFixMe[method-unbinding]
        if (typeof x.then === 'function') {
          // Something suspended again, let's pick it back up later.
          var ping = task.ping;
          x.then(ping, ping);
          task.thenableState = getThenableStateAfterSuspending();
          return;
        } else if (request.trackedPostpones !== null && x.$$typeof === REACT_POSTPONE_TYPE) {
          // If we're tracking postpones, we mark this segment as postponed and finish
          // the task without filling it in. If we're not tracking, we treat it more like
          // an error.
          var trackedPostpones = request.trackedPostpones;
          task.abortSet.delete(task);
          var postponeInstance = x;
          var postponeInfo = getThrownInfo(request, task.componentStack);
          logPostpone(request, postponeInstance.message, postponeInfo);
          trackPostpone(request, trackedPostpones, task, segment);
          finishedTask(request, task.blockedBoundary, segment);
          return;
        }
      }

      var errorInfo = getThrownInfo(request, task.componentStack);
      task.abortSet.delete(task);
      segment.status = ERRORED;
      erroredTask(request, task.blockedBoundary, x, errorInfo);
      return;
    } finally {
      {
        currentTaskInDEV = prevTaskInDEV;
      }
    }
  }

  function retryReplayTask(request, task) {
    if (task.replay.pendingTasks === 0) {
      // There are no pending tasks working on this set, so we must have aborted.
      return;
    } // We restore the context to what it was when we suspended.
    // We don't restore it after we leave because it's likely that we'll end up
    // needing a very similar context soon again.


    switchContext(task.context);
    var prevTaskInDEV = null;

    {
      prevTaskInDEV = currentTaskInDEV;
      currentTaskInDEV = task;
    }

    try {
      // We call the destructive form that mutates this task. That way if something
      // suspends again, we can reuse the same task instead of spawning a new one.
      renderNodeDestructive(request, task, task.node, task.childIndex);

      if (task.replay.pendingTasks === 1 && task.replay.nodes.length > 0) {
        throw new Error("Couldn't find all resumable slots by key/index during replaying. " + "The tree doesn't match so React will fallback to client rendering.");
      }

      task.replay.pendingTasks--;
      task.abortSet.delete(task);
      finishedTask(request, task.blockedBoundary, null);
    } catch (thrownValue) {
      resetHooksState();
      var x = thrownValue === SuspenseException ? // This is a special type of exception used for Suspense. For historical
      // reasons, the rest of the Suspense implementation expects the thrown
      // value to be a thenable, because before `use` existed that was the
      // (unstable) API for suspending. This implementation detail can change
      // later, once we deprecate the old API in favor of `use`.
      getSuspendedThenable() : thrownValue;

      if (typeof x === 'object' && x !== null) {
        // $FlowFixMe[method-unbinding]
        if (typeof x.then === 'function') {
          // Something suspended again, let's pick it back up later.
          var ping = task.ping;
          x.then(ping, ping);
          task.thenableState = getThenableStateAfterSuspending();
          return;
        }
      }

      task.replay.pendingTasks--;
      task.abortSet.delete(task);
      var errorInfo = getThrownInfo(request, task.componentStack);
      erroredReplay(request, task.blockedBoundary, x, errorInfo, task.replay.nodes, task.replay.slots);
      request.pendingRootTasks--;

      if (request.pendingRootTasks === 0) {
        completeShell(request);
      }

      request.allPendingTasks--;

      if (request.allPendingTasks === 0) {
        completeAll(request);
      }

      return;
    } finally {
      {
        currentTaskInDEV = prevTaskInDEV;
      }
    }
  }

  function performWork(request) {
    if (request.status === CLOSED) {
      return;
    }

    var prevContext = getActiveContext();
    var prevDispatcher = ReactCurrentDispatcher.current;
    ReactCurrentDispatcher.current = HooksDispatcher;
    var prevCacheDispatcher;

    {
      prevCacheDispatcher = ReactCurrentCache.current;
      ReactCurrentCache.current = DefaultCacheDispatcher;
    }

    var prevRequest = currentRequest;
    currentRequest = request;
    var prevGetCurrentStackImpl;

    {
      prevGetCurrentStackImpl = ReactDebugCurrentFrame.getCurrentStack;
      ReactDebugCurrentFrame.getCurrentStack = getCurrentStackInDEV;
    }

    var prevResumableState = currentResumableState;
    setCurrentResumableState(request.resumableState);

    try {
      var pingedTasks = request.pingedTasks;
      var i;

      for (i = 0; i < pingedTasks.length; i++) {
        var task = pingedTasks[i];
        retryTask(request, task);
      }

      pingedTasks.splice(0, i);

      if (request.destination !== null) {
        flushCompletedQueues(request, request.destination);
      }
    } catch (error) {
      var errorInfo = {};
      logRecoverableError(request, error, errorInfo);
      fatalError(request, error);
    } finally {
      setCurrentResumableState(prevResumableState);
      ReactCurrentDispatcher.current = prevDispatcher;

      {
        ReactCurrentCache.current = prevCacheDispatcher;
      }

      {
        ReactDebugCurrentFrame.getCurrentStack = prevGetCurrentStackImpl;
      }

      if (prevDispatcher === HooksDispatcher) {
        // This means that we were in a reentrant work loop. This could happen
        // in a renderer that supports synchronous work like renderToString,
        // when it's called from within another renderer.
        // Normally we don't bother switching the contexts to their root/default
        // values when leaving because we'll likely need the same or similar
        // context again. However, when we're inside a synchronous loop like this
        // we'll to restore the context to what it was before returning.
        switchContext(prevContext);
      }

      currentRequest = prevRequest;
    }
  }

  function flushPreamble(request, destination, rootSegment) {
    var willFlushAllSegments = request.allPendingTasks === 0 && request.trackedPostpones === null;
    writePreamble(destination, request.resumableState, request.renderState, willFlushAllSegments);
  }

  function flushSubtree(request, destination, segment, hoistableState) {
    segment.parentFlushed = true;

    switch (segment.status) {
      case PENDING:
        {
          // We're emitting a placeholder for this segment to be filled in later.
          // Therefore we'll need to assign it an ID - to refer to it by.
          segment.id = request.nextSegmentId++; // Fallthrough
        }

      case POSTPONED:
        {
          var segmentID = segment.id; // When this segment finally completes it won't be embedded in text since it will flush separately

          segment.lastPushedText = false;
          segment.textEmbedded = false;
          return writePlaceholder(destination, request.renderState, segmentID);
        }

      case COMPLETED:
        {
          segment.status = FLUSHED;
          var r = true;
          var chunks = segment.chunks;
          var chunkIdx = 0;
          var children = segment.children;

          for (var childIdx = 0; childIdx < children.length; childIdx++) {
            var nextChild = children[childIdx]; // Write all the chunks up until the next child.

            for (; chunkIdx < nextChild.index; chunkIdx++) {
              writeChunk(destination, chunks[chunkIdx]);
            }

            r = flushSegment(request, destination, nextChild, hoistableState);
          } // Finally just write all the remaining chunks


          for (; chunkIdx < chunks.length - 1; chunkIdx++) {
            writeChunk(destination, chunks[chunkIdx]);
          }

          if (chunkIdx < chunks.length) {
            r = writeChunkAndReturn(destination, chunks[chunkIdx]);
          }

          return r;
        }

      default:
        {
          throw new Error('Aborted, errored or already flushed boundaries should not be flushed again. This is a bug in React.');
        }
    }
  }

  function flushSegment(request, destination, segment, hoistableState) {
    var boundary = segment.boundary;

    if (boundary === null) {
      // Not a suspense boundary.
      return flushSubtree(request, destination, segment, hoistableState);
    }

    boundary.parentFlushed = true; // This segment is a Suspense boundary. We need to decide whether to
    // emit the content or the fallback now.

    if (boundary.status === CLIENT_RENDERED) {
      // Emit a client rendered suspense boundary wrapper.
      // We never queue the inner boundary so we'll never emit its content or partial segments.
      writeStartClientRenderedSuspenseBoundary(destination, request.renderState, boundary.errorDigest, boundary.errorMessage, boundary.errorComponentStack); // Flush the fallback.

      flushSubtree(request, destination, segment, hoistableState);
      return writeEndClientRenderedSuspenseBoundary(destination);
    } else if (boundary.status !== COMPLETED) {
      if (boundary.status === PENDING) {
        // For pending boundaries we lazily assign an ID to the boundary
        // and root segment.
        boundary.rootSegmentID = request.nextSegmentId++;
      }

      if (boundary.completedSegments.length > 0) {
        // If this is at least partially complete, we can queue it to be partially emitted early.
        request.partialBoundaries.push(boundary);
      } // This boundary is still loading. Emit a pending suspense boundary wrapper.


      var id = boundary.rootSegmentID;
      writeStartPendingSuspenseBoundary(destination, request.renderState, id); // We are going to flush the fallback so we need to hoist the fallback
      // state to the parent boundary

      {
        if (hoistableState) {
          hoistHoistables(hoistableState, boundary.fallbackState);
        }
      } // Flush the fallback.


      flushSubtree(request, destination, segment, hoistableState);
      return writeEndPendingSuspenseBoundary(destination);
    } else if (boundary.byteSize > request.progressiveChunkSize) {
      // This boundary is large and will be emitted separately so that we can progressively show
      // other content. We add it to the queue during the flush because we have to ensure that
      // the parent flushes first so that there's something to inject it into.
      // We also have to make sure that it's emitted into the queue in a deterministic slot.
      // I.e. we can't insert it here when it completes.
      // Assign an ID to refer to the future content by.
      boundary.rootSegmentID = request.nextSegmentId++;
      request.completedBoundaries.push(boundary); // Emit a pending rendered suspense boundary wrapper.

      writeStartPendingSuspenseBoundary(destination, request.renderState, boundary.rootSegmentID); // While we are going to flush the fallback we are going to follow it up with
      // the completed boundary immediately so we make the choice to omit fallback
      // boundary state from the parent since it will be replaced when the boundary
      // flushes later in this pass or in a future flush
      // Flush the fallback.

      flushSubtree(request, destination, segment, hoistableState);
      return writeEndPendingSuspenseBoundary(destination);
    } else {
      {
        if (hoistableState) {
          hoistHoistables(hoistableState, boundary.contentState);
        }
      } // We can inline this boundary's content as a complete boundary.


      writeStartCompletedSuspenseBoundary(destination);
      var completedSegments = boundary.completedSegments;

      if (completedSegments.length !== 1) {
        throw new Error('A previously unvisited boundary must have exactly one root segment. This is a bug in React.');
      }

      var contentSegment = completedSegments[0];
      flushSegment(request, destination, contentSegment, hoistableState);
      return writeEndCompletedSuspenseBoundary(destination);
    }
  }

  function flushClientRenderedBoundary(request, destination, boundary) {
    return writeClientRenderBoundaryInstruction(destination, request.resumableState, request.renderState, boundary.rootSegmentID, boundary.errorDigest, boundary.errorMessage, boundary.errorComponentStack);
  }

  function flushSegmentContainer(request, destination, segment, hoistableState) {
    writeStartSegment(destination, request.renderState, segment.parentFormatContext, segment.id);
    flushSegment(request, destination, segment, hoistableState);
    return writeEndSegment(destination, segment.parentFormatContext);
  }

  function flushCompletedBoundary(request, destination, boundary) {
    var completedSegments = boundary.completedSegments;
    var i = 0;

    for (; i < completedSegments.length; i++) {
      var segment = completedSegments[i];
      flushPartiallyCompletedSegment(request, destination, boundary, segment);
    }

    completedSegments.length = 0;

    {
      writeHoistablesForBoundary(destination, boundary.contentState, request.renderState);
    }

    return writeCompletedBoundaryInstruction(destination, request.resumableState, request.renderState, boundary.rootSegmentID, boundary.contentState);
  }

  function flushPartialBoundary(request, destination, boundary) {
    var completedSegments = boundary.completedSegments;
    var i = 0;

    for (; i < completedSegments.length; i++) {
      var segment = completedSegments[i];

      if (!flushPartiallyCompletedSegment(request, destination, boundary, segment)) {
        i++;
        completedSegments.splice(0, i); // Only write as much as the buffer wants. Something higher priority
        // might want to write later.

        return false;
      }
    }

    completedSegments.splice(0, i);

    {
      return writeHoistablesForBoundary(destination, boundary.contentState, request.renderState);
    }
  }

  function flushPartiallyCompletedSegment(request, destination, boundary, segment) {
    if (segment.status === FLUSHED) {
      // We've already flushed this inline.
      return true;
    }

    var hoistableState = boundary.contentState;
    var segmentID = segment.id;

    if (segmentID === -1) {
      // This segment wasn't previously referred to. This happens at the root of
      // a boundary. We make kind of a leap here and assume this is the root.
      var rootSegmentID = segment.id = boundary.rootSegmentID;

      if (rootSegmentID === -1) {
        throw new Error('A root segment ID must have been assigned by now. This is a bug in React.');
      }

      return flushSegmentContainer(request, destination, segment, hoistableState);
    } else if (segmentID === boundary.rootSegmentID) {
      // When we emit postponed boundaries, we might have assigned the ID already
      // but it's still the root segment so we can't inject it into the parent yet.
      return flushSegmentContainer(request, destination, segment, hoistableState);
    } else {
      flushSegmentContainer(request, destination, segment, hoistableState);
      return writeCompletedSegmentInstruction(destination, request.resumableState, request.renderState, segmentID);
    }
  }

  function flushCompletedQueues(request, destination) {
    beginWriting();

    try {
      // The structure of this is to go through each queue one by one and write
      // until the sink tells us to stop. When we should stop, we still finish writing
      // that item fully and then yield. At that point we remove the already completed
      // items up until the point we completed them.
      var i;
      var completedRootSegment = request.completedRootSegment;

      if (completedRootSegment !== null) {
        if (completedRootSegment.status === POSTPONED) {
          // We postponed the root, so we write nothing.
          return;
        } else if (request.pendingRootTasks === 0) {
          if (enableFloat) {
            flushPreamble(request, destination, completedRootSegment);
          }

          flushSegment(request, destination, completedRootSegment, null);
          request.completedRootSegment = null;
          writeCompletedRoot(destination, request.renderState);
        } else {
          // We haven't flushed the root yet so we don't need to check any other branches further down
          return;
        }
      }

      if (enableFloat) {
        writeHoistables(destination, request.resumableState, request.renderState);
      } // We emit client rendering instructions for already emitted boundaries first.
      // This is so that we can signal to the client to start client rendering them as
      // soon as possible.


      var clientRenderedBoundaries = request.clientRenderedBoundaries;

      for (i = 0; i < clientRenderedBoundaries.length; i++) {
        var boundary = clientRenderedBoundaries[i];

        if (!flushClientRenderedBoundary(request, destination, boundary)) {
          request.destination = null;
          i++;
          clientRenderedBoundaries.splice(0, i);
          return;
        }
      }

      clientRenderedBoundaries.splice(0, i); // Next we emit any complete boundaries. It's better to favor boundaries
      // that are completely done since we can actually show them, than it is to emit
      // any individual segments from a partially complete boundary.

      var completedBoundaries = request.completedBoundaries;

      for (i = 0; i < completedBoundaries.length; i++) {
        var _boundary = completedBoundaries[i];

        if (!flushCompletedBoundary(request, destination, _boundary)) {
          request.destination = null;
          i++;
          completedBoundaries.splice(0, i);
          return;
        }
      }

      completedBoundaries.splice(0, i); // Allow anything written so far to flush to the underlying sink before
      // we continue with lower priorities.

      completeWriting(destination);
      beginWriting(destination); // TODO: Here we'll emit data used by hydration.
      // Next we emit any segments of any boundaries that are partially complete
      // but not deeply complete.

      var partialBoundaries = request.partialBoundaries;

      for (i = 0; i < partialBoundaries.length; i++) {
        var _boundary2 = partialBoundaries[i];

        if (!flushPartialBoundary(request, destination, _boundary2)) {
          request.destination = null;
          i++;
          partialBoundaries.splice(0, i);
          return;
        }
      }

      partialBoundaries.splice(0, i); // Next we check the completed boundaries again. This may have had
      // boundaries added to it in case they were too larged to be inlined.
      // New ones might be added in this loop.

      var largeBoundaries = request.completedBoundaries;

      for (i = 0; i < largeBoundaries.length; i++) {
        var _boundary3 = largeBoundaries[i];

        if (!flushCompletedBoundary(request, destination, _boundary3)) {
          request.destination = null;
          i++;
          largeBoundaries.splice(0, i);
          return;
        }
      }

      largeBoundaries.splice(0, i);
    } finally {
      if (request.allPendingTasks === 0 && request.pingedTasks.length === 0 && request.clientRenderedBoundaries.length === 0 && request.completedBoundaries.length === 0 // We don't need to check any partially completed segments because
      // either they have pending task or they're complete.
      ) {
          request.flushScheduled = false;

          {
            // We write the trailing tags but only if don't have any data to resume.
            // If we need to resume we'll write the postamble in the resume instead.
            if (request.trackedPostpones === null) {
              writePostamble(destination, request.resumableState);
            }
          }

          completeWriting(destination);

          {
            if (request.abortableTasks.size !== 0) {
              error('There was still abortable task at the root when we closed. This is a bug in React.');
            }
          } // We're done.


          close(destination); // We need to stop flowing now because we do not want any async contexts which might call
          // float methods to initiate any flushes after this point

          stopFlowing(request);
        } else {
        completeWriting(destination);
      }
    }
  }

  function startWork(request) {
    request.flushScheduled = request.destination !== null;

    {
      scheduleWork(function () {
        return performWork(request);
      });
    }

    if (request.trackedPostpones === null) {
      // this is either a regular render or a resume. For regular render we want
      // to call emitEarlyPreloads after the first performWork because we want
      // are responding to a live request and need to balance sending something early
      // (i.e. don't want for the shell to finish) but we need something to send.
      // The only implementation of this is for DOM at the moment and during resumes nothing
      // actually emits but the code paths here are the same.
      // During a prerender we don't want to be too aggressive in emitting early preloads
      // because we aren't responding to a live request and we can wait for the prerender to
      // postpone before we emit anything.
      {
        scheduleWork(function () {
          return enqueueEarlyPreloadsAfterInitialWork(request);
        });
      }
    }
  }

  function enqueueEarlyPreloadsAfterInitialWork(request) {
    var shellComplete = request.pendingRootTasks === 0;
    safelyEmitEarlyPreloads(request, shellComplete);
  }

  function enqueueFlush(request) {
    if (request.flushScheduled === false && // If there are pinged tasks we are going to flush anyway after work completes
    request.pingedTasks.length === 0 && // If there is no destination there is nothing we can flush to. A flush will
    // happen when we start flowing again
    request.destination !== null) {
      request.flushScheduled = true;
      scheduleWork(function () {
        // We need to existence check destination again here because it might go away
        // in between the enqueueFlush call and the work execution
        var destination = request.destination;

        if (destination) {
          flushCompletedQueues(request, destination);
        } else {
          request.flushScheduled = false;
        }
      });
    }
  } // This function is intented to only be called during the pipe function for the Node builds.
  function startFlowing(request, destination) {
    if (request.status === CLOSING) {
      request.status = CLOSED;
      closeWithError(destination, request.fatalError);
      return;
    }

    if (request.status === CLOSED) {
      return;
    }

    if (request.destination !== null) {
      // We're already flowing.
      return;
    }

    request.destination = destination;

    try {
      flushCompletedQueues(request, destination);
    } catch (error) {
      var errorInfo = {};
      logRecoverableError(request, error, errorInfo);
      fatalError(request, error);
    }
  }
  function stopFlowing(request) {
    request.destination = null;
  } // This is called to early terminate a request. It puts all pending boundaries in client rendered state.

  function abort(request, reason) {
    try {
      var abortableTasks = request.abortableTasks;

      if (abortableTasks.size > 0) {
        var error = reason === undefined ? new Error('The render was aborted by the server without a reason.') : reason;
        abortableTasks.forEach(function (task) {
          return abortTask(task, request, error);
        });
        abortableTasks.clear();
      }

      if (request.destination !== null) {
        flushCompletedQueues(request, request.destination);
      }
    } catch (error) {
      var errorInfo = {};
      logRecoverableError(request, error, errorInfo);
      fatalError(request, error);
    }
  }
  function flushResources(request) {
    enqueueFlush(request);
  }
  function getFormState(request) {
    return request.formState;
  }
  function getResumableState(request) {
    return request.resumableState;
  }
  function getRenderState(request) {
    return request.renderState;
  }

  function addToReplayParent(node, parentKeyPath, trackedPostpones) {
    if (parentKeyPath === null) {
      trackedPostpones.rootNodes.push(node);
    } else {
      var workingMap = trackedPostpones.workingMap;
      var parentNode = workingMap.get(parentKeyPath);

      if (parentNode === undefined) {
        parentNode = [parentKeyPath[1], parentKeyPath[2], [], null];
        workingMap.set(parentKeyPath, parentNode);
        addToReplayParent(parentNode, parentKeyPath[0], trackedPostpones);
      }

      parentNode[2].push(node);
    }
  } // Returns the state of a postponed request or null if nothing was postponed.


  function getPostponedState(request) {
    var trackedPostpones = request.trackedPostpones;

    if (trackedPostpones === null || trackedPostpones.rootNodes.length === 0 && trackedPostpones.rootSlots === null) {
      // Reset. Let the flushing behave as if we completed the whole document.
      request.trackedPostpones = null;
      return null;
    }

    if (request.completedRootSegment !== null && request.completedRootSegment.status === POSTPONED) {
      // We postponed the root so we didn't flush anything.
      resetResumableState(request.resumableState, request.renderState);
    } else {
      completeResumableState(request.resumableState);
    }

    return {
      nextSegmentId: request.nextSegmentId,
      rootFormatContext: request.rootFormatContext,
      progressiveChunkSize: request.progressiveChunkSize,
      resumableState: request.resumableState,
      replayNodes: trackedPostpones.rootNodes,
      replaySlots: trackedPostpones.rootSlots
    };
  }

  function renderToReadableStream(children, options) {
    return new Promise(function (resolve, reject) {
      var onFatalError;
      var onAllReady;
      var allReady = new Promise(function (res, rej) {
        onAllReady = res;
        onFatalError = rej;
      });

      function onShellReady() {
        var stream = new ReadableStream({
          type: 'bytes',
          pull: function (controller) {
            startFlowing(request, controller);
          },
          cancel: function (reason) {
            stopFlowing(request);
            abort(request, reason);
          }
        }, // $FlowFixMe[prop-missing] size() methods are not allowed on byte streams.
        {
          highWaterMark: 0
        }); // TODO: Move to sub-classing ReadableStream.

        stream.allReady = allReady;
        resolve(stream);
      }

      function onShellError(error) {
        // If the shell errors the caller of `renderToReadableStream` won't have access to `allReady`.
        // However, `allReady` will be rejected by `onFatalError` as well.
        // So we need to catch the duplicate, uncatchable fatal error in `allReady` to prevent a `UnhandledPromiseRejection`.
        allReady.catch(function () {});
        reject(error);
      }

      var onHeaders = options ? options.onHeaders : undefined;
      var onHeadersImpl;

      if (onHeaders) {
        onHeadersImpl = function (headersDescriptor) {
          onHeaders(new Headers(headersDescriptor));
        };
      }

      var resumableState = createResumableState(options ? options.identifierPrefix : undefined, options ? options.unstable_externalRuntimeSrc : undefined, options ? options.bootstrapScriptContent : undefined, options ? options.bootstrapScripts : undefined, options ? options.bootstrapModules : undefined);
      var request = createRequest(children, resumableState, createRenderState(resumableState, options ? options.nonce : undefined, options ? options.unstable_externalRuntimeSrc : undefined, options ? options.importMap : undefined, onHeadersImpl, options ? options.maxHeadersLength : undefined), createRootFormatContext(options ? options.namespaceURI : undefined), options ? options.progressiveChunkSize : undefined, options ? options.onError : undefined, onAllReady, onShellReady, onShellError, onFatalError, options ? options.onPostpone : undefined, options ? options.formState : undefined);

      if (options && options.signal) {
        var signal = options.signal;

        if (signal.aborted) {
          abort(request, signal.reason);
        } else {
          var listener = function () {
            abort(request, signal.reason);
            signal.removeEventListener('abort', listener);
          };

          signal.addEventListener('abort', listener);
        }
      }

      startWork(request);
    });
  }

  function resume(children, postponedState, options) {
    return new Promise(function (resolve, reject) {
      var onFatalError;
      var onAllReady;
      var allReady = new Promise(function (res, rej) {
        onAllReady = res;
        onFatalError = rej;
      });

      function onShellReady() {
        var stream = new ReadableStream({
          type: 'bytes',
          pull: function (controller) {
            startFlowing(request, controller);
          },
          cancel: function (reason) {
            stopFlowing(request);
            abort(request, reason);
          }
        }, // $FlowFixMe[prop-missing] size() methods are not allowed on byte streams.
        {
          highWaterMark: 0
        }); // TODO: Move to sub-classing ReadableStream.

        stream.allReady = allReady;
        resolve(stream);
      }

      function onShellError(error) {
        // If the shell errors the caller of `renderToReadableStream` won't have access to `allReady`.
        // However, `allReady` will be rejected by `onFatalError` as well.
        // So we need to catch the duplicate, uncatchable fatal error in `allReady` to prevent a `UnhandledPromiseRejection`.
        allReady.catch(function () {});
        reject(error);
      }

      var request = resumeRequest(children, postponedState, resumeRenderState(postponedState.resumableState, options ? options.nonce : undefined), options ? options.onError : undefined, onAllReady, onShellReady, onShellError, onFatalError, options ? options.onPostpone : undefined);

      if (options && options.signal) {
        var signal = options.signal;

        if (signal.aborted) {
          abort(request, signal.reason);
        } else {
          var listener = function () {
            abort(request, signal.reason);
            signal.removeEventListener('abort', listener);
          };

          signal.addEventListener('abort', listener);
        }
      }

      startWork(request);
    });
  }

  function prerender(children, options) {
    return new Promise(function (resolve, reject) {
      var onFatalError = reject;

      function onAllReady() {
        var stream = new ReadableStream({
          type: 'bytes',
          pull: function (controller) {
            startFlowing(request, controller);
          },
          cancel: function (reason) {
            stopFlowing(request);
            abort(request, reason);
          }
        }, // $FlowFixMe[prop-missing] size() methods are not allowed on byte streams.
        {
          highWaterMark: 0
        });
        var result = {
          postponed: getPostponedState(request),
          prelude: stream
        };
        resolve(result);
      }

      var onHeaders = options ? options.onHeaders : undefined;
      var onHeadersImpl;

      if (onHeaders) {
        onHeadersImpl = function (headersDescriptor) {
          onHeaders(new Headers(headersDescriptor));
        };
      }

      var resources = createResumableState(options ? options.identifierPrefix : undefined, options ? options.unstable_externalRuntimeSrc : undefined, options ? options.bootstrapScriptContent : undefined, options ? options.bootstrapScripts : undefined, options ? options.bootstrapModules : undefined);
      var request = createPrerenderRequest(children, resources, createRenderState(resources, undefined, // nonce is not compatible with prerendered bootstrap scripts
      options ? options.unstable_externalRuntimeSrc : undefined, options ? options.importMap : undefined, onHeadersImpl, options ? options.maxHeadersLength : undefined), createRootFormatContext(options ? options.namespaceURI : undefined), options ? options.progressiveChunkSize : undefined, options ? options.onError : undefined, onAllReady, undefined, undefined, onFatalError, options ? options.onPostpone : undefined);

      if (options && options.signal) {
        var signal = options.signal;

        if (signal.aborted) {
          abort(request, signal.reason);
        } else {
          var listener = function () {
            abort(request, signal.reason);
            signal.removeEventListener('abort', listener);
          };

          signal.addEventListener('abort', listener);
        }
      }

      startWork(request);
    });
  }

  exports.prerender = prerender;
  exports.renderToReadableStream = renderToReadableStream;
  exports.resume = resume;
  exports.version = ReactVersion;

}));
