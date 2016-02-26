/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

const React = require('React');
const ReactDOM = require('ReactDOM');
const ReactTestUtils = require('ReactTestUtils');

describe('findDOMNode', function() {
  it('findDOMNode should return null if passed null', function() {
    expect(ReactDOM.findDOMNode(null)).toBe(null);
  });

  it('findDOMNode should find dom element', function() {
    const MyNode = React.createClass({
      render: function() {
        return <div><span>Noise</span></div>;
      },
    });

    const myNode = ReactTestUtils.renderIntoDocument(<MyNode />);
    const myDiv = ReactDOM.findDOMNode(myNode);
    const mySameDiv = ReactDOM.findDOMNode(myDiv);
    expect(myDiv.tagName).toBe('DIV');
    expect(mySameDiv).toBe(myDiv);
  });

  it('findDOMNode should reject random objects', function() {
    expect(function() {
      ReactDOM.findDOMNode({foo: 'bar'});
    }).toThrow(
      'Element appears to be neither ReactComponent nor DOMNode (keys: foo)'
    );
  });

  it('findDOMNode should reject unmounted objects with render func', function() {
    const Foo = React.createClass({
      render: function() {
        return <div />;
      },
    });

    const container = document.createElement('div');
    const inst = ReactDOM.render(<Foo />, container);
    ReactDOM.unmountComponentAtNode(container);

    expect(() => ReactDOM.findDOMNode(inst)).toThrow(
      'findDOMNode was called on an unmounted component.'
    );
  });

});
