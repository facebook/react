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

let React;
let ReactDOM;
let createRenderer;
let ReactTestRenderer;
let ReactNoop;
let ReactNative;
let UIManager;
let createReactNativeComponentClass;
let ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
let element;

describe('ReactFragment', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');

    element = (
      <React.Fragment>
        hello <span>world</span>
      </React.Fragment>
    );
  });

  it('should render via native renderer', () => {
    ReactNative = require('react-native');
    UIManager = require('UIManager');
    createReactNativeComponentClass = require('createReactNativeComponentClass');

    const View = createReactNativeComponentClass('View', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'View',
    }));
    const Text = createReactNativeComponentClass('Text', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'Text',
    }));

    ReactNative.render(
      <View>
        <React.Fragment>
          <Text foo="a">1</Text>
          <Text foo="b">2</Text>
        </React.Fragment>
      </View>,
      11,
    );

    expect(UIManager.__dumpHierarchyForJestTestsOnly()).toMatchSnapshot();
  });

  it('should render via shallow renderer', () => {
    createRenderer = require('react-test-renderer/shallow').createRenderer;

    const shallowRenderer = createRenderer();
    shallowRenderer.render(element);

    expect(shallowRenderer.getRenderOutput()).toEqual([
      'hello ',
      <span>world</span>,
    ]);
  });

  it('should render via test renderer', () => {
    ReactTestRenderer = require('react-test-renderer');

    const renderer = ReactTestRenderer.create(element);

    expect(renderer.toJSON()).toEqual([
      'hello ',
      {
        type: 'span',
        props: {},
        children: ['world'],
      },
    ]);
  });

  it('should render via noop renderer', () => {
    ReactNoop = require('react-noop-renderer');

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([
      {text: 'hello '},
      {type: 'span', children: [], prop: undefined},
    ]);
  });

  if (ReactDOMFeatureFlags.useFiber) {
    it('should render via ReactDOM', () => {
      ReactDOM = require('react-dom');

      const container = document.createElement('div');
      ReactDOM.render(element, container);

      expect(container.innerHTML).toEqual('hello <span>world</span>');
    });
  }
});
