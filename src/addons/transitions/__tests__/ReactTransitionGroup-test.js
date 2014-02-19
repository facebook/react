/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

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

    var instance = React.renderComponent(<Component />, container);
    expect(log).toEqual(['didMount']);

    instance.setState({count: 2}, function() {
      expect(log).toEqual(['didMount', 'didMount', 'willEnter', 'didEnter']);
      instance.setState({count: 1}, function() {
        expect(log).toEqual([
          "didMount", "didMount", "willEnter", "didEnter",
          "willLeave", "didLeave", "willUnmount"
        ]);
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

    var instance = React.renderComponent(<Component />, container);
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

    var instance = React.renderComponent(<Component />, container);
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
