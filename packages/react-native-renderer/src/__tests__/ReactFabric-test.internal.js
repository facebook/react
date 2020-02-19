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
let ReactFeatureFlags;
let createReactNativeComponentClass;
let UIManager;
let StrictMode;
let TextInputState;

const SET_NATIVE_PROPS_NOT_SUPPORTED_MESSAGE =
  'Warning: setNativeProps is not currently supported in Fabric';

const DISPATCH_COMMAND_REQUIRES_HOST_COMPONENT =
  "Warning: dispatchCommand was called with a ref that isn't a " +
  'native component. Use React.forwardRef to get access to the underlying native component';

jest.mock('shared/ReactFeatureFlags', () =>
  require('shared/forks/ReactFeatureFlags.native-oss'),
);

describe('ReactFabric', () => {
  beforeEach(() => {
    jest.resetModules();

    require('react-native/Libraries/ReactPrivate/InitializeNativeFabricUIManager');

    React = require('react');
    StrictMode = React.StrictMode;
    ReactFabric = require('react-native-renderer/fabric');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    UIManager = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .UIManager;
    createReactNativeComponentClass = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .ReactNativeViewConfigRegistry.register;
    TextInputState = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .TextInputState;
  });

  it('should be able to create and render a native component', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    ReactFabric.render(<View foo="test" />, 1);
    expect(nativeFabricUIManager.createNode).toBeCalled();
    expect(nativeFabricUIManager.appendChild).not.toBeCalled();
    expect(nativeFabricUIManager.completeRoot).toBeCalled();
  });

  it('should be able to create and update a native component', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    const firstNode = {};

    nativeFabricUIManager.createNode.mockReturnValue(firstNode);

    ReactFabric.render(<View foo="foo" />, 11);

    expect(nativeFabricUIManager.createNode).toHaveBeenCalledTimes(1);

    ReactFabric.render(<View foo="bar" />, 11);

    expect(nativeFabricUIManager.createNode).toHaveBeenCalledTimes(1);
    expect(nativeFabricUIManager.cloneNodeWithNewProps).toHaveBeenCalledTimes(
      1,
    );
    expect(nativeFabricUIManager.cloneNodeWithNewProps.mock.calls[0][0]).toBe(
      firstNode,
    );
    expect(
      nativeFabricUIManager.cloneNodeWithNewProps.mock.calls[0][1],
    ).toEqual({
      foo: 'bar',
    });
  });

  it('should not call FabricUIManager.cloneNode after render for properties that have not changed', () => {
    const Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTText',
    }));

    ReactFabric.render(<Text foo="a">1</Text>, 11);
    expect(nativeFabricUIManager.cloneNode).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewProps).not.toBeCalled();
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
    ).not.toBeCalled();

    // If no properties have changed, we shouldn't call cloneNode.
    ReactFabric.render(<Text foo="a">1</Text>, 11);
    expect(nativeFabricUIManager.cloneNode).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewProps).not.toBeCalled();
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
    ).not.toBeCalled();

    // Only call cloneNode for the changed property (and not for text).
    ReactFabric.render(<Text foo="b">1</Text>, 11);
    expect(nativeFabricUIManager.cloneNode).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewProps).toHaveBeenCalledTimes(
      1,
    );
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
    ).not.toBeCalled();

    // Only call cloneNode for the changed text (and no other properties).
    ReactFabric.render(<Text foo="b">2</Text>, 11);
    expect(nativeFabricUIManager.cloneNode).not.toBeCalled();
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildren,
    ).toHaveBeenCalledTimes(1);
    expect(nativeFabricUIManager.cloneNodeWithNewProps).toHaveBeenCalledTimes(
      1,
    );
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
    ).not.toBeCalled();

    // Call cloneNode for both changed text and properties.
    ReactFabric.render(<Text foo="c">3</Text>, 11);
    expect(nativeFabricUIManager.cloneNode).not.toBeCalled();
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildren,
    ).toHaveBeenCalledTimes(1);
    expect(nativeFabricUIManager.cloneNodeWithNewProps).toHaveBeenCalledTimes(
      1,
    );
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
    ).toHaveBeenCalledTimes(1);
  });

  it('should only pass props diffs to FabricUIManager.cloneNode', () => {
    const Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {foo: true, bar: true},
      uiViewClassName: 'RCTText',
    }));

    ReactFabric.render(
      <Text foo="a" bar="a">
        1
      </Text>,
      11,
    );
    expect(nativeFabricUIManager.cloneNode).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewProps).not.toBeCalled();
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
    ).not.toBeCalled();

    ReactFabric.render(
      <Text foo="a" bar="b">
        1
      </Text>,
      11,
    );
    expect(
      nativeFabricUIManager.cloneNodeWithNewProps.mock.calls[0][1],
    ).toEqual({
      bar: 'b',
    });
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();

    ReactFabric.render(
      <Text foo="b" bar="b">
        2
      </Text>,
      11,
    );
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps.mock.calls[0][1],
    ).toEqual({
      foo: 'b',
    });
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();
  });

  it('should not call UIManager.updateView from ref.setNativeProps', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    UIManager.updateView.mockReset();

    let viewRef;
    ReactFabric.render(
      <View
        foo="bar"
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );
    expect(UIManager.updateView).not.toBeCalled();

    expect(() => {
      viewRef.setNativeProps({});
    }).toErrorDev([SET_NATIVE_PROPS_NOT_SUPPORTED_MESSAGE], {
      withoutStack: true,
    });

    expect(UIManager.updateView).not.toBeCalled();

    expect(() => {
      viewRef.setNativeProps({foo: 'baz'});
    }).toErrorDev([SET_NATIVE_PROPS_NOT_SUPPORTED_MESSAGE], {
      withoutStack: true,
    });
    expect(UIManager.updateView).not.toBeCalled();
  });

  it('should call dispatchCommand for native refs', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    nativeFabricUIManager.dispatchCommand.mockClear();

    let viewRef;
    ReactFabric.render(
      <View
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(nativeFabricUIManager.dispatchCommand).not.toBeCalled();
    ReactFabric.dispatchCommand(viewRef, 'updateCommand', [10, 20]);
    expect(nativeFabricUIManager.dispatchCommand).toHaveBeenCalledTimes(1);
    expect(
      nativeFabricUIManager.dispatchCommand,
    ).toHaveBeenCalledWith(expect.any(Object), 'updateCommand', [10, 20]);
  });

  it('should warn and no-op if calling dispatchCommand on non native refs', () => {
    class BasicClass extends React.Component {
      render() {
        return <React.Fragment />;
      }
    }

    nativeFabricUIManager.dispatchCommand.mockReset();

    let viewRef;
    ReactFabric.render(
      <BasicClass
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(nativeFabricUIManager.dispatchCommand).not.toBeCalled();
    expect(() => {
      ReactFabric.dispatchCommand(viewRef, 'updateCommand', [10, 20]);
    }).toErrorDev([DISPATCH_COMMAND_REQUIRES_HOST_COMPONENT], {
      withoutStack: true,
    });

    expect(nativeFabricUIManager.dispatchCommand).not.toBeCalled();
  });

  it('should call FabricUIManager.measure on ref.measure', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    nativeFabricUIManager.measure.mockClear();

    let viewRef;
    ReactFabric.render(
      <View
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(nativeFabricUIManager.measure).not.toBeCalled();
    const successCallback = jest.fn();
    viewRef.measure(successCallback);
    expect(nativeFabricUIManager.measure).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledWith(10, 10, 100, 100, 0, 0);
  });

  it('should call FabricUIManager.measureInWindow on ref.measureInWindow', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    nativeFabricUIManager.measureInWindow.mockClear();

    let viewRef;
    ReactFabric.render(
      <View
        ref={ref => {
          viewRef = ref;
        }}
      />,
      11,
    );

    expect(nativeFabricUIManager.measureInWindow).not.toBeCalled();
    const successCallback = jest.fn();
    viewRef.measureInWindow(successCallback);
    expect(nativeFabricUIManager.measureInWindow).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledWith(10, 10, 100, 100);
  });

  it('should support ref in ref.measureLayout', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    nativeFabricUIManager.measureLayout.mockClear();

    let viewRef;
    let otherRef;
    ReactFabric.render(
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

    expect(nativeFabricUIManager.measureLayout).not.toBeCalled();
    const successCallback = jest.fn();
    const failureCallback = jest.fn();
    viewRef.measureLayout(otherRef, successCallback, failureCallback);
    expect(nativeFabricUIManager.measureLayout).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledWith(1, 1, 100, 100);
  });

  it('returns the correct instance and calls it in the callback', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    let a;
    let b;
    const c = ReactFabric.render(
      <View foo="foo" ref={v => (a = v)} />,
      11,
      function() {
        b = this;
      },
    );

    expect(a).toBeTruthy();
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

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

    ReactFabric.render(<Component chars={before} />, 11);
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();

    ReactFabric.render(<Component chars={after} />, 11);
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();
  });

  it('recreates host parents even if only children changed', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {title: true},
      uiViewClassName: 'RCTView',
    }));

    const before = 'abcdefghijklmnopqrst';
    const after = 'mxhpgwfralkeoivcstzy';

    class Component extends React.Component {
      state = {
        chars: before,
      };
      render() {
        const chars = this.state.chars.split('');
        return (
          <View>
            {chars.map(text => (
              <View key={text} title={text} />
            ))}
          </View>
        );
      }
    }

    const ref = React.createRef();
    // Wrap in a host node.
    ReactFabric.render(
      <View>
        <Component ref={ref} />
      </View>,
      11,
    );
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();

    // Call setState() so that we skip over the top-level host node.
    // It should still get recreated despite a bailout.
    ref.current.setState({
      chars: after,
    });
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();
  });

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

    ReactFabric.render(<Component />, 11);
    expect(mockArgs.length).toEqual(0);
  });

  it('should call complete after inserting children', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    const snapshots = [];
    nativeFabricUIManager.completeRoot.mockImplementation(function(
      rootTag,
      newChildSet,
    ) {
      snapshots.push(
        nativeFabricUIManager.__dumpChildSetForJestTestsOnly(newChildSet),
      );
    });

    ReactFabric.render(
      <View foo="a">
        <View foo="b" />
      </View>,
      22,
    );
    expect(snapshots).toMatchSnapshot();
  });

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

    ReactFabric.render(
      <Text>
        <View />
      </Text>,
      11,
    );

    ReactFabric.render(
      <Text>
        <Image />
      </Text>,
      11,
    );
  });

  it('should throw for text not inside of a <Text> ancestor', () => {
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

    expect(() => ReactFabric.render(<View>this should warn</View>, 11)).toThrow(
      'Text strings must be rendered within a <Text> component.',
    );

    expect(() =>
      ReactFabric.render(
        <Text>
          <ScrollView>hi hello hi</ScrollView>
        </Text>,
        11,
      ),
    ).toThrow('Text strings must be rendered within a <Text> component.');
  });

  it('should not throw for text inside of an indirect <Text> ancestor', () => {
    const Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTText',
    }));

    const Indirection = () => 'Hi';

    ReactFabric.render(
      <Text>
        <Indirection />
      </Text>,
      11,
    );
  });

  it('dispatches events to the last committed props', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTView',
      directEventTypes: {
        topTouchStart: {
          registrationName: 'onTouchStart',
        },
      },
    }));

    const touchStart = jest.fn();
    const touchStart2 = jest.fn();

    ReactFabric.render(<View onTouchStart={touchStart} />, 11);

    expect(nativeFabricUIManager.createNode.mock.calls.length).toBe(1);
    expect(nativeFabricUIManager.registerEventHandler.mock.calls.length).toBe(
      1,
    );

    let [
      ,
      ,
      ,
      ,
      instanceHandle,
    ] = nativeFabricUIManager.createNode.mock.calls[0];
    let [
      dispatchEvent,
    ] = nativeFabricUIManager.registerEventHandler.mock.calls[0];

    let touchEvent = {
      touches: [],
      changedTouches: [],
    };

    expect(touchStart).not.toBeCalled();

    dispatchEvent(instanceHandle, 'topTouchStart', touchEvent);

    expect(touchStart).toBeCalled();
    expect(touchStart2).not.toBeCalled();

    ReactFabric.render(<View onTouchStart={touchStart2} />, 11);

    // Intentionally dispatch to the same instanceHandle again.
    dispatchEvent(instanceHandle, 'topTouchStart', touchEvent);

    // The current semantics dictate that we always dispatch to the last committed
    // props even though the actual scheduling of the event could have happened earlier.
    // This could change in the future.
    expect(touchStart2).toBeCalled();
  });

  it('dispatches event with target as reactTag', () => {
    ReactFeatureFlags.enableNativeTargetAsInstance = false;

    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {
        id: true,
      },
      uiViewClassName: 'RCTView',
      directEventTypes: {
        topTouchStart: {
          registrationName: 'onTouchStart',
        },
        topTouchEnd: {
          registrationName: 'onTouchEnd',
        },
      },
    }));

    function getViewById(id) {
      const [
        reactTag,
        ,
        ,
        ,
        instanceHandle,
      ] = nativeFabricUIManager.createNode.mock.calls.find(
        args => args[3] && args[3].id === id,
      );

      return {reactTag, instanceHandle};
    }

    const ref1 = React.createRef();
    const ref2 = React.createRef();

    ReactFabric.render(
      <View id="parent">
        <View
          ref={ref1}
          id="one"
          onResponderStart={event => {
            expect(ref1.current).not.toBeNull();
            expect(ReactFabric.findNodeHandle(ref1.current)).toEqual(
              event.target,
            );
            expect(ReactFabric.findNodeHandle(ref1.current)).toEqual(
              event.currentTarget,
            );
          }}
          onStartShouldSetResponder={() => true}
        />
        <View
          ref={ref2}
          id="two"
          onResponderStart={event => {
            expect(ref2.current).not.toBeNull();
            expect(ReactFabric.findNodeHandle(ref2.current)).toEqual(
              event.target,
            );
            expect(ReactFabric.findNodeHandle(ref2.current)).toEqual(
              event.currentTarget,
            );
          }}
          onStartShouldSetResponder={() => true}
        />
      </View>,
      1,
    );

    let [
      dispatchEvent,
    ] = nativeFabricUIManager.registerEventHandler.mock.calls[0];

    dispatchEvent(getViewById('one').instanceHandle, 'topTouchStart', {
      target: getViewById('one').reactTag,
      identifier: 17,
      touches: [],
      changedTouches: [],
    });
    dispatchEvent(getViewById('one').instanceHandle, 'topTouchEnd', {
      target: getViewById('one').reactTag,
      identifier: 17,
      touches: [],
      changedTouches: [],
    });

    dispatchEvent(getViewById('two').instanceHandle, 'topTouchStart', {
      target: getViewById('two').reactTag,
      identifier: 17,
      touches: [],
      changedTouches: [],
    });

    dispatchEvent(getViewById('two').instanceHandle, 'topTouchEnd', {
      target: getViewById('two').reactTag,
      identifier: 17,
      touches: [],
      changedTouches: [],
    });

    expect.assertions(6);
  });

  it('dispatches event with target as instance', () => {
    ReactFeatureFlags.enableNativeTargetAsInstance = true;

    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {
        id: true,
      },
      uiViewClassName: 'RCTView',
      directEventTypes: {
        topTouchStart: {
          registrationName: 'onTouchStart',
        },
        topTouchEnd: {
          registrationName: 'onTouchEnd',
        },
      },
    }));

    function getViewById(id) {
      const [
        reactTag,
        ,
        ,
        ,
        instanceHandle,
      ] = nativeFabricUIManager.createNode.mock.calls.find(
        args => args[3] && args[3].id === id,
      );

      return {reactTag, instanceHandle};
    }

    const ref1 = React.createRef();
    const ref2 = React.createRef();

    ReactFabric.render(
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

    let [
      dispatchEvent,
    ] = nativeFabricUIManager.registerEventHandler.mock.calls[0];

    dispatchEvent(getViewById('one').instanceHandle, 'topTouchStart', {
      target: getViewById('one').reactTag,
      identifier: 17,
      touches: [],
      changedTouches: [],
    });
    dispatchEvent(getViewById('one').instanceHandle, 'topTouchEnd', {
      target: getViewById('one').reactTag,
      identifier: 17,
      touches: [],
      changedTouches: [],
    });

    dispatchEvent(getViewById('two').instanceHandle, 'topTouchStart', {
      target: getViewById('two').reactTag,
      identifier: 17,
      touches: [],
      changedTouches: [],
    });

    dispatchEvent(getViewById('two').instanceHandle, 'topTouchEnd', {
      target: getViewById('two').reactTag,
      identifier: 17,
      touches: [],
      changedTouches: [],
    });

    expect.assertions(6);
  });

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

    ReactFabric.render(<ContainsStrictModeChild ref={n => (parent = n)} />, 11);

    let match;
    expect(
      () => (match = ReactFabric.findHostInstance_DEPRECATED(parent)),
    ).toErrorDev([
      'Warning: findHostInstance_DEPRECATED is deprecated in StrictMode. ' +
        'findHostInstance_DEPRECATED was passed an instance of ContainsStrictModeChild which renders StrictMode children. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://fb.me/react-strict-mode-find-node' +
        '\n    in RCTView (at **)' +
        '\n    in StrictMode (at **)' +
        '\n    in ContainsStrictModeChild (at **)',
    ]);
    expect(match).toBe(child);
  });

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

    ReactFabric.render(
      <StrictMode>
        <IsInStrictMode ref={n => (parent = n)} />
      </StrictMode>,
      11,
    );

    let match;
    expect(
      () => (match = ReactFabric.findHostInstance_DEPRECATED(parent)),
    ).toErrorDev([
      'Warning: findHostInstance_DEPRECATED is deprecated in StrictMode. ' +
        'findHostInstance_DEPRECATED was passed an instance of IsInStrictMode which is inside StrictMode. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://fb.me/react-strict-mode-find-node' +
        '\n    in RCTView (at **)' +
        '\n    in IsInStrictMode (at **)' +
        '\n    in StrictMode (at **)',
    ]);
    expect(match).toBe(child);
  });

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

    ReactFabric.render(<ContainsStrictModeChild ref={n => (parent = n)} />, 11);

    let match;
    expect(() => (match = ReactFabric.findNodeHandle(parent))).toErrorDev([
      'Warning: findNodeHandle is deprecated in StrictMode. ' +
        'findNodeHandle was passed an instance of ContainsStrictModeChild which renders StrictMode children. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://fb.me/react-strict-mode-find-node' +
        '\n    in RCTView (at **)' +
        '\n    in StrictMode (at **)' +
        '\n    in ContainsStrictModeChild (at **)',
    ]);
    expect(match).toBe(child._nativeTag);
  });

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

    ReactFabric.render(
      <StrictMode>
        <IsInStrictMode ref={n => (parent = n)} />
      </StrictMode>,
      11,
    );

    let match;
    expect(() => (match = ReactFabric.findNodeHandle(parent))).toErrorDev([
      'Warning: findNodeHandle is deprecated in StrictMode. ' +
        'findNodeHandle was passed an instance of IsInStrictMode which is inside StrictMode. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://fb.me/react-strict-mode-find-node' +
        '\n    in RCTView (at **)' +
        '\n    in IsInStrictMode (at **)' +
        '\n    in StrictMode (at **)',
    ]);
    expect(match).toBe(child._nativeTag);
  });

  it('blur on host component calls TextInputState', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    let viewRef = React.createRef();
    ReactFabric.render(<View ref={viewRef} />, 11);

    expect(TextInputState.blurTextInput).not.toBeCalled();

    viewRef.current.blur();

    expect(TextInputState.blurTextInput).toHaveBeenCalledTimes(1);
    expect(TextInputState.blurTextInput).toHaveBeenCalledWith(viewRef.current);
  });

  it('focus on host component calls TextInputState', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    let viewRef = React.createRef();
    ReactFabric.render(<View ref={viewRef} />, 11);

    expect(TextInputState.focusTextInput).not.toBeCalled();

    viewRef.current.focus();

    expect(TextInputState.focusTextInput).toHaveBeenCalledTimes(1);
    expect(TextInputState.focusTextInput).toHaveBeenCalledWith(viewRef.current);
  });
});
