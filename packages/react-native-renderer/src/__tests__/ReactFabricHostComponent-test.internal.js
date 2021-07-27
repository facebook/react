/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

import * as React from 'react';

beforeEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();

  require('react-native/Libraries/ReactPrivate/InitializeNativeFabricUIManager');
});

/**
 * Renders a sequence of mock views as dictated by `keyLists`. The `keyLists`
 * argument is an array of arrays which determines the number of render passes,
 * how many views will be rendered in each pass, and what the keys are for each
 * of the views.
 *
 * If an element in `keyLists` is null, the entire root will be unmounted.
 *
 * The return value is an array of arrays with the resulting refs from rendering
 * each corresponding array of keys.
 *
 * If the corresponding array of keys is null, the returned element at that
 * index will also be null.
 */
function mockRenderKeys(keyLists) {
  const ReactFabric = require('react-native-renderer/fabric');
  const createReactNativeComponentClass = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
    .ReactNativeViewConfigRegistry.register;
  const {act} = require('jest-react');

  const mockContainerTag = 11;
  const MockView = createReactNativeComponentClass('RCTMockView', () => ({
    validAttributes: {},
    uiViewClassName: 'RCTMockView',
  }));

  return keyLists.map(keyList => {
    if (Array.isArray(keyList)) {
      const refs = keyList.map(key => undefined);
      act(() => {
        ReactFabric.render(
          <MockView>
            {keyList.map((key, index) => (
              <MockView
                key={key}
                ref={ref => {
                  refs[index] = ref;
                }}
              />
            ))}
          </MockView>,
          mockContainerTag,
        );
      });
      // Clone `refs` to ignore future passes.
      return [...refs];
    }
    if (keyList == null) {
      act(() => {
        ReactFabric.stopSurface(mockContainerTag);
      });
      return null;
    }
    throw new TypeError(
      `Invalid 'keyLists' element of type ${typeof keyList}.`,
    );
  });
}

describe('blur', () => {
  test('blur() invokes TextInputState', () => {
    const {
      TextInputState,
    } = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface');

    const [[fooRef]] = mockRenderKeys([['foo']]);

    fooRef.blur();

    expect(TextInputState.blurTextInput.mock.calls).toEqual([[fooRef]]);
  });
});

describe('focus', () => {
  test('focus() invokes TextInputState', () => {
    const {
      TextInputState,
    } = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface');

    const [[fooRef]] = mockRenderKeys([['foo']]);

    fooRef.focus();

    expect(TextInputState.focusTextInput.mock.calls).toEqual([[fooRef]]);
  });
});

describe('measure', () => {
  test('component.measure(...) invokes callback', () => {
    const [[fooRef]] = mockRenderKeys([['foo']]);

    const callback = jest.fn();
    fooRef.measure(callback);

    expect(nativeFabricUIManager.measure).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls).toEqual([[10, 10, 100, 100, 0, 0]]);
  });

  test('unmounted.measure(...) does nothing', () => {
    const [[fooRef]] = mockRenderKeys([['foo'], null]);

    const callback = jest.fn();
    fooRef.measure(callback);

    expect(nativeFabricUIManager.measure).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('measureInWindow', () => {
  test('component.measureInWindow(...) invokes callback', () => {
    const [[fooRef]] = mockRenderKeys([['foo']]);

    const callback = jest.fn();
    fooRef.measureInWindow(callback);

    expect(nativeFabricUIManager.measureInWindow).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls).toEqual([[10, 10, 100, 100]]);
  });

  test('unmounted.measureInWindow(...) does nothing', () => {
    const [[fooRef]] = mockRenderKeys([['foo'], null]);

    const callback = jest.fn();
    fooRef.measureInWindow(callback);

    expect(nativeFabricUIManager.measureInWindow).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('measureLayout', () => {
  test('component.measureLayout(component, ...) invokes callback', () => {
    const [[fooRef, barRef]] = mockRenderKeys([['foo', 'bar']]);

    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    fooRef.measureLayout(barRef, successCallback, failureCallback);

    expect(nativeFabricUIManager.measureLayout).toHaveBeenCalledTimes(1);
    expect(successCallback.mock.calls).toEqual([[1, 1, 100, 100]]);
  });

  test('unmounted.measureLayout(component, ...) does nothing', () => {
    const [[fooRef, barRef]] = mockRenderKeys([
      ['foo', 'bar'],
      ['foo', null],
    ]);

    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    fooRef.measureLayout(barRef, successCallback, failureCallback);

    expect(nativeFabricUIManager.measureLayout).not.toHaveBeenCalled();
    expect(successCallback).not.toHaveBeenCalled();
  });

  test('component.measureLayout(unmounted, ...) does nothing', () => {
    const [[fooRef, barRef]] = mockRenderKeys([
      ['foo', 'bar'],
      [null, 'bar'],
    ]);

    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    fooRef.measureLayout(barRef, successCallback, failureCallback);

    expect(nativeFabricUIManager.measureLayout).not.toHaveBeenCalled();
    expect(successCallback).not.toHaveBeenCalled();
  });

  test('unmounted.measureLayout(unmounted, ...) does nothing', () => {
    const [[fooRef, barRef]] = mockRenderKeys([['foo', 'bar'], null]);

    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    fooRef.measureLayout(barRef, successCallback, failureCallback);

    expect(nativeFabricUIManager.measureLayout).not.toHaveBeenCalled();
    expect(successCallback).not.toHaveBeenCalled();
  });
});

describe('setNativeProps', () => {
  test('setNativeProps(...) emits a warning', () => {
    const {
      UIManager,
    } = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface');

    const [[fooRef]] = mockRenderKeys([['foo']]);

    expect(() => {
      fooRef.setNativeProps({});
    }).toErrorDev(
      ['Warning: setNativeProps is not currently supported in Fabric'],
      {
        withoutStack: true,
      },
    );
    expect(UIManager.updateView).not.toBeCalled();
  });
});
