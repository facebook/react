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
let createReactNativeComponentClass;
let StrictMode;
let act;

const DISPATCH_COMMAND_REQUIRES_HOST_COMPONENT =
  "Warning: dispatchCommand was called with a ref that isn't a " +
  'native component. Use React.forwardRef to get access to the underlying native component';

const SEND_ACCESSIBILITY_EVENT_REQUIRES_HOST_COMPONENT =
  "sendAccessibilityEvent was called with a ref that isn't a " +
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
    createReactNativeComponentClass = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .ReactNativeViewConfigRegistry.register;

    act = require('jest-react').act;
  });

  it('should be able to create and render a native component', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    act(() => {
      ReactFabric.render(<View foo="test" />, 1);
    });
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

    act(() => {
      ReactFabric.render(<View foo="foo" />, 11);
    });

    expect(nativeFabricUIManager.createNode).toHaveBeenCalledTimes(1);

    act(() => {
      ReactFabric.render(<View foo="bar" />, 11);
    });

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

    act(() => {
      ReactFabric.render(<Text foo="a">1</Text>, 11);
    });
    expect(nativeFabricUIManager.cloneNode).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewProps).not.toBeCalled();
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
    ).not.toBeCalled();

    // If no properties have changed, we shouldn't call cloneNode.
    act(() => {
      ReactFabric.render(<Text foo="a">1</Text>, 11);
    });
    expect(nativeFabricUIManager.cloneNode).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewProps).not.toBeCalled();
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
    ).not.toBeCalled();

    // Only call cloneNode for the changed property (and not for text).
    act(() => {
      ReactFabric.render(<Text foo="b">1</Text>, 11);
    });
    expect(nativeFabricUIManager.cloneNode).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewProps).toHaveBeenCalledTimes(
      1,
    );
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
    ).not.toBeCalled();

    // Only call cloneNode for the changed text (and no other properties).
    act(() => {
      ReactFabric.render(<Text foo="b">2</Text>, 11);
    });
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
    act(() => {
      ReactFabric.render(<Text foo="c">3</Text>, 11);
    });
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

    act(() => {
      ReactFabric.render(
        <Text foo="a" bar="a">
          1
        </Text>,
        11,
      );
    });
    expect(nativeFabricUIManager.cloneNode).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(nativeFabricUIManager.cloneNodeWithNewProps).not.toBeCalled();
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
    ).not.toBeCalled();

    act(() => {
      ReactFabric.render(
        <Text foo="a" bar="b">
          1
        </Text>,
        11,
      );
    });
    expect(
      nativeFabricUIManager.cloneNodeWithNewProps.mock.calls[0][1],
    ).toEqual({
      bar: 'b',
    });
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();

    act(() => {
      ReactFabric.render(
        <Text foo="b" bar="b">
          2
        </Text>,
        11,
      );
    });
    expect(
      nativeFabricUIManager.cloneNodeWithNewChildrenAndProps.mock.calls[0][1],
    ).toEqual({
      foo: 'b',
    });
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();
  });

  it('should call dispatchCommand for native refs', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    nativeFabricUIManager.dispatchCommand.mockClear();

    let viewRef;
    act(() => {
      ReactFabric.render(
        <View
          ref={ref => {
            viewRef = ref;
          }}
        />,
        11,
      );
    });

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
    act(() => {
      ReactFabric.render(
        <BasicClass
          ref={ref => {
            viewRef = ref;
          }}
        />,
        11,
      );
    });

    expect(nativeFabricUIManager.dispatchCommand).not.toBeCalled();
    expect(() => {
      ReactFabric.dispatchCommand(viewRef, 'updateCommand', [10, 20]);
    }).toErrorDev([DISPATCH_COMMAND_REQUIRES_HOST_COMPONENT], {
      withoutStack: true,
    });

    expect(nativeFabricUIManager.dispatchCommand).not.toBeCalled();
  });

  it('should call sendAccessibilityEvent for native refs', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    nativeFabricUIManager.sendAccessibilityEvent.mockClear();

    let viewRef;
    act(() => {
      ReactFabric.render(
        <View
          ref={ref => {
            viewRef = ref;
          }}
        />,
        11,
      );
    });

    expect(nativeFabricUIManager.sendAccessibilityEvent).not.toBeCalled();
    ReactFabric.sendAccessibilityEvent(viewRef, 'focus');
    expect(nativeFabricUIManager.sendAccessibilityEvent).toHaveBeenCalledTimes(
      1,
    );
    expect(nativeFabricUIManager.sendAccessibilityEvent).toHaveBeenCalledWith(
      expect.any(Object),
      'focus',
    );
  });

  it('should warn and no-op if calling sendAccessibilityEvent on non native refs', () => {
    class BasicClass extends React.Component {
      render() {
        return <React.Fragment />;
      }
    }

    nativeFabricUIManager.sendAccessibilityEvent.mockReset();

    let viewRef;
    act(() => {
      ReactFabric.render(
        <BasicClass
          ref={ref => {
            viewRef = ref;
          }}
        />,
        11,
      );
    });

    expect(nativeFabricUIManager.sendAccessibilityEvent).not.toBeCalled();
    expect(() => {
      ReactFabric.sendAccessibilityEvent(viewRef, 'eventTypeName');
    }).toErrorDev([SEND_ACCESSIBILITY_EVENT_REQUIRES_HOST_COMPONENT], {
      withoutStack: true,
    });

    expect(nativeFabricUIManager.sendAccessibilityEvent).not.toBeCalled();
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

    act(() => {
      ReactFabric.render(<Component chars={before} />, 11);
    });
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();

    act(() => {
      ReactFabric.render(<Component chars={after} />, 11);
    });
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
    act(() => {
      ReactFabric.render(
        <View>
          <Component ref={ref} />
        </View>,
        11,
      );
    });
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

    act(() => {
      ReactFabric.render(<Component />, 11);
    });
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

    act(() => {
      ReactFabric.render(
        <View foo="a">
          <View foo="b" />
        </View>,
        22,
      );
    });
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

    act(() => {
      ReactFabric.render(
        <Text>
          <View />
        </Text>,
        11,
      );
    });

    act(() => {
      ReactFabric.render(
        <Text>
          <Image />
        </Text>,
        11,
      );
    });
  });

  it('should console error for text not inside of a <Text> ancestor', () => {
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

    expect(() => {
      act(() => {
        ReactFabric.render(<View>this should warn</View>, 11);
      });
    }).toErrorDev(['Text strings must be rendered within a <Text> component.']);

    expect(() => {
      act(() => {
        ReactFabric.render(
          <Text>
            <ScrollView>hi hello hi</ScrollView>
          </Text>,
          11,
        );
      });
    }).toErrorDev(['Text strings must be rendered within a <Text> component.']);
  });

  it('should not throw for text inside of an indirect <Text> ancestor', () => {
    const Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTText',
    }));

    const Indirection = () => 'Hi';

    act(() => {
      ReactFabric.render(
        <Text>
          <Indirection />
        </Text>,
        11,
      );
    });
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

    act(() => {
      ReactFabric.render(<View onTouchStart={touchStart} />, 11);
    });

    expect(nativeFabricUIManager.createNode.mock.calls.length).toBe(1);
    expect(nativeFabricUIManager.registerEventHandler.mock.calls.length).toBe(
      1,
    );

    const [
      ,
      ,
      ,
      ,
      instanceHandle,
    ] = nativeFabricUIManager.createNode.mock.calls[0];
    const [
      dispatchEvent,
    ] = nativeFabricUIManager.registerEventHandler.mock.calls[0];

    const touchEvent = {
      touches: [],
      changedTouches: [],
    };

    expect(touchStart).not.toBeCalled();

    dispatchEvent(instanceHandle, 'topTouchStart', touchEvent);

    expect(touchStart).toBeCalled();
    expect(touchStart2).not.toBeCalled();

    act(() => {
      ReactFabric.render(<View onTouchStart={touchStart2} />, 11);
    });

    // Intentionally dispatch to the same instanceHandle again.
    dispatchEvent(instanceHandle, 'topTouchStart', touchEvent);

    // The current semantics dictate that we always dispatch to the last committed
    // props even though the actual scheduling of the event could have happened earlier.
    // This could change in the future.
    expect(touchStart2).toBeCalled();
  });

  it('dispatches event with target as instance', () => {
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

    act(() => {
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
    });

    const [
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

    act(() => {
      ReactFabric.render(
        <ContainsStrictModeChild ref={n => (parent = n)} />,
        11,
      );
    });

    let match;
    expect(
      () => (match = ReactFabric.findHostInstance_DEPRECATED(parent)),
    ).toErrorDev([
      'Warning: findHostInstance_DEPRECATED is deprecated in StrictMode. ' +
        'findHostInstance_DEPRECATED was passed an instance of ContainsStrictModeChild which renders StrictMode children. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://reactjs.org/link/strict-mode-find-node' +
        '\n    in RCTView (at **)' +
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

    act(() => {
      ReactFabric.render(
        <StrictMode>
          <IsInStrictMode ref={n => (parent = n)} />
        </StrictMode>,
        11,
      );
    });

    let match;
    expect(
      () => (match = ReactFabric.findHostInstance_DEPRECATED(parent)),
    ).toErrorDev([
      'Warning: findHostInstance_DEPRECATED is deprecated in StrictMode. ' +
        'findHostInstance_DEPRECATED was passed an instance of IsInStrictMode which is inside StrictMode. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://reactjs.org/link/strict-mode-find-node' +
        '\n    in RCTView (at **)' +
        '\n    in IsInStrictMode (at **)',
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

    act(() => {
      ReactFabric.render(
        <ContainsStrictModeChild ref={n => (parent = n)} />,
        11,
      );
    });

    let match;
    expect(() => (match = ReactFabric.findNodeHandle(parent))).toErrorDev([
      'Warning: findNodeHandle is deprecated in StrictMode. ' +
        'findNodeHandle was passed an instance of ContainsStrictModeChild which renders StrictMode children. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://reactjs.org/link/strict-mode-find-node' +
        '\n    in RCTView (at **)' +
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

    act(() => {
      ReactFabric.render(
        <StrictMode>
          <IsInStrictMode ref={n => (parent = n)} />
        </StrictMode>,
        11,
      );
    });

    let match;
    expect(() => (match = ReactFabric.findNodeHandle(parent))).toErrorDev([
      'Warning: findNodeHandle is deprecated in StrictMode. ' +
        'findNodeHandle was passed an instance of IsInStrictMode which is inside StrictMode. ' +
        'Instead, add a ref directly to the element you want to reference. ' +
        'Learn more about using refs safely here: ' +
        'https://reactjs.org/link/strict-mode-find-node' +
        '\n    in RCTView (at **)' +
        '\n    in IsInStrictMode (at **)',
    ]);
    expect(match).toBe(child._nativeTag);
  });

  it('should no-op if calling sendAccessibilityEvent on unmounted refs', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    nativeFabricUIManager.sendAccessibilityEvent.mockReset();

    let viewRef;
    act(() => {
      ReactFabric.render(
        <View
          ref={ref => {
            viewRef = ref;
          }}
        />,
        11,
      );
    });
    const dangerouslyRetainedViewRef = viewRef;
    act(() => {
      ReactFabric.stopSurface(11);
    });

    ReactFabric.sendAccessibilityEvent(
      dangerouslyRetainedViewRef,
      'eventTypeName',
    );

    expect(nativeFabricUIManager.sendAccessibilityEvent).not.toBeCalled();
  });
});
