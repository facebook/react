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
var ReactComponent;
var ReactCompositeComponent;
var ComponentLifeCycle;
var CompositeComponentLifeCycle;

var clone = function(o) {
  return JSON.parse(JSON.stringify(o));
};


var GET_INIT_STATE_RETURN_VAL = {
  hasWillMountCompleted: false,
  hasRenderCompleted: false,
  hasDidMountCompleted: false,
  hasWillUnmountCompleted: false
};

var INIT_RENDER_STATE = {
  hasWillMountCompleted: true,
  hasRenderCompleted: false,
  hasDidMountCompleted: false,
  hasWillUnmountCompleted: false
};

var DID_MOUNT_STATE = {
  hasWillMountCompleted: true,
  hasRenderCompleted: true,
  hasDidMountCompleted: false,
  hasWillUnmountCompleted: false
};

var NEXT_RENDER_STATE = {
  hasWillMountCompleted: true,
  hasRenderCompleted: true,
  hasDidMountCompleted: true,
  hasWillUnmountCompleted: false
};

var WILL_UNMOUNT_STATE = {
  hasWillMountCompleted: true,
  hasDidMountCompleted: true,
  hasRenderCompleted: true,
  hasWillUnmountCompleted: false
};

var POST_WILL_UNMOUNT_STATE = {
  hasWillMountCompleted: true,
  hasDidMountCompleted: true,
  hasRenderCompleted: true,
  hasWillUnmountCompleted: true
};

/**
 * TODO: We should make any setState calls fail in
 * `getInitialState` and `componentWillMount`. They will usually fail
 * anyways because `this._renderedComponent` is empty, however, if a component
 * is *reused*, then that won't be the case and things will appear to work in
 * some cases. Better to just block all updates in initialization.
 */
describe('ReactComponentLifeCycle', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    ReactComponent = require('ReactComponent');
    ReactCompositeComponent = require('ReactCompositeComponent');
    ComponentLifeCycle = ReactComponent.LifeCycle;
    CompositeComponentLifeCycle = ReactCompositeComponent.LifeCycle;
  });

  it('should scrub state when reinitialized using getInitialState', function() {
    var StatefulComponent = React.createClass({
      getInitialState: function() {
        return { };
      },
      addAnotherField: function() {
        this.setState({
          aField: 'asdf'
        });
      },
      render: function() {
        return (
          <div> </div>
        );
      }
    });
    var instance = <StatefulComponent />;
    ReactTestUtils.renderIntoDocument(instance);
    instance.addAnotherField();
    expect(instance.state.aField).toBe('asdf');
    instance.unmountComponent();
    ReactTestUtils.renderIntoDocument(instance);
    expect(typeof instance.state.aField).toBe('undefined');
  });

  /**
   * If a state update triggers rerendering that in turn fires an onDOMReady,
   * that second onDOMReady should not fail.
   */
  it('it should fire onDOMReady when already in onDOMReady', function() {

    var _testJournal = [];

    var Child = React.createClass({
      componentDidMount: function() {
        _testJournal.push('Child:onDOMReady');
      },
      render: function() {
        return <div> </div>;
      }
    });

    var SwitcherParent = React.createClass({
      getInitialState: function() {
        _testJournal.push('SwitcherParent:getInitialState');
        return {showHasOnDOMReadyComponent: false};
      },
      componentDidMount: function() {
        _testJournal.push('SwitcherParent:onDOMReady');
        this.switchIt();
      },
      switchIt: function() {
        this.setState({showHasOnDOMReadyComponent: true});
      },
      render: function() {
        return (
          <div>{
            this.state.showHasOnDOMReadyComponent ?
            <Child /> :
            <div> </div>
          }</div>
        );
      }
    });

    var instance = <SwitcherParent />;
    ReactTestUtils.renderIntoDocument(instance);
    expect(_testJournal).toEqual([
      'SwitcherParent:getInitialState',
      'SwitcherParent:onDOMReady',
      'Child:onDOMReady'
    ]);
  });


  it('should scrub state when re-initialized', function() {
    var StatefulComponent = React.createClass({
      addAnotherField: function() {
        this.setState({
          aField: 'asdf'
        });
      },
      render: function() {
        return (
          <div> </div>
        );
      }
    });
    var instance = <StatefulComponent />;
    ReactTestUtils.renderIntoDocument(instance);
    instance.addAnotherField();
    expect(instance.state.aField).toBe('asdf');
    instance.unmountComponent();
    ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toBe(null);
  });

  // You could assign state here, but not access members of it, unless you
  // had provided a getInitialState method.
  it('throws when accessing state in componentWillMount', function() {
    var StatefulComponent = React.createClass({
      componentWillMount: function() {
        this.state.yada;
      },
      render: function() {
        return (
          <div> </div>
        );
      }
    });
    var instance = <StatefulComponent />;
    expect(function() {
      ReactTestUtils.renderIntoDocument(instance);
    }).toThrow();
  });

  it('should allow update state inside of componentWillMount', function() {
    var StatefulComponent = React.createClass({
      componentWillMount: function() {
        this.setState({stateField: 'something'});
      },
      render: function() {
        return (
          <div> </div>
        );
      }
    });
    var instance = <StatefulComponent />;
    expect(function() {
      ReactTestUtils.renderIntoDocument(instance);
    }).not.toThrow();
  });

  it('should allow update state inside of getInitialState', function() {
    var StatefulComponent = React.createClass({
      getInitialState: function() {
        this.setState({stateField: 'something'});

        return {stateField: 'somethingelse'};
      },
      render: function() {
        return (
          <div> </div>
        );
      }
    });
    var instance = <StatefulComponent />;
    expect(function() {
      ReactTestUtils.renderIntoDocument(instance);
    }).not.toThrow();

    // The return value of getInitialState overrides anything from setState
    expect(instance.state.stateField).toEqual('somethingelse');
  });


  it('should carry through each of the phases of setup', function() {
    var LifeCycleComponent = React.createClass({
      getInitialState: function() {
        this._testJournal = {};
        var initState = {
          hasWillMountCompleted: false,
          hasDidMountCompleted: false,
          hasRenderCompleted: false,
          hasWillUnmountCompleted: false
        };
        this._testJournal.returnedFromGetInitialState = clone(initState);
        this._testJournal.lifeCycleAtStartOfGetInitialState =
          this._lifeCycleState;
        this._testJournal.compositeLifeCycleAtStartOfGetInitialState =
          this._compositeLifeCycleState;
        return initState;
      },

      componentWillMount: function() {
        this._testJournal.stateAtStartOfWillMount = clone(this.state);
        this._testJournal.lifeCycleAtStartOfWillMount =
          this._lifeCycleState;
        this._testJournal.compositeLifeCycleAtStartOfWillMount =
          this._compositeLifeCycleState;
        this.state.hasWillMountCompleted = true;
      },

      componentDidMount: function() {
        this._testJournal.stateAtStartOfDidMount = clone(this.state);
        this._testJournal.lifeCycleAtStartOfDidMount =
          this._lifeCycleState;
        this.setState({hasDidMountCompleted: true});
      },

      render: function() {
        var isInitialRender = !this.state.hasRenderCompleted;
        if (isInitialRender) {
          this._testJournal.stateInInitialRender = clone(this.state);
          this._testJournal.lifeCycleInInitialRender = this._lifeCycleState;
        } else {
          this._testJournal.stateInLaterRender = clone(this.state);
          this._testJournal.lifeCycleInLaterRender = this._lifeCycleState;
        }
        // you would *NEVER* do anything like this in real code!
        this.state.hasRenderCompleted = true;
        return (
          <div ref="theDiv">
            I am the inner DIV
          </div>
        );
      },

      componentWillUnmount: function() {
        this._testJournal.stateAtStartOfWillUnmount = clone(this.state);
        this._testJournal.lifeCycleAtStartOfWillUnmount =
          this._lifeCycleState;
        this.state.hasWillUnmountCompleted = true;
      }
    });

    // A component that is merely "constructed" (as in "constructor") but not
    // yet initialized, or rendered.
    //
    var instance = <LifeCycleComponent />;
    expect(instance._lifeCycleState).toBe(ComponentLifeCycle.UNMOUNTED);
    ReactTestUtils.renderIntoDocument(instance);

    // getInitialState
    expect(instance._testJournal.returnedFromGetInitialState).toEqual(
      GET_INIT_STATE_RETURN_VAL
    );
    expect(instance._testJournal.lifeCycleAtStartOfGetInitialState)
      .toBe(ComponentLifeCycle.UNMOUNTED);
    expect(instance._testJournal.compositeLifeCycleAtStartOfGetInitialState)
      .toBe(CompositeComponentLifeCycle.MOUNTING);

    // componentWillMount
    expect(instance._testJournal.stateAtStartOfWillMount).toEqual(
      instance._testJournal.returnedFromGetInitialState
    );
    expect(instance._testJournal.lifeCycleAtStartOfWillMount)
      .toBe(ComponentLifeCycle.UNMOUNTED);
    expect(instance._testJournal.compositeLifeCycleAtStartOfWillMount)
      .toBe(CompositeComponentLifeCycle.MOUNTING);

    // componentDidMount
    expect(instance._testJournal.stateAtStartOfDidMount)
      .toEqual(DID_MOUNT_STATE);
    expect(instance._testJournal.lifeCycleAtStartOfDidMount).toBe(
      ComponentLifeCycle.MOUNTED
    );

    // render
    expect(instance._testJournal.stateInInitialRender)
      .toEqual(INIT_RENDER_STATE);
    expect(instance._testJournal.lifeCycleInInitialRender).toBe(
      ComponentLifeCycle.UNMOUNTED
    );

    expect(instance._lifeCycleState).toBe(ComponentLifeCycle.MOUNTED);

    // Now *update the component*
    instance.forceUpdate();

    // render 2nd time
    expect(instance._testJournal.stateInLaterRender)
      .toEqual(NEXT_RENDER_STATE);
    expect(instance._testJournal.lifeCycleInLaterRender).toBe(
      ComponentLifeCycle.MOUNTED
    );

    expect(instance._lifeCycleState).toBe(ComponentLifeCycle.MOUNTED);

    // Now *unmountComponent*
    instance.unmountComponent();

    expect(instance._testJournal.stateAtStartOfWillUnmount)
      .toEqual(WILL_UNMOUNT_STATE);
    // componentWillUnmount called right before unmount.
    expect(instance._testJournal.lifeCycleAtStartOfWillUnmount).toBe(
      ComponentLifeCycle.MOUNTED
    );

    // But the current lifecycle of the component is unmounted.
    expect(instance._lifeCycleState).toBe(ComponentLifeCycle.UNMOUNTED);
    expect(instance.state).toEqual(POST_WILL_UNMOUNT_STATE);
  });

  it('should allow state updates in componentDidMount', function() {
    /**
     * calls setState in an componentDidMount.
     */
    var SetStateInComponentDidMount = React.createClass({
      getInitialState: function() {
        return {
          stateField: this.props.valueToUseInitially
        };
      },
      componentDidMount: function() {
        this.setState({stateField: this.props.valueToUseInOnDOMReady});
      },
      render: function() {
        return (<div></div>);
      }
    });
    var instance =
      <SetStateInComponentDidMount
        valueToUseInitially="hello"
        valueToUseInOnDOMReady="goodbye"
      />;
    ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state.stateField).toBe('goodbye');
  });

});

