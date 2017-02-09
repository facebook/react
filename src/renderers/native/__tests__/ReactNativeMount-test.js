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
var UIManager;

describe('ReactNative', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('React');
    ReactNative = require('ReactNative');
    UIManager = require('UIManager');
    createReactNativeComponentClass = require('createReactNativeComponentClass');
  });

  it('should be able to create and render a native component', () => {
    var View = createReactNativeComponentClass({
      validAttributes: { foo: true },
      uiViewClassName: 'View',
    });

    ReactNative.render(<View foo="test" />, 1);
    expect(UIManager.createView).toBeCalled();
    expect(UIManager.setChildren).toBeCalled();
    expect(UIManager.manageChildren).not.toBeCalled();
    expect(UIManager.updateView).not.toBeCalled();
  });

  it('should be able to create and update a native component', () => {
    var View = createReactNativeComponentClass({
      validAttributes: { foo: true },
      uiViewClassName: 'View',
    });

    ReactNative.render(<View foo="foo" />, 11);

    expect(UIManager.createView.mock.calls.length).toBe(1);
    expect(UIManager.setChildren.mock.calls.length).toBe(1);
    expect(UIManager.manageChildren).not.toBeCalled();
    expect(UIManager.updateView).not.toBeCalled();

    ReactNative.render(<View foo="bar" />, 11);

    expect(UIManager.createView.mock.calls.length).toBe(1);
    expect(UIManager.setChildren.mock.calls.length).toBe(1);
    expect(UIManager.manageChildren).not.toBeCalled();
    expect(UIManager.updateView).toBeCalledWith(2, 'View', { foo: 'bar' });
  });

  it('returns the correct instance and calls it in the callback', () => {
    var View = createReactNativeComponentClass({
      validAttributes: { foo: true },
      uiViewClassName: 'View',
    });

    var a;
    var b;
    var c = ReactNative.render(
      <View foo="foo" ref={(v) => a = v} />,
      11,
      function() {
        b = this;
      }
    );

    expect(a).toBeTruthy();
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

});
