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


describe('LinkedStateMixin', function() {
  let LinkedStateMixin;
  let React;
  let ReactTestUtils;

  beforeEach(function() {
    LinkedStateMixin = require('LinkedStateMixin');
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should create a ReactLink for state', function() {
    const Component = React.createClass({
      mixins: [LinkedStateMixin],

      getInitialState: function() {
        return {value: 'initial value'};
      },

      render: function() {
        return <span>value is {this.state.value}</span>;
      },
    });
    const component = ReactTestUtils.renderIntoDocument(<Component />);
    const link = component.linkState('value');
    expect(component.state.value).toBe('initial value');
    expect(link.value).toBe('initial value');
    link.requestChange('new value');
    expect(component.state.value).toBe('new value');
    expect(component.linkState('value').value).toBe('new value');
  });
});
