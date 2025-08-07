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
let StrictMode;
let ReactNative;
let createReactNativeComponentClass;
let UIManager;
let TextInputState;
let ReactNativePrivateInterface;
let act;
let assertConsoleErrorDev;

const DISPATCH_COMMAND_REQUIRES_HOST_COMPONENT =
  "dispatchCommand was called with a ref that isn't a " +
  'native component. Use React.forwardRef to get access to the underlying native component';

const SEND_ACCESSIBILITY_EVENT_REQUIRES_HOST_COMPONENT =
  "sendAccessibilityEvent was called with a ref that isn't a " +
  'native component. Use React.forwardRef to get access to the underlying native component';

describe('ReactNative', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ({act, assertConsoleErrorDev} = require('internal-test-utils'));
    StrictMode = React.StrictMode;
    ReactNative = require('react-native-renderer');
    ReactNativePrivateInterface = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface');
    UIManager =
      require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface').UIManager;
    createReactNativeComponentClass =
      require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
        .ReactNativeViewConfigRegistry.register;
    TextInputState =
      require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface').TextInputState;
  });

  // @gate !disableLegacyMode
  it('should be able to create and render a native component', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    ReactNative.render(<View foo="test" />, 1);
    expect(UIManager.createView).toBeCalled();
    expect(UIManager.setChildren).toBeCalled();
    expect(UIManager.manageChildren).not.toBeCalled();
    expect(UIManager.updateView).not.toBeCalled();
  });

  // @gate !disableLegacyMode
  it('should be able to create and update a native component', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    ReactNative.render(<View foo="foo" />, 11);

    expect(UIManager.createView).toHaveBeenCalledTimes(1);
    expect(UIManager.setChildren).toHaveBeenCalledTimes(1);
    expect(UIManager.manageChildren).not.toBeCalled();
    expect(UIManager.updateView).not.toBeCalled();

    ReactNative.render(<View foo="bar" />, 11);

    expect(UIManager.createView).toHaveBeenCalledTimes(1);
    expect(UIManager.setChildren).toHaveBeenCalledTimes(1);
    expect(UIManager.manageChildren).not.toBeCalled();
    expect(UIManager.updateView).toBeCalledWith(3, 'RCTView', {foo: 'bar'});
  });

  // @gate !disableLegacyMode
  it('should not call UIManager.updateView after render for properties that have not changed', () => {
    const Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTText',
    }));

    ReactNative.render(<Text foo="a">1</Text>, 11);
    expect(UIManager.updateView).not.toBeCalled();

    // If no properties have changed, we shouldn't call updateView.
    ReactNative.render(<Text foo="a">1</Text>, 11);
    expect(UIManager.updateView).not.toBeCalled();

    // Only call updateView for the changed property (and not for text).
    ReactNative.render(<Text foo="b">1</Text>, 11);
    expect(UIManager.updateView).toHaveBeenCalledTimes(1);

    // Only call updateView for the changed text (and no other properties).
    ReactNative.render(<Text foo="b">2</Text>, 11);
    expect(UIManager.updateView).toHaveBeenCalledTimes(2);

    // Call updateView for both changed text and properties.
    ReactNative.render(<Text foo="c">3</Text>, 11);
    expect(UIManager.updateView).toHaveBeenCalledTimes(4);
  });

  // @gate !disableLegacyMode
  it('should call dispatchCommand for native refs', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    UIManager.dispatchViewManagerCommand.mockClear();

    let viewRef;
    ReactNative.render(
      <View
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(UIManager.dispatchViewManagerCommand).not.toBeCalled();
    ReactNative.dispatchCommand(viewRef, 'updateCommand', [10, 20]);
    expect(UIManager.dispatchViewManagerCommand).toHaveBeenCalledTimes(1);
    expect(UIManager.dispatchViewManagerCommand).toHaveBeenCalledWith(
      expect.any(Number),
      'updateCommand',
      [10, 20],
    );
  });

  // @gate !disableLegacyMode
  it('should warn and no-op if calling dispatchCommand on non native refs', () => {
    class BasicClass extends React.Component {
      render() {
        return <React.Fragment />;
      }
    }

    UIManager.dispatchViewManagerCommand.mockReset();

    let viewRef;
    ReactNative.render(
      <BasicClass
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(UIManager.dispatchViewManagerCommand).not.toBeCalled();
    ReactNative.dispatchCommand(viewRef, 'updateCommand', [10, 20]);
    assertConsoleErrorDev([DISPATCH_COMMAND_REQUIRES_HOST_COMPONENT], {
      withoutStack: true,
    });

    expect(UIManager.dispatchViewManagerCommand).not.toBeCalled();
  });

  // @gate !disableLegacyMode
  it('should call sendAccessibilityEvent for native refs', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    ReactNativePrivateInterface.legacySendAccessibilityEvent.mockClear();

    let viewRef;
    ReactNative.render(
      <View
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(
      ReactNativePrivateInterface.legacySendAccessibilityEvent,
    ).not.toBeCalled();
    ReactNative.sendAccessibilityEvent(viewRef, 'focus');
    expect(
      ReactNativePrivateInterface.legacySendAccessibilityEvent,
    ).toHaveBeenCalledTimes(1);
    expect(
      ReactNativePrivateInterface.legacySendAccessibilityEvent,
    ).toHaveBeenCalledWith(expect.any(Number), 'focus');
  });

  // @gate !disableLegacyMode
  it('should warn and no-op if calling sendAccessibilityEvent on non native refs', () => {
    class BasicClass extends React.Component {
      render() {
        return <React.Fragment />;
      }
    }

    UIManager.sendAccessibilityEvent.mockReset();

    let viewRef;
    ReactNative.render(
      <BasicClass
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(UIManager.sendAccessibilityEvent).not.toBeCalled();
    ReactNative.sendAccessibilityEvent(viewRef, 'updateCommand', [10, 20]);
    assertConsoleErrorDev([SEND_ACCESSIBILITY_EVENT_REQUIRES_HOST_COMPONENT], {
      withoutStack: true,
    });

    expect(UIManager.sendAccessibilityEvent).not.toBeCalled();
  });

  // @gate !disableLegacyMode
  it('should not call UIManager.updateView from ref.setNativeProps for properties that have not changed', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    UIManager.updateView.mockReset();

    let viewRef;
    ReactNative.render(
      <View
        foo="bar"
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(UIManager.updateView).not.toBeCalled();

    viewRef.setNativeProps({});
    expect(UIManager.updateView).not.toBeCalled();

    viewRef.setNativeProps({foo: 'baz'});
    expect(UIManager.updateView).toHaveBeenCalledTimes(1);
    expect(UIManager.updateView).toHaveBeenCalledWith(
      expect.any(Number),
      'RCTView',
      {foo: 'baz'},
    );
  });

  // @gate !disableLegacyMode
  it('should call UIManager.measure on ref.measure', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    UIManager.measure.mockClear();

    let viewRef;
    ReactNative.render(
      <View
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(UIManager.measure).not.toBeCalled();
    const successCallback = jest.fn();
    viewRef.measure(successCallback);
    expect(UIManager.measure).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledWith(10, 10, 100, 100, 0, 0);
  });

  // @gate !disableLegacyMode
  it('should call UIManager.measureInWindow on ref.measureInWindow', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    UIManager.measureInWindow.mockClear();

    let viewRef;
    ReactNative.render(
      <View
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(UIManager.measureInWindow).not.toBeCalled();
    const successCallback = jest.fn();
    viewRef.measureInWindow(successCallback);
    expect(UIManager.measureInWindow).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledWith(10, 10, 100, 100);
  });

  // @gate !disableLegacyMode
  it('should support reactTag in ref.measureLayout', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    UIManager.measureLayout.mockClear();

    let viewRef;
    let otherRef;
    ReactNative.render(
      <View>
        <View
          foo="bar"
          ref={ref => {
            viewRef = ref;
          }}
        />
        <View
          ref={ref => {
            otherRef = ref;
          }}
        />
      </View>,
      11,
    );

    expect(UIManager.measureLayout).not.toBeCalled();
    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    viewRef.measureLayout(
      ReactNative.findNodeHandle(otherRef),
      successCallback,
      failureCallback,
    );
    expect(UIManager.measureLayout).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledWith(1, 1, 100, 100);
  });

  // @gate !disableLegacyMode
  it('should support ref in ref.measureLayout of host components', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    UIManager.measureLayout.mockClear();

    let viewRef;
    let otherRef;
    ReactNative.render(
      <View>
        <View
          foo="bar"
          ref={ref => {
            viewRef = ref;
          }}
        />
        <View
          ref={ref => {
            otherRef = ref;
          }}
        />
      </View>,
      11,
    );

    expect(UIManager.measureLayout).not.toBeCalled();
    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    viewRef.measureLayout(otherRef, successCallback, failureCallback);
    expect(UIManager.measureLayout).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledWith(1, 1, 100, 100);
  });

  // @gate !disableLegacyMode
  it('returns the correct instance and calls it in the callback', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    let a;
    let b;
    const c = ReactNative.render(
      <View foo="foo" ref={v => (a = v)} />,
      11,
      function () {
        b = this;
      },
    );

    expect(a).toBeTruthy();
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

  // @gate !disableLegacyMode
  it('renders and reorders children', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {title: true},
      uiViewClassName: 'RCTView',
    }));

    class Component extends React.Component {
      render() {
        const chars = this.props.chars.split('');
        return (
          <View>
            {chars.map(text => (
              <View key={text} title={text} />
            ))}
          </View>
        );
      }
    }

    // Mini multi-child stress test: lots of reorders, some adds, some removes.
    const before = 'abcdefghijklmnopqrst';
    const after = 'mxhpgwfralkeoivcstzy';

    ReactNative.render(<Component chars={before} />, 11);
    expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchInlineSnapshot(`
      "<native root> {}
        RCTView null
          RCTView {"title":"a"}
          RCTView {"title":"b"}
          RCTView {"title":"c"}
          RCTView {"title":"d"}
          RCTView {"title":"e"}
          RCTView {"title":"f"}
          RCTView {"title":"g"}
          RCTView {"title":"h"}
          RCTView {"title":"i"}
          RCTView {"title":"j"}
          RCTView {"title":"k"}
          RCTView {"title":"l"}
          RCTView {"title":"m"}
          RCTView {"title":"n"}
          RCTView {"title":"o"}
          RCTView {"title":"p"}
          RCTView {"title":"q"}
          RCTView {"title":"r"}
          RCTView {"title":"s"}
          RCTView {"title":"t"}"
    `);

    ReactNative.render(<Component chars={after} />, 11);
    expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchInlineSnapshot(`
      "<native root> {}
        RCTView null
          RCTView {"title":"m"}
          RCTView {"title":"x"}
          RCTView {"title":"h"}
          RCTView {"title":"p"}
          RCTView {"title":"g"}
          RCTView {"title":"w"}
          RCTView {"title":"f"}
          RCTView {"title":"r"}
          RCTView {"title":"a"}
          RCTView {"title":"l"}
          RCTView {"title":"k"}
          RCTView {"title":"e"}
          RCTView {"title":"o"}
          RCTView {"title":"i"}
          RCTView {"title":"v"}
          RCTView {"title":"c"}
          RCTView {"title":"s"}
          RCTView {"title":"t"}
          RCTView {"title":"z"}
          RCTView {"title":"y"}"
    `);
  });

  // @gate !disableLegacyMode
  it('calls setState with no arguments', () => {
    let mockArgs;
    class Component extends React.Component {
      componentDidMount() {
        this.setState({}, (...args) => (mockArgs = args));
      }
      render() {
        return false;
      }
    }

    ReactNative.render(<Component />, 11);
    expect(mockArgs.length).toEqual(0);
  });

  // @gate !disableLegacyMode
  it('should not throw when <View> is used inside of a <Text> ancestor', () => {
    const Image = createReactNativeComponentClass('RCTImage', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTImage',
    }));
    const Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTText',
    }));
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTView',
    }));

    ReactNative.render(
      <Text>
        <View />
      </Text>,
      11,
    );

    // Non-View things (e.g. Image) are fine
    ReactNative.render(
      <Text>
        <Image />
      </Text>,
      11,
    );
  });

  // @gate !disableLegacyMode
  it('should throw for text not inside of a <Text> ancestor', async () => {
    const ScrollView = createReactNativeComponentClass('RCTScrollView', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTScrollView',
    }));
    const Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTText',
    }));
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTView',
    }));

    await expect(async () => {
      await act(() => ReactNative.render(<View>this should warn</View>, 11));
    }).rejects.toThrow(
      'Text strings must be rendered within a <Text> component.',
    );

    await expect(async () => {
      await act(() =>
        ReactNative.render(
          <Text>
            <ScrollView>hi hello hi</ScrollView>
          </Text>,
          11,
        ),
      );
    }).rejects.toThrow(
      'Text strings must be rendered within a <Text> component.',
    );
  });

  // @gate !disableLegacyMode
  it('should not throw for text inside of an indirect <Text> ancestor', () => {
    const Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTText',
    }));

    const Indirection = () => 'Hi';

    ReactNative.render(
      <Text>
        <Indirection />
      </Text>,
      11,
    );
  });

  // @gate !disableLegacyMode
  it('findHostInstance_DEPRECATED should warn if used to find a host component inside StrictMode', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    let parent = undefined;
    let child = undefined;

    class ContainsStrictModeChild extends React.Component {
      render() {
        return (
          <StrictMode>
            <View ref={n => (child = n)} />
          </StrictMode>
        );
      }
    }

    ReactNative.render(<ContainsStrictModeChild ref={n => (parent = n)} />, 11);

    const match = ReactNative.findHostInstance_DEPRECATED(parent);
    assertConsoleErrorDev([
      'findHostInstance_DEPRECATED is deprecated in StrictMode. ' +
        'findHostInstance_DEPRECATED was passed an instance of ContainsStrictModeChild which renders StrictMode children. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://react.dev/link/strict-mode-find-node' +
        '\n    in RCTView (at **)' +
        '\n    in ContainsStrictModeChild (at **)',
    ]);
    expect(match).toBe(child);
  });

  // @gate !disableLegacyMode
  it('findHostInstance_DEPRECATED should warn if passed a component that is inside StrictMode', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    let parent = undefined;
    let child = undefined;

    class IsInStrictMode extends React.Component {
      render() {
        return <View ref={n => (child = n)} />;
      }
    }

    ReactNative.render(
      <StrictMode>
        <IsInStrictMode ref={n => (parent = n)} />
      </StrictMode>,
      11,
    );

    const match = ReactNative.findHostInstance_DEPRECATED(parent);
    assertConsoleErrorDev([
      'findHostInstance_DEPRECATED is deprecated in StrictMode. ' +
        'findHostInstance_DEPRECATED was passed an instance of IsInStrictMode which is inside StrictMode. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://react.dev/link/strict-mode-find-node' +
        '\n    in RCTView (at **)' +
        '\n    in IsInStrictMode (at **)',
    ]);
    expect(match).toBe(child);
  });

  // @gate !disableLegacyMode
  it('findNodeHandle should warn if used to find a host component inside StrictMode', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    let parent = undefined;
    let child = undefined;

    class ContainsStrictModeChild extends React.Component {
      render() {
        return (
          <StrictMode>
            <View ref={n => (child = n)} />
          </StrictMode>
        );
      }
    }

    ReactNative.render(<ContainsStrictModeChild ref={n => (parent = n)} />, 11);

    const match = ReactNative.findNodeHandle(parent);
    assertConsoleErrorDev([
      'findNodeHandle is deprecated in StrictMode. ' +
        'findNodeHandle was passed an instance of ContainsStrictModeChild which renders StrictMode children. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://react.dev/link/strict-mode-find-node' +
        '\n    in RCTView (at **)' +
        '\n    in ContainsStrictModeChild (at **)',
    ]);
    expect(match).toBe(child._nativeTag);
  });

  // @gate !disableLegacyMode
  it('findNodeHandle should warn if passed a component that is inside StrictMode', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    let parent = undefined;
    let child = undefined;

    class IsInStrictMode extends React.Component {
      render() {
        return <View ref={n => (child = n)} />;
      }
    }

    ReactNative.render(
      <StrictMode>
        <IsInStrictMode ref={n => (parent = n)} />
      </StrictMode>,
      11,
    );

    const match = ReactNative.findNodeHandle(parent);
    assertConsoleErrorDev([
      'findNodeHandle is deprecated in StrictMode. ' +
        'findNodeHandle was passed an instance of IsInStrictMode which is inside StrictMode. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://react.dev/link/strict-mode-find-node' +
        '\n    in RCTView (at **)' +
        '\n    in IsInStrictMode (at **)',
    ]);
    expect(match).toBe(child._nativeTag);
  });

  // @gate !disableLegacyMode
  it('blur on host component calls TextInputState', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    const viewRef = React.createRef();
    ReactNative.render(<View ref={viewRef} />, 11);

    expect(TextInputState.blurTextInput).not.toBeCalled();

    viewRef.current.blur();

    expect(TextInputState.blurTextInput).toHaveBeenCalledTimes(1);
    expect(TextInputState.blurTextInput).toHaveBeenCalledWith(viewRef.current);
  });

  // @gate !disableLegacyMode
  it('focus on host component calls TextInputState', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    const viewRef = React.createRef();
    ReactNative.render(<View ref={viewRef} />, 11);

    expect(TextInputState.focusTextInput).not.toBeCalled();

    viewRef.current.focus();

    expect(TextInputState.focusTextInput).toHaveBeenCalledTimes(1);
    expect(TextInputState.focusTextInput).toHaveBeenCalledWith(viewRef.current);
  });
});
