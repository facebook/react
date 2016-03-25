/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactNative;
var createReactNativeComponentClass;

describe('ReactNative', function() {
  beforeEach(function() {
    React = require('React');
    ReactNative = require('ReactNative');
    createReactNativeComponentClass = require('createReactNativeComponentClass');
  });

  it('should be able to create and render a native component', function() {
    var View = createReactNativeComponentClass({
      validAttributes: { foo: true },
      uiViewClassName: 'View',
    });

    ReactNative.render(<View foo="test" />, 1);
  });

});
