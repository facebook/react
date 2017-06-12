/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactChildren
 * @flow
 */

'use strict';

var ReactElement = require('ReactElement');
var emptyFunction = require('fbjs/lib/emptyFunction');
var invariant = require('fbjs/lib/invariant');

var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.
// The Symbol used to tag the ReactElement type. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var REACT_ELEMENT_TYPE =
  (typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element')) ||
  0xeac7;

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var {getCurrentStackAddendum} = require('ReactComponentTreeHook');
}

var SEPARATOR = '.';
var SUBSEPARATOR = ':';

/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */
function escape(key: string): string {
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

var didWarnAboutMaps = false;

/**
 * Generate a key string that identifies a ReactElement within a set.
 */
function getReactElementKey(element, index) {
  // Do some typechecking here since we call this blindly. We want to ensure
  // that we don't block potential future ES APIs.
  if (typeof element === 'object' && element !== null && element.key != null) {
    // Explicit key
    return escape(element.key);
  }
  // Implicit key determined by the index in the set
  return index.toString(36);
}

function traverseAllChildren(children, nameSoFar, callback, traverseContext) {
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
    (type === 'object' &&
      (children: ReactElement).$$typeof === REACT_ELEMENT_TYPE)
  ) {
    callback(
      traverseContext,
      children,
      // If it's the only child, treat the name as if it was wrapped in an array
      // so that it's consistent if the number of children grows.
      nameSoFar === ''
        ? SEPARATOR + getReactElementKey((children: ReactElement), 0)
        : nameSoFar,
    );
    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // Count of children found in the current subtree.
  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = (children[i]: ReactElement);
      nextName = nextNamePrefix + getReactElementKey(child, i);
      subtreeCount += traverseAllChildren(
        child,
        nextName,
        callback,
        traverseContext,
      );
    }
  } else {
    var iteratorFn =
      (ITERATOR_SYMBOL && children[ITERATOR_SYMBOL]) ||
      children[FAUX_ITERATOR_SYMBOL];
    if (typeof iteratorFn === 'function') {
      if (__DEV__) {
        // Warn about using Maps as children
        if (children != null && iteratorFn === children.entries) {
          warning(
            didWarnAboutMaps,
            'Using Maps as children is unsupported and will likely yield ' +
              'unexpected results. Convert it to a sequence/iterable of keyed ' +
              'ReactElements instead.%s',
            getCurrentStackAddendum(),
          );
          didWarnAboutMaps = true;
        }
      }

      var iterator = iteratorFn.call(children);
      var step;
      var ii = 0;
      while (iterator && !(step = iterator.next()).done) {
        child = step != null && (step.value: ReactElement);
        nextName = nextNamePrefix + getReactElementKey(child, ii++);
        subtreeCount += traverseAllChildren(
          child,
          nextName,
          callback,
          traverseContext,
        );
      }
    } else if (type === 'object') {
      var addendum = '';
      if (__DEV__) {
        addendum =
          ' If you meant to render a collection of children, use an array ' +
          'instead.' +
          getCurrentStackAddendum();
      }
      var childrenString = '' + (children: ReactElement);
      invariant(
        false,
        'Objects are not valid as a React child (found: %s).%s',
        childrenString === '[object Object]'
          ? 'object with keys {' +
              Object.keys((children: ReactElement)).join(', ') +
              '}'
          : childrenString,
        addendum,
      );
    }
  }

  return subtreeCount;
}

var userProvidedKeyEscapeRegex = /\/+/g;
function escapeUserProvidedKey(text: string) {
  return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/');
}

function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  var {result, keyPrefix, func, context} = bookKeeping;

  var mappedChild = func.call(context, child, bookKeeping.count++);
  if (mappedChild == null) {
    return;
  }

  if (Array.isArray(mappedChild)) {
    var traverseContext = {
      result: result,
      keyPrefix: childKey != null ? escapeUserProvidedKey(childKey) + '/' : '',
      func: emptyFunction.thatReturnsArgument,
      context: null,
      count: 0,
    };
    traverseAllChildren(
      mappedChild,
      '',
      mapSingleChildIntoContext,
      traverseContext,
    );
  } else {
    if (ReactElement.isValidElement(mappedChild)) {
      mappedChild = ReactElement.cloneAndReplaceKey(
        mappedChild,
        // Keep both the (mapped) and old keys if they differ, just as
        // traverseAllChildren used to do for objects as children
        keyPrefix +
          (mappedChild.key && (!child || child.key !== mappedChild.key)
            ? escapeUserProvidedKey((mappedChild: ReactElement).key) + '/'
            : '') +
          childKey,
      );
    }
    result.push(mappedChild);
  }
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * See https://facebook.github.io/react/docs/react-api.html#react.children.map
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 */
function mapChildren(
  children: mixed,
  func: () => mixed,
  context?: Object,
): ?(mixed[]) {
  if (children == null) {
    return children;
  }
  var result = [];
  var traverseContext = {
    result: result,
    keyPrefix: '',
    func: func,
    context: context,
    count: 0,
  };
  traverseAllChildren(children, '', mapSingleChildIntoContext, traverseContext);
  return result;
}

function forEachSingleChild(bookKeeping, child, name) {
  var {func, context} = bookKeeping;
  func.call(context, child, bookKeeping.count++);
}

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * See https://facebook.github.io/react/docs/react-api.html#react.children.foreach
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 */
function forEachChildren(
  children: mixed,
  forEachFunc: () => mixed,
  forEachContext?: Object,
): void {
  if (children == null) {
    return;
  }
  var traverseContext = {
    func: forEachFunc,
    context: forEachContext,
    count: 0,
  };
  traverseAllChildren(children, '', forEachSingleChild, traverseContext);
}

/**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 *
 * See https://facebook.github.io/react/docs/react-api.html#react.children.toarray
 */
function toArray(children: mixed): ?(mixed[]) {
  if (children == null) {
    return [];
  }
  return mapChildren(children, emptyFunction.thatReturnsArgument);
}

/**
 * Count the number of children that are typically specified as
 * `props.children`.
 *
 * See https://facebook.github.io/react/docs/react-api.html#react.children.count
 */
function countChildren(children: mixed): number {
  if (children == null) {
    return 0;
  }
  return traverseAllChildren(children, '', emptyFunction.thatReturnsNull, null);
}

var ReactChildren = {
  forEach: forEachChildren,
  map: mapChildren,
  count: countChildren,
  toArray: toArray,
};

module.exports = ReactChildren;
