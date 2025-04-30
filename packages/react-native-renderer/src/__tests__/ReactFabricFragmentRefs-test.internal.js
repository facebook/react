/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
let createReactNativeComponentClass;
let act;
let View;
let Text;

describe('Fabric FragmentRefs', () => {
  beforeEach(() => {
    jest.resetModules();

    require('react-native/Libraries/ReactPrivate/InitializeNativeFabricUIManager');

    React = require('react');
    ReactFabric = require('react-native-renderer/fabric');
    createReactNativeComponentClass =
      require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
        .ReactNativeViewConfigRegistry.register;
    ({act} = require('internal-test-utils'));
    View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {nativeID: true},
      uiViewClassName: 'RCTView',
    }));
    Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {nativeID: true},
      uiViewClassName: 'RCTText',
    }));
  });

  // @gate enableFragmentRefs
  it('attaches a ref to Fragment', async () => {
    const fragmentRef = React.createRef();

    await act(() =>
      ReactFabric.render(
        <View>
          <React.Fragment ref={fragmentRef}>
            <View>
              <Text>Hi</Text>
            </View>
          </React.Fragment>
        </View>,
        11,
        null,
        true,
      ),
    );

    expect(fragmentRef.current).not.toBe(null);
  });

  // @gate enableFragmentRefs
  it('accepts a ref callback', async () => {
    let fragmentRef;

    await act(() => {
      ReactFabric.render(
        <React.Fragment ref={ref => (fragmentRef = ref)}>
          <View nativeID="child">
            <Text>Hi</Text>
          </View>
        </React.Fragment>,
        11,
        null,
        true,
      );
    });

    expect(fragmentRef && fragmentRef._fragmentFiber).toBeTruthy();
  });
});
