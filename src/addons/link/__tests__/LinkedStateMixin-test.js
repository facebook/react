/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
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
    var component = React.renderComponent(<Component />, container);
    var link = component.linkState('value');
    expect(component.state.value).toBe('initial value');
    expect(link.value).toBe('initial value');
    link.requestChange('new value');
    expect(component.state.value).toBe('new value');
    expect(component.linkState('value').value).toBe('new value');
  });
});
