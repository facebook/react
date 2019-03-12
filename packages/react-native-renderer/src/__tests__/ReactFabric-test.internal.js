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
let createReactClass;
let createReactNativeComponentClass;
let UIManager;
let FabricUIManager;
let StrictMode;
let NativeMethodsMixin;

const SET_NATIVE_PROPS_NOT_SUPPORTED_MESSAGE =
  'Warning: setNativeProps is not currently supported in Fabric';

jest.mock('shared/ReactFeatureFlags', () =>
  require('shared/forks/ReactFeatureFlags.native-oss'),
);

describe('ReactFabric', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    StrictMode = React.StrictMode;
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.warnAboutDeprecatedSetNativeProps = true;
    ReactFabric = require('react-native-renderer/fabric');
    FabricUIManager = require('FabricUIManager');
    UIManager = require('UIManager');
    createReactClass = require('create-react-class/factory')(
      React.Component,
      React.isValidElement,
      new React.Component().updater,
    );
    createReactNativeComponentClass = require('ReactNativeViewConfigRegistry')
      .register;
    NativeMethodsMixin =
      ReactFabric.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .NativeMethodsMixin;
  });

  it('should be able to create and render a native component', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    ReactFabric.render(<View foo="test" />, 1);
    expect(FabricUIManager.createNode).toBeCalled();
    expect(FabricUIManager.appendChild).not.toBeCalled();
    expect(FabricUIManager.completeRoot).toBeCalled();
  });

  it('should be able to create and update a native component', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    const firstNode = {};

    FabricUIManager.createNode.mockReturnValue(firstNode);

    ReactFabric.render(<View foo="foo" />, 11);

    expect(FabricUIManager.createNode).toHaveBeenCalledTimes(1);

    ReactFabric.render(<View foo="bar" />, 11);

    expect(FabricUIManager.createNode).toHaveBeenCalledTimes(1);
    expect(FabricUIManager.cloneNodeWithNewProps).toHaveBeenCalledTimes(1);
    expect(FabricUIManager.cloneNodeWithNewProps.mock.calls[0][0]).toBe(
      firstNode,
    );
    expect(FabricUIManager.cloneNodeWithNewProps.mock.calls[0][1]).toEqual({
      foo: 'bar',
    });
  });

  it('should not call FabricUIManager.cloneNode after render for properties that have not changed', () => {
    const Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTText',
    }));

    ReactFabric.render(<Text foo="a">1</Text>, 11);
    expect(FabricUIManager.cloneNode).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewProps).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewChildrenAndProps).not.toBeCalled();

    // If no properties have changed, we shouldn't call cloneNode.
    ReactFabric.render(<Text foo="a">1</Text>, 11);
    expect(FabricUIManager.cloneNode).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewProps).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewChildrenAndProps).not.toBeCalled();

    // Only call cloneNode for the changed property (and not for text).
    ReactFabric.render(<Text foo="b">1</Text>, 11);
    expect(FabricUIManager.cloneNode).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewProps).toHaveBeenCalledTimes(1);
    expect(FabricUIManager.cloneNodeWithNewChildrenAndProps).not.toBeCalled();

    // Only call cloneNode for the changed text (and no other properties).
    ReactFabric.render(<Text foo="b">2</Text>, 11);
    expect(FabricUIManager.cloneNode).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewChildren).toHaveBeenCalledTimes(1);
    expect(FabricUIManager.cloneNodeWithNewProps).toHaveBeenCalledTimes(1);
    expect(FabricUIManager.cloneNodeWithNewChildrenAndProps).not.toBeCalled();

    // Call cloneNode for both changed text and properties.
    ReactFabric.render(<Text foo="c">3</Text>, 11);
    expect(FabricUIManager.cloneNode).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewChildren).toHaveBeenCalledTimes(1);
    expect(FabricUIManager.cloneNodeWithNewProps).toHaveBeenCalledTimes(1);
    expect(
      FabricUIManager.cloneNodeWithNewChildrenAndProps,
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
    expect(FabricUIManager.cloneNode).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewChildren).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewProps).not.toBeCalled();
    expect(FabricUIManager.cloneNodeWithNewChildrenAndProps).not.toBeCalled();

    ReactFabric.render(
      <Text foo="a" bar="b">
        1
      </Text>,
      11,
    );
    expect(FabricUIManager.cloneNodeWithNewProps.mock.calls[0][1]).toEqual({
      bar: 'b',
    });
    expect(FabricUIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();

    ReactFabric.render(
      <Text foo="b" bar="b">
        2
      </Text>,
      11,
    );
    expect(
      FabricUIManager.cloneNodeWithNewChildrenAndProps.mock.calls[0][1],
    ).toEqual({
      foo: 'b',
    });
    expect(FabricUIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();
  });

  it('should not call UIManager.updateView from ref.setNativeProps', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    class Subclass extends ReactFabric.NativeComponent {
      render() {
        return <View />;
      }
    }

    const CreateClass = createReactClass({
      mixins: [NativeMethodsMixin],
      render: () => {
        return <View />;
      },
    });

    [View, Subclass, CreateClass].forEach(Component => {
      UIManager.updateView.mockReset();

      let viewRef;
      ReactFabric.render(
        <Component
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
      }).toWarnDev([SET_NATIVE_PROPS_NOT_SUPPORTED_MESSAGE], {
        withoutStack: true,
      });

      expect(UIManager.updateView).not.toBeCalled();

      expect(() => {
        viewRef.setNativeProps({foo: 'baz'});
      }).toWarnDev([SET_NATIVE_PROPS_NOT_SUPPORTED_MESSAGE], {
        withoutStack: true,
      });
      expect(UIManager.updateView).not.toBeCalled();
    });
  });

  it('setNativeProps on native refs should no-op', () => {
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
      ReactFabric.setNativeProps(viewRef, {foo: 'baz'});
    }).toWarnDev([SET_NATIVE_PROPS_NOT_SUPPORTED_MESSAGE], {
      withoutStack: true,
    });
    expect(UIManager.updateView).not.toBeCalled();
  });

  it('should warn and no-op if calling setNativeProps on non native refs', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    class BasicClass extends React.Component {
      render() {
        return <React.Fragment />;
      }
    }

    class Subclass extends ReactFabric.NativeComponent {
      render() {
        return <View />;
      }
    }

    const CreateClass = createReactClass({
      mixins: [NativeMethodsMixin],
      render: () => {
        return <View />;
      },
    });

    [BasicClass, Subclass, CreateClass].forEach(Component => {
      UIManager.updateView.mockReset();

      let viewRef;
      ReactFabric.render(
        <Component
          foo="bar"
          ref={ref => {
            viewRef = ref;
          }}
        />,
        11,
      );

      expect(UIManager.updateView).not.toBeCalled();
      expect(() => {
        ReactFabric.setNativeProps(viewRef, {foo: 'baz'});
      }).toWarnDev([SET_NATIVE_PROPS_NOT_SUPPORTED_MESSAGE], {
        withoutStack: true,
      });

      expect(UIManager.updateView).not.toBeCalled();
    });
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
          <View>{chars.map(text => <View key={text} title={text} />)}</View>
        );
      }
    }

    // Mini multi-child stress test: lots of reorders, some adds, some removes.
    const before = 'abcdefghijklmnopqrst';
    const after = 'mxhpgwfralkeoivcstzy';

    ReactFabric.render(<Component chars={before} />, 11);
    expect(FabricUIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();

    ReactFabric.render(<Component chars={after} />, 11);
    expect(FabricUIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();
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
          <View>{chars.map(text => <View key={text} title={text} />)}</View>
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
    expect(FabricUIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();

    // Call setState() so that we skip over the top-level host node.
    // It should still get recreated despite a bailout.
    ref.current.setState({
      chars: after,
    });
    expect(FabricUIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();
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
    FabricUIManager.completeRoot.mockImplementation(function(
      rootTag,
      newChildSet,
    ) {
      snapshots.push(
        FabricUIManager.__dumpChildSetForJestTestsOnly(newChildSet),
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

  it('should throw when <View> is used inside of a <Text> ancestor', () => {
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

    expect(() =>
      ReactFabric.render(
        <Text>
          <View />
        </Text>,
        11,
      ),
    ).toThrow('Nesting of <View> within <Text> is not currently supported.');

    // Non-View things (e.g. Image) are fine
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

    expect(FabricUIManager.createNode.mock.calls.length).toBe(1);
    expect(FabricUIManager.registerEventHandler.mock.calls.length).toBe(1);

    let [, , , , instanceHandle] = FabricUIManager.createNode.mock.calls[0];
    let [dispatchEvent] = FabricUIManager.registerEventHandler.mock.calls[0];

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
    expect(() => (match = ReactFabric.findNodeHandle(parent))).toWarnDev([
      'Warning: findNodeHandle is deprecated in StrictMode. ' +
        'findNodeHandle was passed an instance of ContainsStrictModeChild which renders StrictMode children. ' +
        'Instead, add a ref directly to the element you want to reference.' +
        '\n' +
        '\n    in RCTView (at **)' +
        '\n    in StrictMode (at **)' +
        '\n    in ContainsStrictModeChild (at **)' +
        '\n' +
        '\nLearn more about using refs safely here:' +
        '\nhttps://fb.me/react-strict-mode-find-node',
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
    expect(() => (match = ReactFabric.findNodeHandle(parent))).toWarnDev([
      'Warning: findNodeHandle is deprecated in StrictMode. ' +
        'findNodeHandle was passed an instance of IsInStrictMode which is inside StrictMode. ' +
        'Instead, add a ref directly to the element you want to reference.' +
        '\n' +
        '\n    in RCTView (at **)' +
        '\n    in IsInStrictMode (at **)' +
        '\n    in StrictMode (at **)' +
        '\n' +
        '\nLearn more about using refs safely here:' +
        '\nhttps://fb.me/react-strict-mode-find-node',
    ]);
    expect(match).toBe(child._nativeTag);
  });
});
