/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let createReactNativeComponentClass;
let React;
let ReactNative;

describe('createReactNativeComponentClass', () => {
  beforeEach(() => {
    jest.resetModules();

    createReactNativeComponentClass = require('createReactNativeComponentClass');
    React = require('react');
    ReactNative = require('react-native-renderer');
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

    const Text = createReactNativeComponentClass(
      textViewConfig.uiViewClassName,
      () => textViewConfig,
    );
    const View = createReactNativeComponentClass(
      viewViewConfig.uiViewClassName,
      () => viewViewConfig,
    );

    expect(Text).not.toBe(View);

    ReactNative.render(<Text />, 1);
    ReactNative.render(<View />, 1);
  });

  it('should not allow viewConfigs with duplicate uiViewClassNames to be registered', () => {
    const textViewConfig = {
      validAttributes: {},
      uiViewClassName: 'Text',
    };
    const altTextViewConfig = {
      validAttributes: {},
      uiViewClassName: 'Text', // Same
    };

    createReactNativeComponentClass(
      textViewConfig.uiViewClassName,
      () => textViewConfig,
    );

    expect(() => {
      createReactNativeComponentClass(
        altTextViewConfig.uiViewClassName,
        () => altTextViewConfig,
      );
    }).toThrow('Tried to register two views with the same name Text');
  });
});
