/**
 * Copyright 2013 Facebook, Inc.
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
var ReactTestUtils;
var ReactUpdates;

describe('ReactUpdates', function() {
  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    ReactUpdates = require('ReactUpdates');
  });

  it('should batch state when updating state twice', function() {
    var updateCount = 0;
    var Component = React.createClass({
      getInitialState: function() {
        return {x: 0};
      },
      componentDidUpdate: function() {
        updateCount++;
      },
      render: function() {
        return <div>{this.state.x}</div>;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);

    ReactUpdates.batchedUpdates(function() {
      instance.setState({x: 1});
      instance.setState({x: 2});
      expect(instance.state.x).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(instance.state.x).toBe(2);
    expect(updateCount).toBe(1);
  });

  it('should batch state when updating two different state keys', function() {
    var updateCount = 0;
    var Component = React.createClass({
      getInitialState: function() {
        return {x: 0, y: 0};
      },
      componentDidUpdate: function() {
        updateCount++;
      },
      render: function() {
        return <div>({this.state.x}, {this.state.y})</div>;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);
    expect(instance.state.y).toBe(0);

    ReactUpdates.batchedUpdates(function() {
      instance.setState({x: 1});
      instance.setState({y: 2});
      expect(instance.state.x).toBe(0);
      expect(instance.state.y).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(instance.state.x).toBe(1);
    expect(instance.state.y).toBe(2);
    expect(updateCount).toBe(1);
  });

  it('should batch state and props together', function() {
    var updateCount = 0;
    var Component = React.createClass({
      getInitialState: function() {
        return {y: 0};
      },
      componentDidUpdate: function() {
        updateCount++;
      },
      render: function() {
        return <div>({this.props.x}, {this.state.y})</div>;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Component x={0} />);
    expect(instance.props.x).toBe(0);
    expect(instance.state.y).toBe(0);

    ReactUpdates.batchedUpdates(function() {
      instance.setProps({x: 1});
      instance.setState({y: 2});
      expect(instance.props.x).toBe(0);
      expect(instance.state.y).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(instance.props.x).toBe(1);
    expect(instance.state.y).toBe(2);
    expect(updateCount).toBe(1);
  });

  it('should batch parent/child state updates together', function() {
    var parentUpdateCount = 0;
    var Parent = React.createClass({
      getInitialState: function() {
        return {x: 0};
      },
      componentDidUpdate: function() {
        parentUpdateCount++;
      },
      render: function() {
        return <div><Child ref="child" x={this.state.x} /></div>;
      }
    });
    var childUpdateCount = 0;
    var Child = React.createClass({
      getInitialState: function() {
        return {y: 0};
      },
      componentDidUpdate: function() {
        childUpdateCount++;
      },
      render: function() {
        return <div>{this.props.x + this.state.y}</div>;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Parent />);
    var child = instance.refs.child;
    expect(instance.state.x).toBe(0);
    expect(child.state.y).toBe(0);

    ReactUpdates.batchedUpdates(function() {
      instance.setState({x: 1});
      child.setState({y: 2});
      expect(instance.state.x).toBe(0);
      expect(child.state.y).toBe(0);
      expect(parentUpdateCount).toBe(0);
      expect(childUpdateCount).toBe(0);
    });

    expect(instance.state.x).toBe(1);
    expect(child.state.y).toBe(2);
    expect(parentUpdateCount).toBe(1);
    expect(childUpdateCount).toBe(1);
  });

  it('should batch child/parent state updates together', function() {
    var parentUpdateCount = 0;
    var Parent = React.createClass({
      getInitialState: function() {
        return {x: 0};
      },
      componentDidUpdate: function() {
        parentUpdateCount++;
      },
      render: function() {
        return <div><Child ref="child" x={this.state.x} /></div>;
      }
    });
    var childUpdateCount = 0;
    var Child = React.createClass({
      getInitialState: function() {
        return {y: 0};
      },
      componentDidUpdate: function() {
        childUpdateCount++;
      },
      render: function() {
        return <div>{this.props.x + this.state.y}</div>;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Parent />);
    var child = instance.refs.child;
    expect(instance.state.x).toBe(0);
    expect(child.state.y).toBe(0);

    ReactUpdates.batchedUpdates(function() {
      child.setState({y: 2});
      instance.setState({x: 1});
      expect(instance.state.x).toBe(0);
      expect(child.state.y).toBe(0);
      expect(parentUpdateCount).toBe(0);
      expect(childUpdateCount).toBe(0);
    });

    expect(instance.state.x).toBe(1);
    expect(child.state.y).toBe(2);
    expect(parentUpdateCount).toBe(1);

    // When we update the child first, we currently incur two updates because
    // we aren't smart about what order to process the components in.
    // TODO: Reduce the update count here to 1
    expect(childUpdateCount).toBe(2);
  });

  it('should support chained state updates', function() {
    var updateCount = 0;
    var Component = React.createClass({
      getInitialState: function() {
        return {x: 0};
      },
      componentDidUpdate: function() {
        updateCount++;
      },
      render: function() {
        return <div>{this.state.x}</div>;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);

    var innerCallbackRun = false;
    ReactUpdates.batchedUpdates(function() {
      instance.setState({x: 1}, function() {
        instance.setState({x: 2}, function() {
          innerCallbackRun = true;
          expect(instance.state.x).toBe(2);
          expect(updateCount).toBe(2);
        });
        expect(instance.state.x).toBe(1);
        expect(updateCount).toBe(1);
      });
      expect(instance.state.x).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(innerCallbackRun).toBeTruthy();
    expect(instance.state.x).toBe(2);
    expect(updateCount).toBe(2);
  });

  it('should batch forceUpdate together', function() {
    var shouldUpdateCount = 0;
    var updateCount = 0;
    var Component = React.createClass({
      getInitialState: function() {
        return {x: 0};
      },
      shouldComponentUpdate: function() {
        shouldUpdateCount++;
      },
      componentDidUpdate: function() {
        updateCount++;
      },
      render: function() {
        return <div>{this.state.x}</div>;
      }
    });

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);

    var callbacksRun = 0;
    ReactUpdates.batchedUpdates(function() {
      instance.setState({x: 1}, function() {
        callbacksRun++;
      });
      instance.forceUpdate(function() {
        callbacksRun++;
      });
      expect(instance.state.x).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(callbacksRun).toBe(2);
    // shouldComponentUpdate shouldn't be called since we're forcing
    expect(shouldUpdateCount).toBe(0);
    expect(instance.state.x).toBe(1);
    expect(updateCount).toBe(1);
  });
});
