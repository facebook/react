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
let ReactNoop;

// This is a new feature in Fiber so I put it in its own test file. It could
// probably move to one of the other test files once it is official.
describe('ReactTopLevelText', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('should render a component returning strings directly from render', () => {
    const Text = ({value}) => value;
    ReactNoop.render(<Text value="foo" />);
    ReactNoop.flush();
    expect(ReactNoop.getChildrenAsJSX()).toEqual('foo');
  });

  it('should render a component returning numbers directly from render', () => {
    const Text = ({value}) => value;
    ReactNoop.render(<Text value={10} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildrenAsJSX()).toEqual('10');
  });
});
