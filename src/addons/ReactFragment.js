/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFragment
 */

'use strict';

var ReactElement = require('ReactElement');

var invariant = require('invariant');
var traverseAllChildren = require('traverseAllChildren');
var warning = require('warning');

/**
 * We used to allow keyed objects to serve as a collection of ReactElements,
 * or nested sets. This allowed us a way to explicitly key a set a fragment of
 * components. This is now being replaced with an opaque data structure.
 * The upgrade path is to call React.addons.createFragment({ key: value }) to
 * create a keyed fragment. The resulting data structure is an array.
 */

var numericPropertyRegex = /^\d+$/;

var userProvidedKeyEscapeRegex = /\//g;
function escapeUserProvidedKey(text) {
  return ('' + text).replace(userProvidedKeyEscapeRegex, '//');
}

function processSingleChildWithContext(ctx, child, childKey) {
  if (ReactElement.isValidElement(child)) {
    child = ReactElement.cloneAndReplaceKey(child, ctx.prefix + childKey);
  }
  // For text components, leave unkeyed
  ctx.result.push(child);
}

var warnedAboutNumeric = false;

var ReactFragment = {
  // Wrap a keyed object in an opaque proxy that warns you if you access any
  // of its properties.
  create: function(object) {
    if (__DEV__) {
      if (typeof object !== 'object' || !object || Array.isArray(object)) {
        warning(
          false,
          'React.addons.createFragment only accepts a single object. Got: %s',
          object
        );
        return object;
      }
      if (ReactElement.isValidElement(object)) {
        warning(
          false,
          'React.addons.createFragment does not accept a ReactElement ' +
          'without a wrapper object.'
        );
        return object;
      }
    }
    invariant(
      object.nodeType !== 1,
      'React.addons.createFragment(...): Encountered an invalid child; DOM ' +
      'elements are not valid children of React components.'
    );

    var result = [];
    var context = {
      result: result,
      prefix: '',
    };

    for (var key in object) {
      if (__DEV__) {
        if (!warnedAboutNumeric && numericPropertyRegex.test(key)) {
          warning(
            false,
            'React.addons.createFragment(...): Child objects should have ' +
            'non-numeric keys so ordering is preserved.'
          );
          warnedAboutNumeric = true;
        }
      }
      context.prefix = escapeUserProvidedKey(key) + '/';
      traverseAllChildren(object[key], processSingleChildWithContext, context);
    }

    return result;
  },
};

module.exports = ReactFragment;
