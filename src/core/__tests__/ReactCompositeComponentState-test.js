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

var mocks = require('mocks');

var React;
var ReactTestUtils;
var reactComponentExpect;

var TestComponent;

describe('ReactCompositeComponent-state', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');

    TestComponent = React.createClass({
      peekAtState: function(from, state) {
        if (state) {
          this.props.stateListener(from, state && state.color);
        } else {
          this.props.stateListener(
            from,
            this.state && this.state.color,
            this._pendingState && this._pendingState.color
          );
        }
      },

      setFavoriteColor: function(nextColor) {
        this.setState({color: nextColor});
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
        this.setState({color: 'sunrise'});
        this.peekAtState('componentWillMount-after-sunrise');
        this.setState({color: 'orange'});
        this.peekAtState('componentWillMount-end');
      },

      componentDidMount: function() {
        this.peekAtState('componentDidMount-start');
        this.setState({color: 'yellow'});
        this.peekAtState('componentDidMount-end');
      },

      componentWillReceiveProps: function(newProps) {
        this.peekAtState('componentWillReceiveProps-start');
        if (newProps.nextColor) {
          this.setState({color: newProps.nextColor});
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
    var stateListener = mocks.getMockFunction();
    var instance = <TestComponent stateListener={stateListener} />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    instance.setProps({nextColor: 'green'});
    instance.setFavoriteColor('blue');
    instance.forceUpdate();
    instance.unmountComponent();

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
      // componentDidMount() finally closes.
      [ 'componentDidMount-end', 'yellow', null ],
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
      // setFavoriteColor('blue')
      [ 'shouldComponentUpdate-currentState', 'green', null ],
      [ 'shouldComponentUpdate-nextState', 'blue' ],
      [ 'componentWillUpdate-currentState', 'green', null ],
      [ 'componentWillUpdate-nextState', 'blue' ],
      [ 'render', 'blue', null ],
      [ 'componentDidUpdate-currentState', 'blue', null ],
      [ 'componentDidUpdate-prevState', 'green' ],
      // forceUpdate()
      [ 'componentWillUpdate-currentState', 'blue', null ],
      [ 'componentWillUpdate-nextState', 'blue' ],
      [ 'render', 'blue', null ],
      [ 'componentDidUpdate-currentState', 'blue', null ],
      [ 'componentDidUpdate-prevState', 'blue' ],
      // unmountComponent()
      // state is available within `componentWillUnmount()`
      [ 'componentWillUnmount', 'blue', null ]
    ]);
  });
});
