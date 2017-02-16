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

var createReactNativeComponentClass;
var React;
var ReactNative;

describe('createReactNativeComponentClass', () => {
  beforeEach(() => {
    jest.resetModules();

    createReactNativeComponentClass = require('createReactNativeComponentClass');
    React = require('React');
    ReactNative = require('ReactNative');
  });

  it('should register viewConfigs', () => {
    const textViewConfig = {
      validAttributes: {},
      uiViewClassName: 'Text',
    };
    const viewViewConfig = {
      validAttributes: {},
      uiViewClassName: 'View',
    };

    const Text = createReactNativeComponentClass(textViewConfig);
    const View = createReactNativeComponentClass(viewViewConfig);

    expect(Text).not.toBe(View);

    ReactNative.render(<Text />, 1);
    ReactNative.render(<View />, 1);
  });

  it('should allow the viewConfig with duplicate uiViewClassNames to be registered', () => {
    const textViewConfig = {
      validAttributes: {},
      uiViewClassName: 'Text',
    };
    const altTextViewConfig = {
      validAttributes: {},
      uiViewClassName: 'Text', // Same 
    };

    const Text = createReactNativeComponentClass(textViewConfig);
    const AltText = createReactNativeComponentClass(altTextViewConfig);
    
    expect(Text).not.toBe(AltText);

    ReactNative.render(<Text />, 1);
    ReactNative.render(<AltText />, 1);
  });
});
