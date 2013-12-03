/**
 * Copyright 2013 Facebook, Inc.
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

var React;
var ReactTransitionGroup;
var mocks;

// Most of the real functionality is covered in other unit tests, this just
// makes sure we're wired up correctly.
describe('ReactTransitionGroup', function() {
  var container;

  beforeEach(function() {
    React = require('React');
    ReactTransitionGroup = require('ReactTransitionGroup');
    mocks = require('mocks');

    container = document.createElement('div');
  });

  it('should warn after time with no transitionend', function() {
    var a = React.renderComponent(
      <ReactTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);

    setTimeout.mock.calls.length = 0;

    React.renderComponent(
      <ReactTransitionGroup transitionName="yolo">
        <span key="two" id="two" />
      </ReactTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(a.getDOMNode().childNodes[0].id).toBe('two');
    expect(a.getDOMNode().childNodes[1].id).toBe('one');

    console.warn = mocks.getMockFunction();
    setTimeout.mock.calls[2][0]();

    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(console.warn.mock.calls.length).toBe(1);
  });

  it('should keep both sets of DOM nodes around', function() {
    var a = React.renderComponent(
      <ReactTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);
    React.renderComponent(
      <ReactTransitionGroup transitionName="yolo">
        <span key="two" id="two" />
      </ReactTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(a.getDOMNode().childNodes[0].id).toBe('two');
    expect(a.getDOMNode().childNodes[1].id).toBe('one');
  });

  describe('with an undefined child', function () {
    it('should fail silently', function () {
      React.renderComponent(
        <ReactTransitionGroup transitionName="yolo">
        </ReactTransitionGroup>,
        container
      );
    });
  });
});
