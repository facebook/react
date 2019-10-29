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
    ReactFabric = require('react-native-renderer/fabric');
    jest.resetModules();
    UIManager = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .UIManager;
    jest.mock('shared/ReactFeatureFlags', () =>
      require('shared/forks/ReactFeatureFlags.native-oss'),
    );
    ReactNative = require('react-native-renderer');

    React = require('react');
    createReactNativeComponentClass = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .ReactNativeViewConfigRegistry.register;
  });

  it('find Paper nodes with the Fabric renderer', () => {
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

    ReactNative.render(<Component ref={ref} />, 11);

    let handle = ReactFabric.findNodeHandle(ref.current);
    expect(handle).toBe(3);
  });

  it('dispatches commands on Paper nodes with the Fabric renderer', () => {
    UIManager.dispatchViewManagerCommand.mockReset();
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {title: true},
      uiViewClassName: 'RCTView',
    }));

    let ref = React.createRef();

    ReactNative.render(<View title="bar" ref={ref} />, 11);
    expect(UIManager.dispatchViewManagerCommand).not.toBeCalled();
    ReactFabric.dispatchCommand(ref.current, 'myCommand', [10, 20]);
    expect(UIManager.dispatchViewManagerCommand).toHaveBeenCalledTimes(1);
    expect(UIManager.dispatchViewManagerCommand).toHaveBeenCalledWith(
      expect.any(Number),
      'myCommand',
      [10, 20],
    );

    expect(nativeFabricUIManager.dispatchCommand).not.toBeCalled();
  });
});
