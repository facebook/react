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

var React;
var ReactTestUtils;

var TestComponent;

describe('refs-destruction', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    TestComponent = React.createClass({
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
      },
    });
  });

  it('should remove refs when destroying the parent', function() {
    var container = document.createElement('div');
    var testInstance = React.render(<TestComponent />, container);
    expect(ReactTestUtils.isDOMComponent(testInstance.refs.theInnerDiv))
      .toBe(true);
    expect(Object.keys(testInstance.refs || {}).length).toEqual(1);
    React.unmountComponentAtNode(container);
    expect(Object.keys(testInstance.refs || {}).length).toEqual(0);
  });

  it('should remove refs when destroying the child', function() {
    var container = document.createElement('div');
    var testInstance = React.render(<TestComponent />, container);
    expect(ReactTestUtils.isDOMComponent(testInstance.refs.theInnerDiv))
      .toBe(true);
    expect(Object.keys(testInstance.refs || {}).length).toEqual(1);
    React.render(<TestComponent destroy={true} />, container);
    expect(Object.keys(testInstance.refs || {}).length).toEqual(0);
  });
});
