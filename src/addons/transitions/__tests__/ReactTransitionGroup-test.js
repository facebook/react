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
var ReactTransitionGroup;
var mocks;

// Most of the real functionality is covered in other unit tests, this just
// makes sure we're wired up correctly.
describe('ReactTransitionGroup', function() {
  var container;

  beforeEach(function() {
    React = require('React');
    ReactTransitionGroup = require('ReactTransitionGroup');
    mocks = require('mocks');

    container = document.createElement('div');
  });


  it('should handle willEnter correctly', function() {
    var log = [];

    var Child = React.createClass({
      componentDidMount: function() {
        log.push('didMount');
      },
      componentWillAppear: function(cb) {
        log.push('willAppear');
        cb();
      },
      componentDidAppear: function() {
        log.push('didAppear');
      },
      componentWillEnter: function(cb) {
        log.push('willEnter');
        cb();
      },
      componentDidEnter: function() {
        log.push('didEnter');
      },
      componentWillLeave: function(cb) {
        log.push('willLeave');
        cb();
      },
      componentDidLeave: function() {
        log.push('didLeave');
      },
      componentWillUnmount: function() {
        log.push('willUnmount');
      },
      render: function() {
        return <span />;
      }
    });

    var Component = React.createClass({
      getInitialState: function() {
        return {count: 1};
      },
      render: function() {
        var children = [];
        for (var i = 0; i < this.state.count; i++) {
          children.push(<Child key={i} />);
        }
        return <ReactTransitionGroup>{children}</ReactTransitionGroup>;
      }
    });

    var instance = React.render(<Component />, container);
    expect(log).toEqual(['didMount', 'willAppear', 'didAppear']);

    log = [];
    instance.setState({count: 2}, function() {
      expect(log).toEqual(['didMount', 'willEnter', 'didEnter']);

      log = [];
      instance.setState({count: 1}, function() {
        expect(log).toEqual(['willLeave', 'didLeave', 'willUnmount']);
      });
    });
  });

  it('should handle enter/leave/enter/leave correctly', function() {
    var log = [];
    var cb;

    var Child = React.createClass({
      componentDidMount: function() {
        log.push('didMount');
      },
      componentWillEnter: function(_cb) {
        log.push('willEnter');
        cb = _cb;
      },
      componentDidEnter: function() {
        log.push('didEnter');
      },
      componentWillLeave: function(cb) {
        log.push('willLeave');
        cb();
      },
      componentDidLeave: function() {
        log.push('didLeave');
      },
      componentWillUnmount: function() {
        log.push('willUnmount');
      },
      render: function() {
        return <span />;
      }
    });

    var Component = React.createClass({
      getInitialState: function() {
        return {count: 1};
      },
      render: function() {
        var children = [];
        for (var i = 0; i < this.state.count; i++) {
          children.push(<Child key={i} />);
        }
        return <ReactTransitionGroup>{children}</ReactTransitionGroup>;
      }
    });

    var instance = React.render(<Component />, container);
    expect(log).toEqual(['didMount']);
    instance.setState({count: 2});
    expect(log).toEqual(['didMount', 'didMount', 'willEnter']);
    for (var i = 0; i < 5; i++) {
      instance.setState({count: 2});
      expect(log).toEqual(['didMount', 'didMount', 'willEnter']);
      instance.setState({count: 1});
    }
    cb();
    expect(log).toEqual([
      'didMount', 'didMount', 'willEnter',
      'didEnter', 'willLeave', 'didLeave', 'willUnmount'
    ]);
  });

  it('should handle enter/leave/enter correctly', function() {
    var log = [];
    var cb;

    var Child = React.createClass({
      componentDidMount: function() {
        log.push('didMount');
      },
      componentWillEnter: function(_cb) {
        log.push('willEnter');
        cb = _cb;
      },
      componentDidEnter: function() {
        log.push('didEnter');
      },
      componentWillLeave: function(cb) {
        log.push('willLeave');
        cb();
      },
      componentDidLeave: function() {
        log.push('didLeave');
      },
      componentWillUnmount: function() {
        log.push('willUnmount');
      },
      render: function() {
        return <span />;
      }
    });

    var Component = React.createClass({
      getInitialState: function() {
        return {count: 1};
      },
      render: function() {
        var children = [];
        for (var i = 0; i < this.state.count; i++) {
          children.push(<Child key={i} />);
        }
        return <ReactTransitionGroup>{children}</ReactTransitionGroup>;
      }
    });

    var instance = React.render(<Component />, container);
    expect(log).toEqual(['didMount']);
    instance.setState({count: 2});
    expect(log).toEqual(['didMount', 'didMount', 'willEnter']);
    for (var i = 0; i < 5; i++) {
      instance.setState({count: 1});
      expect(log).toEqual(['didMount', 'didMount', 'willEnter']);
      instance.setState({count: 2});
    }
    cb();
    expect(log).toEqual([
      'didMount', 'didMount', 'willEnter', 'didEnter'
    ]);
  });
});
