(function(f) {
  if (
    typeof exports === "object" &&
    typeof module !== "undefined"
  ) {
    module.exports=f()
  } else if (
    typeof define === "function" &&
    define.amd
  ) {
    define([],f)
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window
    } else if (typeof global !== "undefined") {
      g = global
    } else if (typeof self !== "undefined") {
      g = self
    } else {
      g = this
    }

    if (typeof g.React === "undefined") {
      throw Error('React module should be required before createFragment');
    } else if (typeof g.React.addons === "undefined") {
      g.React.addons = {};
    }

    g.React.addons.createFragment = f()
  }
})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (process){
/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFragment
 */

'use strict';

var REACT_ELEMENT_TYPE = (typeof Symbol === 'function' &&
  Symbol.for &&
  Symbol.for('react.element')) ||
  0xeac7;

function makeEmptyFunction(arg) {
  return function () {
    return arg;
  };
}
var emptyFunction = function emptyFunction() {};
emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function () {
  return this;
};
emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

var validateFormat = function validateFormat(format) {};

if (process.env.NODE_ENV !== 'production') {
  validateFormat = function validateFormat(format) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  };
}

function invariant(condition, format, a, b, c, d, e, f) {
  validateFormat(format);

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}

var warning = emptyFunction;

if (process.env.NODE_ENV !== 'production') {
  (function () {
    var printWarning = function printWarning(format) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var argIndex = 0;
      var message = 'Warning: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      });
      if (typeof console !== 'undefined') {
        console.error(message);
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch (x) {}
    };

    warning = function warning(condition, format) {
      if (format === undefined) {
        throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
      }

      if (format.indexOf('Failed Composite propType: ') === 0) {
        return; // Ignore CompositeComponent proptype check.
      }

      if (!condition) {
        for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
          args[_key2 - 2] = arguments[_key2];
        }

        printWarning.apply(undefined, [format].concat(args));
      }
    };
  })();
}

var SEPARATOR = '.';
var SUBSEPARATOR = ':';

var didWarnAboutMaps = false;

var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

function getIteratorFn(maybeIterable) {
  var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
  if (typeof iteratorFn === 'function') {
    return iteratorFn;
  }
}

function escape(key) {
  var escapeRegex = /[=:]/g;
  var escaperLookup = {
    '=': '=0',
    ':': '=2',
  };
  var escapedString = ('' + key).replace(escapeRegex, function(match) {
    return escaperLookup[match];
  });

  return '$' + escapedString;
}

function getComponentKey(component, index) {
  // Do some typechecking here since we call this blindly. We want to ensure
  // that we don't block potential future ES APIs.
  if (component && typeof component === 'object' && component.key != null) {
    // Explicit key
    return escape(component.key);
  }
  // Implicit key determined by the index in the set
  return index.toString(36);
}

function traverseAllChildrenImpl(
  children,
  nameSoFar,
  callback,
  traverseContext
) {
  var type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  if (
    children === null ||
    type === 'string' ||
    type === 'number' ||
    // The following is inlined from ReactElement. This means we can optimize
    // some checks. React Fiber also inlines this logic for similar purposes.
    (type === 'object' && children.$$typeof === REACT_ELEMENT_TYPE)
  ) {
    callback(
      traverseContext,
      children,
      // If it's the only child, treat the name as if it was wrapped in an array
      // so that it's consistent if the number of children grows.
      nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar
    );
    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // Count of children found in the current subtree.
  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getComponentKey(child, i);
      subtreeCount += traverseAllChildrenImpl(
        child,
        nextName,
        callback,
        traverseContext
      );
    }
  } else {
    var iteratorFn = getIteratorFn(children);
    if (iteratorFn) {
      if (true) {
        // Warn about using Maps as children
        if (iteratorFn === children.entries) {
          warning(
            didWarnAboutMaps,
            'Using Maps as children is unsupported and will likely yield ' +
              'unexpected results. Convert it to a sequence/iterable of keyed ' +
              'ReactElements instead.'
          );
          didWarnAboutMaps = true;
        }
      }

      var iterator = iteratorFn.call(children);
      var step;
      var ii = 0;
      while (!(step = iterator.next()).done) {
        child = step.value;
        nextName = nextNamePrefix + getComponentKey(child, ii++);
        subtreeCount += traverseAllChildrenImpl(
          child,
          nextName,
          callback,
          traverseContext
        );
      }
    } else if (type === 'object') {
      var addendum = '';
      if (true) {
        addendum = ' If you meant to render a collection of children, use an array ' +
          'instead or wrap the object using createFragment(object) from the ' +
          'React add-ons.';
      }
      var childrenString = '' + children;
      invariant(
        false,
        'Objects are not valid as a React child (found: %s).%s',
        childrenString === '[object Object]'
          ? 'object with keys {' + Object.keys(children).join(', ') + '}'
          : childrenString,
        addendum
      );
    }
  }

  return subtreeCount;
}

function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) {
    return 0;
  }

  return traverseAllChildrenImpl(children, '', callback, traverseContext);
}

var userProvidedKeyEscapeRegex = /\/+/g;
function escapeUserProvidedKey(text) {
  return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/');
}

function cloneAndReplaceKey(oldElement, newKey) {
  return React.cloneElement(
    oldElement,
    { key: newKey },
    oldElement.props !== undefined
      ? oldElement.props.children
      : undefined
  );
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

var oneArgumentPooler = function(copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var addPoolingTo = function(
  CopyConstructor,
  pooler
) {
  // Casting as any so that flow ignores the actual implementation and trusts
  // it to match the type we declared
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var standardReleaser = function(instance) {
  var Klass = this;
  invariant(
    instance instanceof Klass,
    'Trying to release an instance into a pool of a different type.'
  );
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var fourArgumentPooler = function(a1, a2, a3, a4) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4);
  }
};

function MapBookKeeping(mapResult, keyPrefix, mapFunction, mapContext) {
  this.result = mapResult;
  this.keyPrefix = keyPrefix;
  this.func = mapFunction;
  this.context = mapContext;
  this.count = 0;
}
MapBookKeeping.prototype.destructor = function() {
  this.result = null;
  this.keyPrefix = null;
  this.func = null;
  this.context = null;
  this.count = 0;
};
addPoolingTo(MapBookKeeping, fourArgumentPooler);

function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  var result = bookKeeping.result;
  var keyPrefix = bookKeeping.keyPrefix;
  var func = bookKeeping.func;
  var context = bookKeeping.context;

  var mappedChild = func.call(context, child, bookKeeping.count++);
  if (Array.isArray(mappedChild)) {
    mapIntoWithKeyPrefixInternal(
      mappedChild,
      result,
      childKey,
      emptyFunction.thatReturnsArgument
    );
  } else if (mappedChild != null) {
    if (React.isValidElement(mappedChild)) {
      mappedChild = cloneAndReplaceKey(
        mappedChild,
        // Keep both the (mapped) and old keys if they differ, just as
        // traverseAllChildren used to do for objects as children
        keyPrefix +
          (mappedChild.key && (!child || child.key !== mappedChild.key)
            ? escapeUserProvidedKey(mappedChild.key) + '/'
            : '') +
          childKey
      );
    }
    result.push(mappedChild);
  }
}

function mapIntoWithKeyPrefixInternal(children, array, prefix, func, context) {
  var escapedPrefix = '';
  if (prefix != null) {
    escapedPrefix = escapeUserProvidedKey(prefix) + '/';
  }
  var traverseContext = MapBookKeeping.getPooled(
    array,
    escapedPrefix,
    func,
    context
  );
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  MapBookKeeping.release(traverseContext);
}

var numericPropertyRegex = /^\d+$/;

var warnedAboutNumeric = false;

function createReactFragment (object) {
  if (typeof object !== 'object' || !object || Array.isArray(object)) {
    warning(
      false,
      'React.addons.createFragment only accepts a single object. Got: %s',
      object
    );
    return object;
  }
  if (React.isValidElement(object)) {
    warning(
      false,
      'React.addons.createFragment does not accept a ReactElement ' +
        'without a wrapper object.'
    );
    return object;
  }

  invariant(
    object.nodeType !== 1,
    'React.addons.createFragment(...): Encountered an invalid child; DOM ' +
      'elements are not valid children of React components.'
  );

  var result = [];

  for (var key in object) {
    if (true) {
      if (!warnedAboutNumeric && numericPropertyRegex.test(key)) {
        warning(
          false,
          'React.addons.createFragment(...): Child objects should have ' +
            'non-numeric keys so ordering is preserved.'
        );
        warnedAboutNumeric = true;
      }
    }
    mapIntoWithKeyPrefixInternal(
      object[key],
      result,
      key,
      emptyFunction.thatReturnsArgument
    );
  }

  return result;
};

module.exports = createReactFragment;

}).call(this,require('_process'))
},{"_process":1}]},{},[2])(2)
});