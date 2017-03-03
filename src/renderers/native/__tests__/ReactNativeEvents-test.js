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

var RCTEventEmitter;
var React;
var ReactNative;
var ResponderEventPlugin;
var UIManager;
var createReactNativeComponentClass;

beforeEach(() => {
  jest.resetModules();

  RCTEventEmitter = require('RCTEventEmitter');
  React = require('react');
  ReactNative = require('ReactNative');
  ResponderEventPlugin = require('ResponderEventPlugin');
  UIManager = require('UIManager');
  createReactNativeComponentClass = require('createReactNativeComponentClass');
});

it('handles events', () => {
  expect(RCTEventEmitter.register.mock.calls.length).toBe(1);
  var EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  var View = createReactNativeComponentClass({
    validAttributes: { foo: true },
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
    1
  );

  expect(UIManager.createView.mock.calls.length).toBe(2);

  // Don't depend on the order of createView() calls.
  // Stack creates views outside-in; fiber creates them inside-out.
  var innerTag = UIManager.createView.mock.calls.find(
    args => args[3].foo === 'inner'
  )[0];

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: innerTag, identifier: 17}],
    [0]
  );
  EventEmitter.receiveTouches(
    'topTouchEnd',
    [{target: innerTag, identifier: 17}],
    [0]
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

it('handles when a responder is unmounted while a touch sequence is in progress', () => {
  var EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  var View = createReactNativeComponentClass({
    validAttributes: { id: true },
    uiViewClassName: 'View',
  });

  function getViewById(id) {
    return UIManager.createView.mock.calls.find(
      args => args[3] && args[3].id === id
    )[0];
  }

  function getResponderId() {
    const responder = ResponderEventPlugin._getResponder();
    if (responder === null) {
      return null;
    }
    const props = typeof responder.tag === 'number'
      ? responder.memoizedProps
      : responder._currentElement.props;
    return props ? props.id : null;
  }

  var log = [];
  ReactNative.render(
    <View id="parent">
      <View key={1}>
        <View
          id="one"
          onResponderEnd={() => log.push('one responder end')}
          onResponderStart={() => log.push('one responder start')}
          onStartShouldSetResponder={() => true}
        />
      </View>
      <View key={2}>
        <View
          id="two"
          onResponderEnd={() => log.push('two responder end')}
          onResponderStart={() => log.push('two responder start')}
          onStartShouldSetResponder={() => true}
        />
      </View>
    </View>,
    1
  );

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: getViewById('one'), identifier: 17}],
    [0]
  );

  expect(getResponderId()).toBe('one');
  expect(log).toEqual(['one responder start']);
  log.splice(0);

  ReactNative.render(
    <View id="parent">
      <View key={2}>
        <View
          id="two"
          onResponderEnd={() => log.push('two responder end')}
          onResponderStart={() => log.push('two responder start')}
          onStartShouldSetResponder={() => true}
        />
      </View>
    </View>,
    1
  );

  // TODO Verify the onResponderEnd listener has been called (before the unmount)
  // expect(log).toEqual(['one responder end']);
  // log.splice(0);

  EventEmitter.receiveTouches(
    'topTouchEnd',
    [{target: getViewById('two'), identifier: 17}],
    [0]
  );

  expect(getResponderId()).toBeNull();
  expect(log).toEqual([]);

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: getViewById('two'), identifier: 17}],
    [0]
  );

  expect(getResponderId()).toBe('two');
  expect(log).toEqual(['two responder start']);
});
