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
var ReactTestUtils = require('ReactTestUtils');
var reactComponentExpect= require('reactComponentExpect');

var TestComponent = React.createClass({
  render: function() {
    return (
      <div>
        <div ref="theInnerDiv">
          Lets try to destroy this.
        </div>
      </div>
    );
  }
});

describe('refs-destruction', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  it("should remove refs when destroying the parent", function() {
    var testInstance = ReactTestUtils.renderIntoDocument(<TestComponent />);
    reactComponentExpect(testInstance.refs.theInnerDiv)
        .toBeDOMComponentWithTag('div');
    expect(Object.keys(testInstance.refs || {}).length).toEqual(1);
    testInstance.unmountComponent();
    expect(Object.keys(testInstance.refs || {}).length).toEqual(0);
  });

  it("should remove refs when destroying the child", function() {
    var testInstance = ReactTestUtils.renderIntoDocument(<TestComponent />);
    reactComponentExpect(testInstance.refs.theInnerDiv)
        .toBeDOMComponentWithTag('div');
    expect(Object.keys(testInstance.refs || {}).length).toEqual(1);
    testInstance.refs.theInnerDiv.unmountComponent();
    expect(Object.keys(testInstance.refs || {}).length).toEqual(0);
  });
});
