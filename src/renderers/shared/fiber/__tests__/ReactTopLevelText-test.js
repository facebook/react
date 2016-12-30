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

var React;
var ReactNoop;

// This is a new feature in Fiber so I put it in its own test file. It could
// probably move to one of the other test files once it is official.
describe('ReactTopLevelText', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  it('should render a component returning strings directly from render', () => {
    const Text = ({value}) => value;
    ReactNoop.render(<Text value="foo" />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([{text: 'foo'}]);
  });

  it('should render a component returning numbers directly from render', () => {
    const Text = ({value}) => value;
    ReactNoop.render(<Text value={10} />);
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([{text: '10'}]);
  });

});
