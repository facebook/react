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

var ReactChildren = require('ReactChildren');
var ReactElement = require('ReactElement');

var emptyFunction = require('fbjs/lib/emptyFunction');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

/**
 * We used to allow keyed objects to serve as a collection of ReactElements,
 * or nested sets. This allowed us a way to explicitly key a set or fragment of
 * components. This is now being replaced with an opaque data structure.
 * The upgrade path is to call React.addons.createFragment({ key: value }) to
 * create a keyed fragment. The resulting data structure is an array.
 */

var numericPropertyRegex = /^\d+$/;

var warnedAboutNumeric = false;

var ReactFragment = {
  /**
   * Wrap a keyed object in an opaque proxy that warns you if you access any
   * of its properties.
   * See https://facebook.github.io/react/docs/create-fragment.html
   */
  create: function(object) {
    if (typeof object !== 'object' || !object || Array.isArray(object)) {
      warning(
        false,
        'React.addons.createFragment only accepts a single object. Got: %s',
        object,
      );
      return object;
    }
    if (ReactElement.isValidElement(object)) {
      warning(
        false,
        'React.addons.createFragment does not accept a ReactElement ' +
          'without a wrapper object.',
      );
      return object;
    }

    invariant(
      object.nodeType !== 1,
      'React.addons.createFragment(...): Encountered an invalid child; DOM ' +
        'elements are not valid children of React components.',
    );

    var result = [];

    for (var key in object) {
      if (__DEV__) {
        if (!warnedAboutNumeric && numericPropertyRegex.test(key)) {
          warning(
            false,
            'React.addons.createFragment(...): Child objects should have ' +
              'non-numeric keys so ordering is preserved.',
          );
          warnedAboutNumeric = true;
        }
      }
      ReactChildren.mapIntoWithKeyPrefixInternal(
        object[key],
        result,
        key,
        emptyFunction.thatReturnsArgument,
      );
    }

    return result;
  },
};

module.exports = ReactFragment;
