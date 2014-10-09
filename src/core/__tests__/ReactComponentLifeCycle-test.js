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

  it('should not reuse an instance when it has been unmounted', function() {
    var container = document.createElement('div');
    var StatefulComponent = React.createClass({
      getInitialState: function() {
        return { };
      },
      render: function() {
        return (
          <div></div>
        );
      }
    });
    var element = <StatefulComponent />;
    var firstInstance = React.render(element, container);
    React.unmountComponentAtNode(container);
    var secondInstance = React.render(element, container);
    expect(firstInstance).not.toBe(secondInstance);
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
        return <div></div>;
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
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(_testJournal).toEqual([
      'SwitcherParent:getInitialState',
      'SwitcherParent:onDOMReady',
      'Child:onDOMReady'
    ]);
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
          <div></div>
        );
      }
    });
    var instance = <StatefulComponent />;
    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).toThrow();
  });

  it('should allow update state inside of componentWillMount', function() {
    var StatefulComponent = React.createClass({
      componentWillMount: function() {
        this.setState({stateField: 'something'});
      },
      render: function() {
        return (
          <div></div>
        );
      }
    });
    var instance = <StatefulComponent />;
    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
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
          <div></div>
        );
      }
    });
    var instance = <StatefulComponent />;
    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
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
          this._testJournal.compositeLifeCycleInInitialRender =
            this._compositeLifeCycleState;
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
    var instance = ReactTestUtils.renderIntoDocument(<LifeCycleComponent />);

    // getInitialState
    expect(instance._testJournal.returnedFromGetInitialState).toEqual(
      GET_INIT_STATE_RETURN_VAL
    );
    expect(instance._testJournal.lifeCycleAtStartOfGetInitialState)
      .toBe(ComponentLifeCycle.MOUNTED);
    expect(instance._testJournal.compositeLifeCycleAtStartOfGetInitialState)
      .toBe(CompositeComponentLifeCycle.MOUNTING);

    // componentWillMount
    expect(instance._testJournal.stateAtStartOfWillMount).toEqual(
      instance._testJournal.returnedFromGetInitialState
    );
    expect(instance._testJournal.lifeCycleAtStartOfWillMount)
      .toBe(ComponentLifeCycle.MOUNTED);
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
      ComponentLifeCycle.MOUNTED
    );
    expect(instance._testJournal.compositeLifeCycleInInitialRender).toBe(
      CompositeComponentLifeCycle.MOUNTING
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

  it('should throw when calling setProps() on an owned component', function() {
    /**
     * calls setProps in an componentDidMount.
     */
    var PropsUpdaterInOnDOMReady = React.createClass({
      componentDidMount: function() {
        this.refs.theSimpleComponent.setProps({
          valueToUseInitially: this.props.valueToUseInOnDOMReady
        });
      },
      render: function() {
        return (
          <div
            className={this.props.valueToUseInitially}
            ref="theSimpleComponent"
          />
        );
      }
    });
    var instance =
      <PropsUpdaterInOnDOMReady
        valueToUseInitially="hello"
        valueToUseInOnDOMReady="goodbye"
      />;
    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).toThrow(
      'Invariant Violation: replaceProps(...): You called `setProps` or ' +
      '`replaceProps` on a component with a parent. This is an anti-pattern ' +
      'since props will get reactively updated when rendered. Instead, ' +
      'change the owner\'s `render` method to pass the correct value as ' +
      'props to the component where it is created.'
    );
  });

  it('should not throw when updating an auxiliary component', function() {
    var Tooltip = React.createClass({
      render: function() {
        return <div>{this.props.children}</div>;
      },
      componentDidMount: function() {
        this.container = document.createElement('div');
        this.updateTooltip();
      },
      componentDidUpdate: function() {
        this.updateTooltip();
      },
      updateTooltip: function() {
        // Even though this.props.tooltip has an owner, updating it shouldn't
        // throw here because it's mounted as a root component
        React.render(this.props.tooltip, this.container);
      }
    });
    var Component = React.createClass({
      render: function() {
        return (
          <Tooltip
              ref="tooltip"
              tooltip={<div>{this.props.tooltipText}</div>}>
            {this.props.text}
          </Tooltip>
        );
      }
    });

    var container = document.createElement('div');
    var instance = React.render(
      <Component text="uno" tooltipText="one" />,
      container
    );

    // Since `instance` is a root component, we can set its props. This also
    // makes Tooltip rerender the tooltip component, which shouldn't throw.
    instance.setProps({text: "dos", tooltipText: "two"});
  });

  it('should not allow setProps() called on an unmounted element',
     function() {
    var PropsToUpdate = React.createClass({
      render: function() {
        return <div className={this.props.value} ref="theSimpleComponent" />;
      }
    });
    var instance = <PropsToUpdate value="hello" />;
    expect(instance.setProps).not.toBeDefined();
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
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state.stateField).toBe('goodbye');
  });

  it('should call nested lifecycle methods in the right order', function() {
    var log;
    var logger = function(msg) {
      return function() {
        // return true for shouldComponentUpdate
        log.push(msg);
        return true;
      };
    };
    var Outer = React.createClass({
      render: function() {
        return <div><Inner x={this.props.x} /></div>;
      },
      componentWillMount: logger('outer componentWillMount'),
      componentDidMount: logger('outer componentDidMount'),
      componentWillReceiveProps: logger('outer componentWillReceiveProps'),
      shouldComponentUpdate: logger('outer shouldComponentUpdate'),
      componentWillUpdate: logger('outer componentWillUpdate'),
      componentDidUpdate: logger('outer componentDidUpdate'),
      componentWillUnmount: logger('outer componentWillUnmount')
    });
    var Inner = React.createClass({
      render: function() {
        return <span>{this.props.x}</span>;
      },
      componentWillMount: logger('inner componentWillMount'),
      componentDidMount: logger('inner componentDidMount'),
      componentWillReceiveProps: logger('inner componentWillReceiveProps'),
      shouldComponentUpdate: logger('inner shouldComponentUpdate'),
      componentWillUpdate: logger('inner componentWillUpdate'),
      componentDidUpdate: logger('inner componentDidUpdate'),
      componentWillUnmount: logger('inner componentWillUnmount')
    });
    var instance;

    log = [];
    instance = ReactTestUtils.renderIntoDocument(<Outer x={17} />);
    expect(log).toEqual([
      'outer componentWillMount',
      'inner componentWillMount',
      'inner componentDidMount',
      'outer componentDidMount'
    ]);

    log = [];
    instance.setProps({x: 42});
    expect(log).toEqual([
      'outer componentWillReceiveProps',
      'outer shouldComponentUpdate',
      'outer componentWillUpdate',
      'inner componentWillReceiveProps',
      'inner shouldComponentUpdate',
      'inner componentWillUpdate',
      'inner componentDidUpdate',
      'outer componentDidUpdate'
    ]);

    log = [];
    instance.unmountComponent();
    expect(log).toEqual([
      'outer componentWillUnmount',
      'inner componentWillUnmount'
    ]);
  });
});

