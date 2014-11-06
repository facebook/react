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

var React;
var ReactTestUtils;

var mocks;
var warn;


describe('ReactTestUtils', function() {

  beforeEach(function() {
    mocks = require('mocks');

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(function() {
    console.warn = warn;
  });

  it('should have shallow rendering in the test utils', function() {
    var SomeComponent = React.createClass({
      render: function() {
        return (
          <div>
            <span className="child1" />
            <span className="child2" />
          </div>
        );
      }
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    shallowRenderer.render(<SomeComponent />);
    // shallowRenderer.attachRef('myRefName', someMock);

    var result = shallowRenderer.getRenderOutput();

    var expected = (
      <div>
        <span className="child1" />
        <span className="child2" />
      </div>
    );

    expect(ReactTestUtils.areElementsEquivalent(result, expected)).toBe(true);
  });
});
