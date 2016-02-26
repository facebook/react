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
const ReactTestUtils = require('ReactTestUtils');
const renderSubtreeIntoContainer = require('renderSubtreeIntoContainer');

describe('renderSubtreeIntoContainer', function() {

  it('should pass context when rendering subtree elsewhere', function() {

    const portal = document.createElement('div');

    const Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string.isRequired,
      },

      render: function() {
        return <div>{this.context.foo}</div>;
      },
    });

    const Parent = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string.isRequired,
      },

      getChildContext: function() {
        return {
          foo: 'bar',
        };
      },

      render: function() {
        return null;
      },

      componentDidMount: function() {
        expect(function() {
          renderSubtreeIntoContainer(this, <Component />, portal);
        }.bind(this)).not.toThrow();
      },
    });

    ReactTestUtils.renderIntoDocument(<Parent />);
    expect(portal.firstChild.innerHTML).toBe('bar');
  });

  it('should throw if parentComponent is invalid', function() {
    const portal = document.createElement('div');

    const Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string.isRequired,
      },

      render: function() {
        return <div>{this.context.foo}</div>;
      },
    });

    const Parent = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string.isRequired,
      },

      getChildContext: function() {
        return {
          foo: 'bar',
        };
      },

      render: function() {
        return null;
      },

      componentDidMount: function() {
        expect(function() {
          renderSubtreeIntoContainer(<Parent />, <Component />, portal);
        }).toThrow('parentComponentmust be a valid React Component');
      },
    });
  });
});
