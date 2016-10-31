/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule definePropWarningGetter
 */

'use strict';

var warning = require('warning');

function definePropWarningGetter(name: string) {
  var specialPropWarningShown;

  return function(props: Object, displayName: string) {
    var warnAboutAccessingKey = function() {
      if (!specialPropWarningShown) {
        specialPropWarningShown = true;
        warning(
          false,
          '%s: `%s` is not a prop. Trying to access it will result ' +
          'in `undefined` being returned. If you need to access the same ' +
          'value within the child component, you should pass it as a different ' +
          'prop. (https://fb.me/react-special-props)',
          displayName,
          name
        );
      }
    };
    warnAboutAccessingKey.isReactWarning = true;
    Object.defineProperty(props, name, {
      get: warnAboutAccessingKey,
      configurable: true,
    });
  };
}

module.exports = definePropWarningGetter;
