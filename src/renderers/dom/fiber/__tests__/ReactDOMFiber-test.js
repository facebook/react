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
  }
});
