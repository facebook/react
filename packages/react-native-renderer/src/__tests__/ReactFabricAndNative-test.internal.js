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
let createReactNativeComponentClass;

describe('ReactFabric', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactNative = require('react-native-renderer');
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
});
