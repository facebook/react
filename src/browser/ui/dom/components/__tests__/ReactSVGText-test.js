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

/*jshint evil:true */

describe('ReactSVGText', function() {
  var React;
  var ReactTestUtils;

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it ('should allow multiple children in text components', function() {
    var Text = React.createClass({
      getDefaultProps() {
        return {
          first: 'first',
          second: 'second'
        }
      },
      render: function() {
        return (
          <svg>
            <text ref="label">
              { this.props.first } { this.props.second }
            </text>
          </svg>
        )
      }
    });

    var test     = ReactTestUtils.renderIntoDocument(<Text />);
    var label    = test.refs.label.getDOMNode();
    var children = label.querySelectorAll('tspan');

    expect(label.textContent).toEqual('first second');
    expect(children[0].tagName).toEqual('tspan');
  })

});
