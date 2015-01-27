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

'use strict';

var mocks = require('mocks');

var React;
var ReactInstanceMap;
var ReactTestUtils;
var reactComponentExpect;

var TestComponent;

describe('ReactCompositeComponent-state', function() {

  beforeEach(function() {
    React = require('React');
    ReactInstanceMap = require('ReactInstanceMap');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');

    TestComponent = React.createClass({
      peekAtState: function(from, state) {
        if (state) {
          this.props.stateListener(from, state && state.color);
        } else {
          var internalInstance = ReactInstanceMap.get(this);
          var pendingState = internalInstance ? internalInstance._pendingState :
                             null;
          this.props.stateListener(
            from,
            this.state && this.state.color,
            pendingState && pendingState.color
          );
        }
      },

      peekAtCallback: function(from) {
        return () => this.peekAtState(from);
      },

      setFavoriteColor: function(nextColor) {
        this.setState(
          {color: nextColor},
          this.peekAtCallback('setFavoriteColor')
        );
      },

      getInitialState: function() {
        this.peekAtState('getInitialState');
        return {color: 'red'};
      },

      render: function() {
        this.peekAtState('render');
        return <div>{this.state.color}</div>;
      },

      componentWillMount: function() {
        this.peekAtState('componentWillMount-start');
        this.setState(
          {color: 'sunrise'},
          this.peekAtCallback('setState-sunrise')
        );
        this.peekAtState('componentWillMount-after-sunrise');
        this.setState(
          {color: 'orange'},
          this.peekAtCallback('setState-orange')
        );
        this.peekAtState('componentWillMount-end');
      },

      componentDidMount: function() {
        this.peekAtState('componentDidMount-start');
        this.setState(
          {color: 'yellow'},
          this.peekAtCallback('setState-yellow')
        );
        this.peekAtState('componentDidMount-end');
      },

      componentWillReceiveProps: function(newProps) {
        this.peekAtState('componentWillReceiveProps-start');
        if (newProps.nextColor) {
          this.setState(
            {color: newProps.nextColor},
            this.peekAtCallback('setState-receiveProps')
          );
        }
        this.peekAtState('componentWillReceiveProps-end');
      },

      shouldComponentUpdate: function(nextProps, nextState) {
        this.peekAtState('shouldComponentUpdate-currentState');
        this.peekAtState('shouldComponentUpdate-nextState', nextState);
        return true;
      },

      componentWillUpdate: function(nextProps, nextState) {
        this.peekAtState('componentWillUpdate-currentState');
        this.peekAtState('componentWillUpdate-nextState', nextState);
      },

      componentDidUpdate: function(prevProps, prevState) {
        this.peekAtState('componentDidUpdate-currentState');
        this.peekAtState('componentDidUpdate-prevState', prevState);
      },

      componentWillUnmount: function() {
        this.peekAtState('componentWillUnmount');
      }
    });

  });

  it('should support setting state', function() {
    var container = document.createElement('div');
    document.documentElement.appendChild(container);

    var stateListener = mocks.getMockFunction();
    var instance = React.render(
      <TestComponent stateListener={stateListener} />,
      container,
      function peekAtInitialCallback() {
        this.peekAtState('initial-callback');
      }
    );
    instance.setProps(
      {nextColor: 'green'},
      instance.peekAtCallback('setProps')
    );
    instance.setFavoriteColor('blue');
    instance.forceUpdate(instance.peekAtCallback('forceUpdate'));

    React.unmountComponentAtNode(container);

    expect(stateListener.mock.calls).toEqual([
      // there is no state when getInitialState() is called
      [ 'getInitialState', null, null ],
      [ 'componentWillMount-start', 'red', null ],
      // setState() only enqueues a pending state.
      [ 'componentWillMount-after-sunrise', 'red', 'sunrise' ],
      [ 'componentWillMount-end', 'red', 'orange' ],
      // pending state has been applied
      [ 'render', 'orange', null ],
      [ 'componentDidMount-start', 'orange', null ],
      // setState-sunrise and setState-orange should be called here,
      // after the bug in #1740
      // componentDidMount() called setState({color:'yellow'}), currently this
      // occurs inline.
      // In a future where setState() is async, this test result will change.
      [ 'shouldComponentUpdate-currentState', 'orange', null ],
      [ 'shouldComponentUpdate-nextState', 'yellow' ],
      [ 'componentWillUpdate-currentState', 'orange', null ],
      [ 'componentWillUpdate-nextState', 'yellow' ],
      [ 'render', 'yellow', null ],
      [ 'componentDidUpdate-currentState', 'yellow', null ],
      [ 'componentDidUpdate-prevState', 'orange' ],
      [ 'setState-yellow', 'yellow', null ],
      // componentDidMount() finally closes.
      [ 'componentDidMount-end', 'yellow', null ],
      [ 'initial-callback', 'yellow', null ],
      [ 'componentWillReceiveProps-start', 'yellow', null ],
      // setState({color:'green'}) only enqueues a pending state.
      [ 'componentWillReceiveProps-end', 'yellow', 'green' ],
      [ 'shouldComponentUpdate-currentState', 'yellow', null ],
      [ 'shouldComponentUpdate-nextState', 'green' ],
      [ 'componentWillUpdate-currentState', 'yellow', null ],
      [ 'componentWillUpdate-nextState', 'green' ],
      [ 'render', 'green', null ],
      [ 'componentDidUpdate-currentState', 'green', null ],
      [ 'componentDidUpdate-prevState', 'yellow' ],
      [ 'setState-receiveProps', 'green', null ],
      [ 'setProps', 'green', null ],
      // setFavoriteColor('blue')
      [ 'shouldComponentUpdate-currentState', 'green', null ],
      [ 'shouldComponentUpdate-nextState', 'blue' ],
      [ 'componentWillUpdate-currentState', 'green', null ],
      [ 'componentWillUpdate-nextState', 'blue' ],
      [ 'render', 'blue', null ],
      [ 'componentDidUpdate-currentState', 'blue', null ],
      [ 'componentDidUpdate-prevState', 'green' ],
      [ 'setFavoriteColor', 'blue', null ],
      // forceUpdate()
      [ 'componentWillUpdate-currentState', 'blue', null ],
      [ 'componentWillUpdate-nextState', 'blue' ],
      [ 'render', 'blue', null ],
      [ 'componentDidUpdate-currentState', 'blue', null ],
      [ 'componentDidUpdate-prevState', 'blue' ],
      [ 'forceUpdate', 'blue', null ],
      // unmountComponent()
      // state is available within `componentWillUnmount()`
      [ 'componentWillUnmount', 'blue', null ]
    ]);
  });
});
