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

var mocks = require('mocks');
var React = require('React');

describe('ChangeEventPlugin', function() {
  var container;

  beforeEach(function() {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(function() {
    React.unmountComponentAtNode(container);
    document.body.removeChild(container);
  });

  it('should fire change for checkbox input', function() {
    var called = 0;

    function cb(e) {
      called = 1;
      expect(e.type).toBe('change');
    }

    var input = React.render(<input type="checkbox" onChange={cb}/>, container);
    console.log(input);
    console.log(React.findDOMNode(input));
    React.findDOMNode(input).click();
    expect(called).toBe(1);
  });
});
