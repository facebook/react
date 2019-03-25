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
let ReactFeatureFlags;
let StrictMode;
let ReactNative;
let createReactClass;
let createReactNativeComponentClass;
let UIManager;
let NativeMethodsMixin;

const SET_NATIVE_PROPS_DEPRECATION_MESSAGE =
  'Warning: Calling ref.setNativeProps(nativeProps) ' +
  'is deprecated and will be removed in a future release. ' +
  'Use the setNativeProps export from the react-native package instead.' +
  "\n\timport {setNativeProps} from 'react-native';\n\tsetNativeProps(ref, nativeProps);\n";

describe('ReactNative', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    StrictMode = React.StrictMode;
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.warnAboutDeprecatedSetNativeProps = true;
    ReactNative = require('react-native-renderer');
    UIManager = require('UIManager');
    createReactClass = require('create-react-class/factory')(
      React.Component,
      React.isValidElement,
      new React.Component().updater,
    );
    createReactNativeComponentClass = require('ReactNativeViewConfigRegistry')
      .register;
    NativeMethodsMixin =
      ReactNative.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .NativeMethodsMixin;
  });

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

  it('should not call UIManager.updateView from ref.setNativeProps for properties that have not changed', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    class Subclass extends ReactNative.NativeComponent {
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
      ReactNative.render(
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
      }).toWarnDev([SET_NATIVE_PROPS_DEPRECATION_MESSAGE], {
        withoutStack: true,
      });
      expect(UIManager.updateView).not.toBeCalled();

      expect(() => {
        viewRef.setNativeProps({foo: 'baz'});
      }).toWarnDev([SET_NATIVE_PROPS_DEPRECATION_MESSAGE], {
        withoutStack: true,
      });

      expect(UIManager.updateView).toHaveBeenCalledTimes(1);
      expect(UIManager.updateView).toHaveBeenCalledWith(
        expect.any(Number),
        'RCTView',
        {foo: 'baz'},
      );
    });
  });

  it('should be able to setNativeProps on native refs', () => {
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

    ReactNative.setNativeProps(viewRef, {});
    expect(UIManager.updateView).not.toBeCalled();

    ReactNative.setNativeProps(viewRef, {foo: 'baz'});
    expect(UIManager.updateView).toHaveBeenCalledTimes(1);
    expect(UIManager.updateView).toHaveBeenCalledWith(
      expect.any(Number),
      'RCTView',
      {foo: 'baz'},
    );
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

    class Subclass extends ReactNative.NativeComponent {
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
      ReactNative.render(
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
        ReactNative.setNativeProps(viewRef, {foo: 'baz'});
      }).toWarnDev(
        [
          "Warning: setNativeProps was called with a ref that isn't a " +
            'native component. Use React.forwardRef to get access ' +
            'to the underlying native component',
        ],
        {withoutStack: true},
      );

      expect(UIManager.updateView).not.toBeCalled();
    });
  });

  it('should support reactTag in ref.measureLayout', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    class Subclass extends ReactNative.NativeComponent {
      render() {
        return <View>{this.props.children}</View>;
      }
    }

    const CreateClass = createReactClass({
      mixins: [NativeMethodsMixin],
      render() {
        return <View>{this.props.children}</View>;
      },
    });

    [View, Subclass, CreateClass].forEach(Component => {
      UIManager.measureLayout.mockReset();

      let viewRef;
      let otherRef;
      ReactNative.render(
        <Component>
          <Component
            foo="bar"
            ref={ref => {
              viewRef = ref;
            }}
          />
          <Component
            ref={ref => {
              otherRef = ref;
            }}
          />
        </Component>,
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
      expect(UIManager.measureLayout).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Function),
        expect.any(Function),
      );

      const args = UIManager.measureLayout.mock.calls[0];
      expect(args[0]).not.toEqual(args[1]);
      expect(successCallback).not.toBeCalled();
      expect(failureCallback).not.toBeCalled();
      args[2]('fail');
      expect(failureCallback).toBeCalledWith('fail');

      expect(successCallback).not.toBeCalled();
      args[3]('success');
      expect(successCallback).toBeCalledWith('success');
    });
  });

  it('should support ref in ref.measureLayout of host components', () => {
    const View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'RCTView',
    }));

    [View].forEach(Component => {
      UIManager.measureLayout.mockReset();

      let viewRef;
      let otherRef;
      ReactNative.render(
        <Component>
          <Component
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
        </Component>,
        11,
      );

      expect(UIManager.measureLayout).not.toBeCalled();

      const successCallback = jest.fn();
      const failureCallback = jest.fn();
      viewRef.measureLayout(otherRef, successCallback, failureCallback);

      expect(UIManager.measureLayout).toHaveBeenCalledTimes(1);
      expect(UIManager.measureLayout).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Function),
        expect.any(Function),
      );

      const args = UIManager.measureLayout.mock.calls[0];
      expect(args[0]).not.toEqual(args[1]);
      expect(successCallback).not.toBeCalled();
      expect(failureCallback).not.toBeCalled();
      args[2]('fail');
      expect(failureCallback).toBeCalledWith('fail');

      expect(successCallback).not.toBeCalled();
      args[3]('success');
      expect(successCallback).toBeCalledWith('success');
    });
  });

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

    ReactNative.render(<Component chars={before} />, 11);
    expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();

    ReactNative.render(<Component chars={after} />, 11);
    expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();
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

    ReactNative.render(<Component />, 11);
    expect(mockArgs.length).toEqual(0);
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
      ReactNative.render(
        <Text>
          <View />
        </Text>,
        11,
      ),
    ).toThrow('Nesting of <View> within <Text> is not currently supported.');

    // Non-View things (e.g. Image) are fine
    ReactNative.render(
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

    expect(() => ReactNative.render(<View>this should warn</View>, 11)).toThrow(
      'Text strings must be rendered within a <Text> component.',
    );

    expect(() =>
      ReactNative.render(
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

    ReactNative.render(
      <Text>
        <Indirection />
      </Text>,
      11,
    );
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

    ReactNative.render(<ContainsStrictModeChild ref={n => (parent = n)} />, 11);

    let match;
    expect(() => (match = ReactNative.findNodeHandle(parent))).toWarnDev([
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

    ReactNative.render(
      <StrictMode>
        <IsInStrictMode ref={n => (parent = n)} />
      </StrictMode>,
      11,
    );

    let match;
    expect(() => (match = ReactNative.findNodeHandle(parent))).toWarnDev([
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
