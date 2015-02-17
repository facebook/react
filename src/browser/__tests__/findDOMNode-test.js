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

describe('findDOMNode', function() {
  it('findDOMNode should return null if passed null', function() {
    expect(React.findDOMNode(null)).toBe(null);
  });

  it('findDOMNode should find dom element', function() {
    var MyNode = React.createClass({
      render: function() {
        return <div><span>Noise</span></div>;
      }
    });

    var myNode = ReactTestUtils.renderIntoDocument(<MyNode />);
    var myDiv = React.findDOMNode(myNode);
    var mySameDiv = React.findDOMNode(myDiv);
    expect(myDiv.tagName).toBe('DIV');
    expect(mySameDiv).toBe(myDiv);
  });

  it('findDOMNode should reject random objects', function() {
    expect(function() {React.findDOMNode({foo: 'bar'});})
      .toThrow('Invariant Violation: Element appears to be neither ' +
        'ReactComponent nor DOMNode (keys: foo)'
      );
  });

  it('findDOMNode should reject unmounted objects with render func', function() {
    expect(function() {React.findDOMNode({render: function() {}});})
      .toThrow('Invariant Violation: Component (with keys: render) ' +
        'contains `render` method but is not mounted in the DOM'
      );
  });

});
