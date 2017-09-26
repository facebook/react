/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var RCTEventEmitter;
var React;
var ReactErrorUtils;
var ReactNative;
var UIManager;
var createReactNativeComponentClass;

beforeEach(() => {
  jest.resetModuleRegistry();

  RCTEventEmitter = require('RCTEventEmitter');
  React = require('React');
  ReactErrorUtils = require('ReactErrorUtils');
  ReactNative = require('ReactNative');
  UIManager = require('UIManager');
  createReactNativeComponentClass = require('createReactNativeComponentClass');

  // Ensure errors from event callbacks are properly surfaced (otherwise,
  // jest/jsdom swallows them when we do the .dispatchEvent call)
  ReactErrorUtils.invokeGuardedCallback =
    ReactErrorUtils.invokeGuardedCallbackWithCatch;
});

it('handles events', () => {
  expect(RCTEventEmitter.register.mock.calls.length).toBe(1);
  var EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  var View = createReactNativeComponentClass({
    validAttributes: {foo: true},
    uiViewClassName: 'View',
  });

  var log = [];
  ReactNative.render(
    <View
      foo="outer"
      onTouchEnd={() => log.push('outer touchend')}
      onTouchEndCapture={() => log.push('outer touchend capture')}
      onTouchStart={() => log.push('outer touchstart')}
      onTouchStartCapture={() => log.push('outer touchstart capture')}>
      <View
        foo="inner"
        onTouchEndCapture={() => log.push('inner touchend capture')}
        onTouchEnd={() => log.push('inner touchend')}
        onTouchStartCapture={() => log.push('inner touchstart capture')}
        onTouchStart={() => log.push('inner touchstart')}
      />
    </View>,
    1,
  );

  expect(UIManager.createView.mock.calls.length).toBe(2);
  var innerTag = UIManager.createView.mock.calls[1][0];

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: innerTag, identifier: 17}],
    [0],
  );
  EventEmitter.receiveTouches(
    'topTouchEnd',
    [{target: innerTag, identifier: 17}],
    [0],
  );

  expect(log).toEqual([
    'outer touchstart capture',
    'inner touchstart capture',
    'inner touchstart',
    'outer touchstart',
    'outer touchend capture',
    'inner touchend capture',
    'inner touchend',
    'outer touchend',
  ]);
});
