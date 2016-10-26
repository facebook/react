/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React = require('React');
var ReactDOM = require('ReactDOM');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');

describe('ReactDOMFiber', () => {
  var container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('should render strings as children', () => {
    const Box = ({value}) => <div>{value}</div>;

    ReactDOM.render(
      <Box value="foo" />,
      container
    );
    expect(container.textContent).toEqual('foo');
  });

  it('should render numbers as children', () => {
    const Box = ({value}) => <div>{value}</div>;

    ReactDOM.render(
      <Box value={10} />,
      container
    );

    expect(container.textContent).toEqual('10');
  });

  it('should be called a callback argument', () => {
    // mounting phase
    let called = false;
    ReactDOM.render(
      <div>Foo</div>,
      container,
      () => called = true
    );
    expect(called).toEqual(true);

    // updating phase
    called = false;
    ReactDOM.render(
      <div>Foo</div>,
      container,
      () => called = true
    );
    expect(called).toEqual(true);
  });

  if (ReactDOMFeatureFlags.useFiber) {
    it('should render a component returning strings directly from render', () => {
      const Text = ({value}) => value;

      ReactDOM.render(
        <Text value="foo" />,
        container
      );
      expect(container.textContent).toEqual('foo');
    });

    it('should render a component returning numbers directly from render', () => {
      const Text = ({value}) => value;

      ReactDOM.render(
        <Text value={10} />,
        container
      );

      expect(container.textContent).toEqual('10');
    });

    it('finds the DOM Text node of a string child', () => {
      class Text extends React.Component {
        render() {
          return this.props.value;
        }
      }

      let instance = null;
      ReactDOM.render(
        <Text value="foo" ref={ref => instance = ref} />,
        container
      );

      const textNode = ReactDOM.findDOMNode(instance);
      expect(textNode).toBe(container.firstChild);
      expect(textNode.nodeType).toBe(3);
      expect(textNode.nodeValue).toBe('foo');
    });

    it('finds the first child when a component returns a fragment', () => {
      class Fragment extends React.Component {
        render() {
          return [
            <div />,
            <span />,
          ];
        }
      }

      let instance = null;
      ReactDOM.render(
        <Fragment ref={ref => instance = ref} />,
        container
      );

      expect(container.childNodes.length).toBe(2);

      const firstNode = ReactDOM.findDOMNode(instance);
      expect(firstNode).toBe(container.firstChild);
      expect(firstNode.tagName).toBe('DIV');
    });

    it('finds the first child even when fragment is nested', () => {
      class Wrapper extends React.Component {
        render() {
          return this.props.children;
        }
      }

      class Fragment extends React.Component {
        render() {
          return [
            <Wrapper><div /></Wrapper>,
            <span />,
          ];
        }
      }

      let instance = null;
      ReactDOM.render(
        <Fragment ref={ref => instance = ref} />,
        container
      );

      expect(container.childNodes.length).toBe(2);

      const firstNode = ReactDOM.findDOMNode(instance);
      expect(firstNode).toBe(container.firstChild);
      expect(firstNode.tagName).toBe('DIV');
    });

    it('finds the first child even when first child renders null', () => {
      class NullComponent extends React.Component {
        render() {
          return null;
        }
      }

      class Fragment extends React.Component {
        render() {
          return [
            <NullComponent />,
            <div />,
            <span />,
          ];
        }
      }

      let instance = null;
      ReactDOM.render(
        <Fragment ref={ref => instance = ref} />,
        container
      );

      expect(container.childNodes.length).toBe(2);

      const firstNode = ReactDOM.findDOMNode(instance);
      expect(firstNode).toBe(container.firstChild);
      expect(firstNode.tagName).toBe('DIV');
    });
  }
});
