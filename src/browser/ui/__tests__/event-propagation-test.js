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

var React = require('React');
var ReactMount = require('ReactMount');
var mocks = require('mocks');

describe('Event propagation', function() {
  var stopPropagation;

  function maybeStopPropagation(event) {
    if (stopPropagation) {
      event.stopPropagation();
    }
  }

  var onClick = mocks.getMockFunction();

  var childContainer = document.createElement('div');
  var childControl = <div onClick={maybeStopPropagation}>Child</div>;
  var parentContainer = document.createElement('div');
  var parentControl = <div onClick={onClick}>Parent</div>;
  childControl = ReactMount.renderComponent(childControl, childContainer);
  parentControl = ReactMount.renderComponent(parentControl, parentContainer);
  parentControl.getDOMNode().appendChild(childContainer);

  // PhantomJS event bubbling only works for attached elements.
  document.body.appendChild(parentContainer);

  function simulateClick(node) {
    if (document.createEvent) {
      // Event constructors are not yet supported in PhantomJS.
      // https://github.com/ariya/phantomjs/issues/11289
      var event = document.createEvent('MouseEvents');
      event.initEvent('click', true, true);
      return node.dispatchEvent(event);
    } else {
      return node.fireEvent('onclick');
    }
  }

  beforeEach(function() {
    stopPropagation = undefined;
    onClick.mockClear();
  });

  it('should propagate events down without stopPropagation', function() {
    stopPropagation = false;
    simulateClick(childControl.getDOMNode());
    expect(onClick.mock.calls.length).toBe(1);
  });

  it('should not propagate events down after stopPropagation', function() {
    stopPropagation = true;
    simulateClick(childControl.getDOMNode());
    expect(onClick.mock.calls.length).toBe(0);
  });

});
