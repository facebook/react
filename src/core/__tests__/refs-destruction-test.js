/**
 * Copyright 2013-2015, Facebook, Inc.
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
var ReactTestUtils = require('ReactTestUtils');
var reactComponentExpect = require('reactComponentExpect');

var TestComponent = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.destroy ? null :
          <div ref="theInnerDiv">
            Lets try to destroy this.
          </div>
        }
      </div>
    );
  }
});

describe('refs-destruction', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
  });

  it("should remove refs when destroying the parent", function() {
    var container = document.createElement('div');
    var testInstance = React.render(<TestComponent />, container);
    reactComponentExpect(testInstance.refs.theInnerDiv)
        .toBeDOMComponentWithTag('div');
    expect(Object.keys(testInstance.refs || {}).length).toEqual(1);
    React.unmountComponentAtNode(container);
    expect(Object.keys(testInstance.refs || {}).length).toEqual(0);
  });

  it("should remove refs when destroying the child", function() {
    var container = document.createElement('div');
    var testInstance = React.render(<TestComponent />, container);
    reactComponentExpect(testInstance.refs.theInnerDiv)
        .toBeDOMComponentWithTag('div');
    expect(Object.keys(testInstance.refs || {}).length).toEqual(1);
    React.render(<TestComponent destroy={true} />, container);
    expect(Object.keys(testInstance.refs || {}).length).toEqual(0);
  });
});
