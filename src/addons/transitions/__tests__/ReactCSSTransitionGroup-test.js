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

var React;
var ReactCSSTransitionGroup;
var mocks;

// Most of the real functionality is covered in other unit tests, this just
// makes sure we're wired up correctly.
describe('ReactCSSTransitionGroup', function() {
  var container;

  beforeEach(function() {
    React = require('React');
    ReactCSSTransitionGroup = require('ReactCSSTransitionGroup');
    mocks = require('mocks');

    container = document.createElement('div');
  });

  it('should warn after time with no transitionend', function() {
    var a = React.renderComponent(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);

    setTimeout.mock.calls.length = 0;

    React.renderComponent(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(a.getDOMNode().childNodes[0].id).toBe('two');
    expect(a.getDOMNode().childNodes[1].id).toBe('one');

    console.warn = mocks.getMockFunction();

    // For some reason jst is adding extra setTimeout()s and grunt test isn't,
    // so we need to do this disgusting hack.
    for (var i = 0 ; i < setTimeout.mock.calls.length; i++) {
      if (setTimeout.mock.calls[i][1] === 5000) {
        setTimeout.mock.calls[i][0]();
        break;
      }
    }

    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(console.warn.mock.calls.length).toBe(1);
  });

  it('should keep both sets of DOM nodes around', function() {
    var a = React.renderComponent(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);
    React.renderComponent(
      <ReactCSSTransitionGroup transitionName="yolo">
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(a.getDOMNode().childNodes[0].id).toBe('two');
    expect(a.getDOMNode().childNodes[1].id).toBe('one');
  });

  it('should switch transitionLeave from false to true', function() {
    var a = React.renderComponent(
      <ReactCSSTransitionGroup
          transitionName="yolo"
          transitionEnter={false}
          transitionLeave={false}>
        <span key="one" id="one" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);
    React.renderComponent(
      <ReactCSSTransitionGroup
          transitionName="yolo"
          transitionEnter={false}
          transitionLeave={false}>
        <span key="two" id="two" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(1);
    React.renderComponent(
      <ReactCSSTransitionGroup
          transitionName="yolo"
          transitionEnter={false}
          transitionLeave={true}>
        <span key="three" id="three" />
      </ReactCSSTransitionGroup>,
      container
    );
    expect(a.getDOMNode().childNodes.length).toBe(2);
    expect(a.getDOMNode().childNodes[0].id).toBe('three');
    expect(a.getDOMNode().childNodes[1].id).toBe('two');
  });
  return;
  it('should work with no children', function () {
    React.renderComponent(
      <ReactCSSTransitionGroup transitionName="yolo">
      </ReactCSSTransitionGroup>,
      container
    );
  });

  it('should work with a null child', function () {
    React.renderComponent(
      <ReactCSSTransitionGroup transitionName="yolo">
        {[null]}
      </ReactCSSTransitionGroup>,
      container
    );
  });
});
