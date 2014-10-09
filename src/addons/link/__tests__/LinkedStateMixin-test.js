/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

/*jshint evil:true */

describe('LinkedStateMixin', function() {
  var LinkedStateMixin;
  var React;
  var ReactLink;

  beforeEach(function() {
    LinkedStateMixin = require('LinkedStateMixin');
    React = require('React');
    ReactLink = require('ReactLink');
  });

  it('should create a ReactLink for state', function() {
    var Component = React.createClass({
      mixins: [LinkedStateMixin],

      getInitialState: function() {
        return {value: 'initial value'};
      },

      render: function() {
        return <span>value is {this.state.value}</span>;
      }
    });
    var container = document.createElement('div');
    var component = React.render(<Component />, container);
    var link = component.linkState('value');
    expect(component.state.value).toBe('initial value');
    expect(link.value).toBe('initial value');
    link.requestChange('new value');
    expect(component.state.value).toBe('new value');
    expect(component.linkState('value').value).toBe('new value');
  });
});
