/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var PropTypes;
var RCTEventEmitter;
var React;
var ReactNative;
var ReactNativeBridgeEventPlugin;
var ResponderEventPlugin;
var UIManager;
var createReactNativeComponentClass;

// Parallels requireNativeComponent() in that it lazily constructs a view config,
// And registers view manager event types with ReactNativeBridgeEventPlugin.
const fakeRequireNativeComponent = (uiViewClassName, validAttributes) => {
  const getViewConfig = () => {
    const viewConfig = {
      uiViewClassName,
      validAttributes,
      bubblingEventTypes: {
        topTouchCancel: {
          phasedRegistrationNames: {
            bubbled: 'onTouchCancel',
            captured: 'onTouchCancelCapture',
          },
        },
        topTouchEnd: {
          phasedRegistrationNames: {
            bubbled: 'onTouchEnd',
            captured: 'onTouchEndCapture',
          },
        },
        topTouchMove: {
          phasedRegistrationNames: {
            bubbled: 'onTouchMove',
            captured: 'onTouchMoveCapture',
          },
        },
        topTouchStart: {
          phasedRegistrationNames: {
            bubbled: 'onTouchStart',
            captured: 'onTouchStartCapture',
          },
        },
      },
      directEventTypes: {},
    };

    ReactNativeBridgeEventPlugin.processEventTypes(viewConfig);

    return viewConfig;
  };

  return createReactNativeComponentClass(uiViewClassName, getViewConfig);
};

beforeEach(() => {
  jest.resetModules();

  PropTypes = require('prop-types');
  RCTEventEmitter = require('RCTEventEmitter');
  React = require('react');
  ReactNative = require('react-native-renderer');
  ReactNativeBridgeEventPlugin = require('react-native-renderer/src/ReactNativeBridgeEventPlugin');
  ResponderEventPlugin = require('events/ResponderEventPlugin');
  UIManager = require('UIManager');
  createReactNativeComponentClass = require('react-native-renderer/src/createReactNativeComponentClass');
});

it('fails if unknown/unsupported event types are dispatched', () => {
  expect(RCTEventEmitter.register.mock.calls.length).toBe(1);
  var EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  var View = fakeRequireNativeComponent('View', {});

  ReactNative.render(<View onUnspecifiedEvent={() => {}} />, 1);

  expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();
  expect(UIManager.createView.mock.calls.length).toBe(1);

  const target = UIManager.createView.mock.calls[0][0];

  expect(() => {
    EventEmitter.receiveTouches(
      'unspecifiedEvent',
      [{target, identifier: 17}],
      [0],
    );
  }).toThrow('Unsupported top level event type "unspecifiedEvent" dispatched');
});

it('handles events', () => {
  expect(RCTEventEmitter.register.mock.calls.length).toBe(1);
  var EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  var View = fakeRequireNativeComponent('View', {foo: true});

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

  expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();
  expect(UIManager.createView.mock.calls.length).toBe(2);

  // Don't depend on the order of createView() calls.
  // Stack creates views outside-in; fiber creates them inside-out.
  var innerTag = UIManager.createView.mock.calls.find(
    args => args[3].foo === 'inner',
  )[0];

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

it('handles events on text nodes', () => {
  expect(RCTEventEmitter.register.mock.calls.length).toBe(1);
  var EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  var Text = fakeRequireNativeComponent('Text', {});

  class ContextHack extends React.Component {
    static childContextTypes = {isInAParentText: PropTypes.bool};
    getChildContext() {
      return {isInAParentText: true};
    }
    render() {
      return this.props.children;
    }
  }

  var log = [];
  ReactNative.render(
    <ContextHack>
      <Text>
        <Text
          onTouchEnd={() => log.push('string touchend')}
          onTouchEndCapture={() => log.push('string touchend capture')}
          onTouchStart={() => log.push('string touchstart')}
          onTouchStartCapture={() => log.push('string touchstart capture')}>
          Text Content
        </Text>
        <Text
          onTouchEnd={() => log.push('number touchend')}
          onTouchEndCapture={() => log.push('number touchend capture')}
          onTouchStart={() => log.push('number touchstart')}
          onTouchStartCapture={() => log.push('number touchstart capture')}>
          {123}
        </Text>
      </Text>
    </ContextHack>,
    1,
  );

  expect(UIManager.createView.mock.calls.length).toBe(5);

  // Don't depend on the order of createView() calls.
  // Stack creates views outside-in; fiber creates them inside-out.
  var innerTagString = UIManager.createView.mock.calls.find(
    args => args[3] && args[3].text === 'Text Content',
  )[0];
  var innerTagNumber = UIManager.createView.mock.calls.find(
    args => args[3] && args[3].text === '123',
  )[0];

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: innerTagString, identifier: 17}],
    [0],
  );
  EventEmitter.receiveTouches(
    'topTouchEnd',
    [{target: innerTagString, identifier: 17}],
    [0],
  );

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: innerTagNumber, identifier: 18}],
    [0],
  );
  EventEmitter.receiveTouches(
    'topTouchEnd',
    [{target: innerTagNumber, identifier: 18}],
    [0],
  );

  expect(log).toEqual([
    'string touchstart capture',
    'string touchstart',
    'string touchend capture',
    'string touchend',
    'number touchstart capture',
    'number touchstart',
    'number touchend capture',
    'number touchend',
  ]);
});

it('handles when a responder is unmounted while a touch sequence is in progress', () => {
  var EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  var View = fakeRequireNativeComponent('View', {id: true});

  function getViewById(id) {
    return UIManager.createView.mock.calls.find(
      args => args[3] && args[3].id === id,
    )[0];
  }

  function getResponderId() {
    const responder = ResponderEventPlugin._getResponder();
    if (responder === null) {
      return null;
    }
    const props = responder.memoizedProps;
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
    1,
  );

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: getViewById('one'), identifier: 17}],
    [0],
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
    1,
  );

  // TODO Verify the onResponderEnd listener has been called (before the unmount)
  // expect(log).toEqual(['one responder end']);
  // log.splice(0);

  EventEmitter.receiveTouches(
    'topTouchEnd',
    [{target: getViewById('two'), identifier: 17}],
    [0],
  );

  expect(getResponderId()).toBeNull();
  expect(log).toEqual([]);

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: getViewById('two'), identifier: 17}],
    [0],
  );

  expect(getResponderId()).toBe('two');
  expect(log).toEqual(['two responder start']);
});

it('handles events without target', () => {
  var EventEmitter = RCTEventEmitter.register.mock.calls[0][0];

  var View = fakeRequireNativeComponent('View', {id: true});

  function getViewById(id) {
    return UIManager.createView.mock.calls.find(
      args => args[3] && args[3].id === id,
    )[0];
  }

  function getResponderId() {
    const responder = ResponderEventPlugin._getResponder();
    if (responder === null) {
      return null;
    }
    const props = responder.memoizedProps;
    return props ? props.id : null;
  }

  var log = [];

  function render(renderFirstComponent) {
    ReactNative.render(
      <View id="parent">
        <View key={1}>
          {renderFirstComponent
            ? <View
                id="one"
                onResponderEnd={() => log.push('one responder end')}
                onResponderStart={() => log.push('one responder start')}
                onStartShouldSetResponder={() => true}
              />
            : null}
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
      1,
    );
  }

  render(true);

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: getViewById('one'), identifier: 17}],
    [0],
  );

  // Unmounting component 'one'.
  render(false);

  EventEmitter.receiveTouches(
    'topTouchEnd',
    [{target: getViewById('one'), identifier: 17}],
    [0],
  );

  expect(getResponderId()).toBe(null);

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: getViewById('two'), identifier: 18}],
    [0],
  );

  expect(getResponderId()).toBe('two');

  EventEmitter.receiveTouches(
    'topTouchEnd',
    [{target: getViewById('two'), identifier: 18}],
    [0],
  );

  expect(getResponderId()).toBe(null);

  expect(log).toEqual([
    'one responder start',
    'two responder start',
    'two responder end',
  ]);
});
