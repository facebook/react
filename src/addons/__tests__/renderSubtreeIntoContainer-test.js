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

var React = require('React');
var ReactDOM = require('ReactDOM');
var ReactTestUtils = require('ReactTestUtils');
var renderSubtreeIntoContainer = require('renderSubtreeIntoContainer');

describe('renderSubtreeIntoContainer', function() {

  it('should pass context when rendering subtree elsewhere', function() {
    var portal = document.createElement('div');

    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string.isRequired,
      },

      render: function() {
        return <div>{this.context.foo}</div>;
      },
    });

    var Parent = React.createClass({
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
    var portal = document.createElement('div');

    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string.isRequired,
      },

      render: function() {
        return <div>{this.context.foo}</div>;
      },
    });

    var Parent = React.createClass({
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
        }).toThrowError('parentComponentmust be a valid React Component');
      },
    });
  });

  it('should update context if it changes due to setState', function() {
    var container = document.createElement('div');
    document.body.appendChild(container);
    var portal = document.createElement('div');

    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string.isRequired,
        getFoo: React.PropTypes.func.isRequired,
      },

      render: function() {
        return <div>{this.context.foo + '-' + this.context.getFoo()}</div>;
      },
    });

    var Parent = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string.isRequired,
        getFoo: React.PropTypes.func.isRequired,
      },

      getChildContext: function() {
        return {
          foo: this.state.bar,
          getFoo: () => this.state.bar,
        };
      },

      getInitialState: function() {
        return {
          bar: 'initial',
        };
      },

      render: function() {
        return null;
      },

      componentDidMount: function() {
        renderSubtreeIntoContainer(this, <Component />, portal);
      },

      componentDidUpdate() {
        renderSubtreeIntoContainer(this, <Component />, portal);
      },
    });

    var instance = ReactDOM.render(<Parent />, container);
    expect(portal.firstChild.innerHTML).toBe('initial-initial');
    instance.setState({bar: 'changed'});
    expect(portal.firstChild.innerHTML).toBe('changed-changed');
  });

  it('should update context if it changes due to re-render', function() {
    var container = document.createElement('div');
    document.body.appendChild(container);
    var portal = document.createElement('div');

    var Component = React.createClass({
      contextTypes: {
        foo: React.PropTypes.string.isRequired,
        getFoo: React.PropTypes.func.isRequired,
      },

      render: function() {
        return <div>{this.context.foo + '-' + this.context.getFoo()}</div>;
      },
    });

    var Parent = React.createClass({
      childContextTypes: {
        foo: React.PropTypes.string.isRequired,
        getFoo: React.PropTypes.func.isRequired,
      },

      getChildContext: function() {
        return {
          foo: this.props.bar,
          getFoo: () => this.props.bar,
        };
      },

      render: function() {
        return null;
      },

      componentDidMount: function() {
        renderSubtreeIntoContainer(this, <Component />, portal);
      },

      componentDidUpdate() {
        renderSubtreeIntoContainer(this, <Component />, portal);
      },
    });

    ReactDOM.render(<Parent bar="initial" />, container);
    expect(portal.firstChild.innerHTML).toBe('initial-initial');
    ReactDOM.render(<Parent bar="changed" />, container);
    expect(portal.firstChild.innerHTML).toBe('changed-changed');
  });

});
