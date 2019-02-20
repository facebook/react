/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactFabric;
let ReactNative;
let UIManager;
let createReactNativeComponentClass;

describe('ReactFabric', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactNative = require('react-native-renderer');
    UIManager = require('UIManager');
    jest.resetModules();
    jest.mock('shared/ReactFeatureFlags', () =>
      require('shared/forks/ReactFeatureFlags.native-oss'),
    );

    React = require('react');
    ReactFabric = require('react-native-renderer/fabric');
    createReactNativeComponentClass = require('ReactNativeViewConfigRegistry')
      .register;
  });

  it('find Fabric nodes with the RN renderer', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {title: true},
      uiViewClassName: 'RCTView',
    }));

    let ref = React.createRef();

    class Component extends React.Component {
      render() {
        return <View title="foo" />;
      }
    }

    ReactFabric.render(<Component ref={ref} />, 11);

    let handle = ReactNative.findNodeHandle(ref.current);
    expect(handle).toBe(2);
  });

  it('sets native props with setNativeProps on Fabric nodes with the RN renderer', () => {
    UIManager.updateView.mockReset();
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {title: true},
      uiViewClassName: 'RCTView',
    }));

    let ref = React.createRef();

    ReactFabric.render(<View title="bar" ref={ref} />, 11);
    expect(UIManager.updateView).not.toBeCalled();
    ReactNative.setNativeProps(ref.current, {title: 'baz'});
    expect(UIManager.updateView).toHaveBeenCalledTimes(1);
    expect(UIManager.updateView).toHaveBeenCalledWith(
      expect.any(Number),
      'RCTView',
      {title: 'baz'},
    );
  });

});
