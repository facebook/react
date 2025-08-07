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

let PropTypes;
let RCTEventEmitter;
let React;
let act;
let ReactNative;
let ResponderEventPlugin;
let UIManager;
let createReactNativeComponentClass;
let assertConsoleErrorDev;

// Parallels requireNativeComponent() in that it lazily constructs a view config,
// And registers view manager event types with ReactNativeViewConfigRegistry.
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

    return viewConfig;
  };

  return createReactNativeComponentClass(uiViewClassName, getViewConfig);
};

beforeEach(() => {
  jest.resetModules();

  PropTypes = require('prop-types');
  RCTEventEmitter =
    require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface').RCTEventEmitter;
  React = require('react');
  act = require('internal-test-utils').act;
  assertConsoleErrorDev = require('internal-test-utils').assertConsoleErrorDev;
  ReactNative = require('react-native-renderer');
  ResponderEventPlugin =
    require('react-native-renderer/src/legacy-events/ResponderEventPlugin').default;
  UIManager =
    require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface').UIManager;
  createReactNativeComponentClass =
    require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .ReactNativeViewConfigRegistry.register;
});

// @gate !disableLegacyMode
test('fails to register the same event name with different types', async () => {
  const InvalidEvents = createReactNativeComponentClass('InvalidEvents', () => {
    if (!__DEV__) {
      // Simulate a registration error in prod.
      throw new Error('Event cannot be both direct and bubbling: topChange');
    }

    // This view config has the same bubbling and direct event name
    // which will fail to register in development.
    return {
      uiViewClassName: 'InvalidEvents',
      validAttributes: {
        onChange: true,
      },
      bubblingEventTypes: {
        topChange: {
          phasedRegistrationNames: {
            bubbled: 'onChange',
            captured: 'onChangeCapture',
          },
        },
      },
      directEventTypes: {
        topChange: {
          registrationName: 'onChange',
        },
      },
    };
  });

  // The first time this renders,
  // we attempt to register the view config and fail.
  await expect(
    async () => await act(() => ReactNative.render(<InvalidEvents />, 1)),
  ).rejects.toThrow('Event cannot be both direct and bubbling: topChange');

  // Continue to re-register the config and
  // fail so that we don't mask the above failure.
  await expect(
    async () => await act(() => ReactNative.render(<InvalidEvents />, 1)),
  ).rejects.toThrow('Event cannot be both direct and bubbling: topChange');
});

// @gate !disableLegacyMode
test('fails if unknown/unsupported event types are dispatched', () => {
  expect(RCTEventEmitter.register).toHaveBeenCalledTimes(1);
  const EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  const View = fakeRequireNativeComponent('View', {});

  ReactNative.render(<View onUnspecifiedEvent={() => {}} />, 1);

  expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchInlineSnapshot(`
    "<native root> {}
      View null"
  `);
  expect(UIManager.createView).toHaveBeenCalledTimes(1);

  const target = UIManager.createView.mock.calls[0][0];

  expect(() => {
    EventEmitter.receiveTouches(
      'unspecifiedEvent',
      [{target, identifier: 17}],
      [0],
    );
  }).toThrow('Unsupported top level event type "unspecifiedEvent" dispatched');
});

// @gate !disableLegacyMode
test('handles events', () => {
  expect(RCTEventEmitter.register).toHaveBeenCalledTimes(1);
  const EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  const View = fakeRequireNativeComponent('View', {foo: true});

  const log = [];
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

  expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchInlineSnapshot(`
    "<native root> {}
      View {"foo":"outer"}
        View {"foo":"inner"}"
  `);
  expect(UIManager.createView).toHaveBeenCalledTimes(2);

  // Don't depend on the order of createView() calls.
  // Stack creates views outside-in; fiber creates them inside-out.
  const innerTag = UIManager.createView.mock.calls.find(
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

// @gate !disableLegacyContext || !__DEV__
// @gate !disableLegacyMode
test('handles events on text nodes', () => {
  expect(RCTEventEmitter.register).toHaveBeenCalledTimes(1);
  const EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  const Text = fakeRequireNativeComponent('RCTText', {});

  class ContextHack extends React.Component {
    static childContextTypes = {isInAParentText: PropTypes.bool};
    getChildContext() {
      return {isInAParentText: true};
    }
    render() {
      return this.props.children;
    }
  }

  const log = [];
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
  assertConsoleErrorDev([
    'ContextHack uses the legacy childContextTypes API which will soon be removed. ' +
      'Use React.createContext() instead. ' +
      '(https://react.dev/link/legacy-context)' +
      '\n    in ContextHack (at **)',
  ]);

  expect(UIManager.createView).toHaveBeenCalledTimes(5);

  // Don't depend on the order of createView() calls.
  // Stack creates views outside-in; fiber creates them inside-out.
  const innerTagString = UIManager.createView.mock.calls.find(
    args => args[3] && args[3].text === 'Text Content',
  )[0];
  const innerTagNumber = UIManager.createView.mock.calls.find(
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

// @gate !disableLegacyMode
test('handles when a responder is unmounted while a touch sequence is in progress', () => {
  const EventEmitter = RCTEventEmitter.register.mock.calls[0][0];
  const View = fakeRequireNativeComponent('View', {id: true});

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

  const log = [];
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

// @gate !disableLegacyMode
test('handles events without target', () => {
  const EventEmitter = RCTEventEmitter.register.mock.calls[0][0];

  const View = fakeRequireNativeComponent('View', {id: true});

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

  const log = [];

  function render(renderFirstComponent) {
    ReactNative.render(
      <View id="parent">
        <View key={1}>
          {renderFirstComponent ? (
            <View
              id="one"
              onResponderEnd={() => log.push('one responder end')}
              onResponderStart={() => log.push('one responder start')}
              onStartShouldSetResponder={() => true}
            />
          ) : null}
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

// @gate !disableLegacyMode
test('dispatches event with target as instance', () => {
  const EventEmitter = RCTEventEmitter.register.mock.calls[0][0];

  const View = fakeRequireNativeComponent('View', {id: true});

  function getViewById(id) {
    return UIManager.createView.mock.calls.find(
      args => args[3] && args[3].id === id,
    )[0];
  }

  const ref1 = React.createRef();
  const ref2 = React.createRef();

  ReactNative.render(
    <View id="parent">
      <View
        ref={ref1}
        id="one"
        onResponderStart={event => {
          expect(ref1.current).not.toBeNull();
          // Check for referential equality
          expect(ref1.current).toBe(event.target);
          expect(ref1.current).toBe(event.currentTarget);
        }}
        onStartShouldSetResponder={() => true}
      />
      <View
        ref={ref2}
        id="two"
        onResponderStart={event => {
          expect(ref2.current).not.toBeNull();
          // Check for referential equality
          expect(ref2.current).toBe(event.target);
          expect(ref2.current).toBe(event.currentTarget);
        }}
        onStartShouldSetResponder={() => true}
      />
    </View>,
    1,
  );

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: getViewById('one'), identifier: 17}],
    [0],
  );

  EventEmitter.receiveTouches(
    'topTouchEnd',
    [{target: getViewById('one'), identifier: 17}],
    [0],
  );

  EventEmitter.receiveTouches(
    'topTouchStart',
    [{target: getViewById('two'), identifier: 18}],
    [0],
  );

  EventEmitter.receiveTouches(
    'topTouchEnd',
    [{target: getViewById('two'), identifier: 18}],
    [0],
  );

  expect.assertions(6);
});
