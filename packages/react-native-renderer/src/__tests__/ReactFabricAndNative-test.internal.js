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
    require('react-native/Libraries/ReactPrivate/InitializeNativeFabricUIManager');
    ReactNative = require('react-native-renderer');
    jest.resetModules();
    UIManager = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .UIManager;
    jest.mock('shared/ReactFeatureFlags', () =>
      require('shared/forks/ReactFeatureFlags.native-oss'),
    );

    React = require('react');
    ReactFabric = require('react-native-renderer/fabric');
    createReactNativeComponentClass = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .ReactNativeViewConfigRegistry.register;
  });

  it('find Fabric instances with the RN renderer', () => {
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

    let instance = ReactNative.findHostInstance_DEPRECATED(ref.current);
    expect(instance._nativeTag).toBe(2);
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

  it('dispatches commands on Fabric nodes with the RN renderer', () => {
    UIManager.dispatchViewManagerCommand.mockReset();
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {title: true},
      uiViewClassName: 'RCTView',
    }));

    let ref = React.createRef();

    ReactFabric.render(<View title="bar" ref={ref} />, 11);
    expect(UIManager.dispatchViewManagerCommand).not.toBeCalled();
    ReactNative.dispatchCommand(ref.current, 'myCommand', [10, 20]);
    expect(UIManager.dispatchViewManagerCommand).toHaveBeenCalledTimes(1);
    expect(UIManager.dispatchViewManagerCommand).toHaveBeenCalledWith(
      expect.any(Number),
      'myCommand',
      [10, 20],
    );
  });
});
