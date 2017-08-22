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

var PropTypes;
var React;
var ReactNative;
var createReactNativeComponentClass;
var UIManager;

describe('ReactNative', () => {
  beforeEach(() => {
    jest.resetModules();

    PropTypes = require('prop-types');
    React = require('react');
    ReactNative = require('react-native');
    UIManager = require('UIManager');
    createReactNativeComponentClass = require('createReactNativeComponentClass');
  });

  it('should be able to create and render a native component', () => {
    var View = createReactNativeComponentClass({
      validAttributes: {foo: true},
      uiViewClassName: 'View',
    });

    ReactNative.render(<View foo="test" />, 1);
    expect(UIManager.createView).toBeCalled();
    expect(UIManager.setChildren).toBeCalled();
    expect(UIManager.manageChildren).not.toBeCalled();
    expect(UIManager.updateView).not.toBeCalled();
  });

  it('should be able to create and update a native component', () => {
    var View = createReactNativeComponentClass({
      validAttributes: {foo: true},
      uiViewClassName: 'View',
    });

    ReactNative.render(<View foo="foo" />, 11);

    expect(UIManager.createView.mock.calls.length).toBe(1);
    expect(UIManager.setChildren.mock.calls.length).toBe(1);
    expect(UIManager.manageChildren).not.toBeCalled();
    expect(UIManager.updateView).not.toBeCalled();

    ReactNative.render(<View foo="bar" />, 11);

    expect(UIManager.createView.mock.calls.length).toBe(1);
    expect(UIManager.setChildren.mock.calls.length).toBe(1);
    expect(UIManager.manageChildren).not.toBeCalled();
    expect(UIManager.updateView).toBeCalledWith(2, 'View', {foo: 'bar'});
  });

  it('should not call UIManager.updateView after render for properties that have not changed', () => {
    const Text = createReactNativeComponentClass({
      validAttributes: {foo: true},
      uiViewClassName: 'Text',
    });

    // Context hack is required for RN text rendering in stack.
    // TODO Remove this from the test when RN stack has been deleted.
    class Hack extends React.Component {
      static childContextTypes = {isInAParentText: PropTypes.bool};
      getChildContext() {
        return {isInAParentText: true};
      }
      render() {
        return this.props.children;
      }
    }

    ReactNative.render(<Hack><Text foo="a">1</Text></Hack>, 11);
    expect(UIManager.updateView).not.toBeCalled();

    // If no properties have changed, we shouldn't call updateView.
    ReactNative.render(<Hack><Text foo="a">1</Text></Hack>, 11);
    expect(UIManager.updateView).not.toBeCalled();

    // Only call updateView for the changed property (and not for text).
    ReactNative.render(<Hack><Text foo="b">1</Text></Hack>, 11);
    expect(UIManager.updateView.mock.calls.length).toBe(1);

    // Only call updateView for the changed text (and no other properties).
    ReactNative.render(<Hack><Text foo="b">2</Text></Hack>, 11);
    expect(UIManager.updateView.mock.calls.length).toBe(2);

    // Call updateView for both changed text and properties.
    ReactNative.render(<Hack><Text foo="c">3</Text></Hack>, 11);
    expect(UIManager.updateView.mock.calls.length).toBe(4);
  });

  it('should not call UIManager.updateView from setNativeProps for properties that have not changed', () => {
    const View = createReactNativeComponentClass({
      validAttributes: {foo: true},
      uiViewClassName: 'View',
    });

    class Subclass extends ReactNative.NativeComponent {
      render() {
        return <View />;
      }
    }

    [View, Subclass].forEach(Component => {
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

      viewRef.setNativeProps({});
      expect(UIManager.updateView).not.toBeCalled();

      viewRef.setNativeProps({foo: 'baz'});
      expect(UIManager.updateView.mock.calls.length).toBe(1);
    });
  });

  it('returns the correct instance and calls it in the callback', () => {
    var View = createReactNativeComponentClass({
      validAttributes: {foo: true},
      uiViewClassName: 'View',
    });

    var a;
    var b;
    var c = ReactNative.render(
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
    var View = createReactNativeComponentClass({
      validAttributes: {title: true},
      uiViewClassName: 'View',
    });

    class Component extends React.Component {
      render() {
        var chars = this.props.chars.split('');
        return (
          <View>
            {chars.map(text => <View key={text} title={text} />)}
          </View>
        );
      }
    }

    // Mini multi-child stress test: lots of reorders, some adds, some removes.
    var before = 'abcdefghijklmnopqrst';
    var after = 'mxhpgwfralkeoivcstzy';

    ReactNative.render(<Component chars={before} />, 11);
    expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();

    ReactNative.render(<Component chars={after} />, 11);
    expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();
  });

  it('calls setState with no arguments', () => {
    var mockArgs;
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
});
