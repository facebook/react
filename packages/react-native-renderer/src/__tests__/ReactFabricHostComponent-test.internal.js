/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
async function mockRenderKeys(keyLists) {
  const ReactFabric = require('react-native-renderer/fabric');
  const createReactNativeComponentClass =
    require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .ReactNativeViewConfigRegistry.register;
  const act = require('internal-test-utils').act;

  const mockContainerTag = 11;
  const MockView = createReactNativeComponentClass('RCTMockView', () => ({
    validAttributes: {foo: true},
    uiViewClassName: 'RCTMockView',
  }));

  const result = [];
  for (let i = 0; i < keyLists.length; i++) {
    const keyList = keyLists[i];
    if (Array.isArray(keyList)) {
      const refs = keyList.map(key => undefined);
      await act(() => {
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
      result.push([...refs]);
      continue;
    }
    if (keyList == null) {
      await act(() => {
        ReactFabric.stopSurface(mockContainerTag);
      });
      result.push(null);
      continue;
    }
    throw new TypeError(
      `Invalid 'keyLists' element of type ${typeof keyList}.`,
    );
  }

  return result;
}

describe('blur', () => {
  test('blur() invokes TextInputState', async () => {
    const {
      TextInputState,
    } = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface');

    const [[fooRef]] = await mockRenderKeys([['foo']]);

    fooRef.blur();

    expect(TextInputState.blurTextInput.mock.calls).toEqual([[fooRef]]);
  });
});

describe('focus', () => {
  test('focus() invokes TextInputState', async () => {
    const {
      TextInputState,
    } = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface');

    const [[fooRef]] = await mockRenderKeys([['foo']]);

    fooRef.focus();

    expect(TextInputState.focusTextInput.mock.calls).toEqual([[fooRef]]);
  });
});

describe('measure', () => {
  test('component.measure(...) invokes callback', async () => {
    const [[fooRef]] = await mockRenderKeys([['foo']]);

    const callback = jest.fn();
    fooRef.measure(callback);

    expect(nativeFabricUIManager.measure).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls).toEqual([[10, 10, 100, 100, 0, 0]]);
  });

  test('unmounted.measure(...) does nothing', async () => {
    const [[fooRef]] = await mockRenderKeys([['foo'], null]);

    const callback = jest.fn();
    fooRef.measure(callback);

    expect(nativeFabricUIManager.measure).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('measureInWindow', () => {
  test('component.measureInWindow(...) invokes callback', async () => {
    const [[fooRef]] = await mockRenderKeys([['foo']]);

    const callback = jest.fn();
    fooRef.measureInWindow(callback);

    expect(nativeFabricUIManager.measureInWindow).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls).toEqual([[10, 10, 100, 100]]);
  });

  test('unmounted.measureInWindow(...) does nothing', async () => {
    const [[fooRef]] = await mockRenderKeys([['foo'], null]);

    const callback = jest.fn();
    fooRef.measureInWindow(callback);

    expect(nativeFabricUIManager.measureInWindow).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('measureLayout', () => {
  test('component.measureLayout(component, ...) invokes callback', async () => {
    const [[fooRef, barRef]] = await mockRenderKeys([['foo', 'bar']]);

    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    fooRef.measureLayout(barRef, successCallback, failureCallback);

    expect(nativeFabricUIManager.measureLayout).toHaveBeenCalledTimes(1);
    expect(successCallback.mock.calls).toEqual([[1, 1, 100, 100]]);
  });

  test('unmounted.measureLayout(component, ...) does nothing', async () => {
    const [[fooRef, barRef]] = await mockRenderKeys([
      ['foo', 'bar'],
      ['foo', null],
    ]);

    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    fooRef.measureLayout(barRef, successCallback, failureCallback);

    expect(nativeFabricUIManager.measureLayout).not.toHaveBeenCalled();
    expect(successCallback).not.toHaveBeenCalled();
  });

  test('component.measureLayout(unmounted, ...) does nothing', async () => {
    const [[fooRef, barRef]] = await mockRenderKeys([
      ['foo', 'bar'],
      [null, 'bar'],
    ]);

    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    fooRef.measureLayout(barRef, successCallback, failureCallback);

    expect(nativeFabricUIManager.measureLayout).not.toHaveBeenCalled();
    expect(successCallback).not.toHaveBeenCalled();
  });

  test('unmounted.measureLayout(unmounted, ...) does nothing', async () => {
    const [[fooRef, barRef]] = await mockRenderKeys([['foo', 'bar'], null]);

    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    fooRef.measureLayout(barRef, successCallback, failureCallback);

    expect(nativeFabricUIManager.measureLayout).not.toHaveBeenCalled();
    expect(successCallback).not.toHaveBeenCalled();
  });
});

describe('unstable_getBoundingClientRect', () => {
  test('component.unstable_getBoundingClientRect() returns DOMRect', async () => {
    const [[fooRef]] = await mockRenderKeys([['foo']]);

    const rect = fooRef.unstable_getBoundingClientRect();

    expect(nativeFabricUIManager.getBoundingClientRect).toHaveBeenCalledTimes(
      1,
    );
    expect(rect.toJSON()).toMatchObject({
      x: 10,
      y: 10,
      width: 100,
      height: 100,
    });
  });

  test('unmounted.unstable_getBoundingClientRect() returns empty DOMRect', async () => {
    const [[fooRef]] = await mockRenderKeys([['foo'], null]);

    const rect = fooRef.unstable_getBoundingClientRect();

    expect(nativeFabricUIManager.getBoundingClientRect).not.toHaveBeenCalled();
    expect(rect.toJSON()).toMatchObject({x: 0, y: 0, width: 0, height: 0});
  });
});

describe('setNativeProps', () => {
  test('setNativeProps(...) invokes setNativeProps on Fabric UIManager', async () => {
    const {
      UIManager,
    } = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface');

    const [[fooRef]] = await mockRenderKeys([['foo']]);
    fooRef.setNativeProps({foo: 'baz'});

    expect(UIManager.updateView).not.toBeCalled();
    expect(nativeFabricUIManager.setNativeProps).toHaveBeenCalledTimes(1);
  });
});
