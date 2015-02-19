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

var keyMirror = require('keyMirror');

var React;
var ReactLifeCycle;
var ReactInstanceMap;
var ReactTestUtils;

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
 * Every React component is in one of these life cycles.
 */
var ComponentLifeCycle = keyMirror({
  /**
   * Mounted components have a DOM node representation and are capable of
   * receiving new props.
   */
  MOUNTED: null,
  /**
   * Unmounted components are inactive and cannot receive new props.
   */
  UNMOUNTED: null
});

/**
 * Composite components can also be in one of these life cycles.
 */
var CompositeComponentLifeCycle = keyMirror({
  /**
   * Mounted components have a DOM node representation and are capable of
   * receiving new props.
   */
  MOUNTING: null,
  /**
   * Unmounted components are inactive and cannot receive new props.
   */
  UNMOUNTING: null
});

function getCompositeLifeCycle(instance) {
  var internalInstance = ReactInstanceMap.get(instance);
  if (!internalInstance) {
    return null;
  }
  if (ReactLifeCycle.currentlyMountingInstance === internalInstance) {
    return CompositeComponentLifeCycle.MOUNTING;
  }
  if (ReactLifeCycle.currentlyUnmountingInstance === internalInstance) {
    return CompositeComponentLifeCycle.UNMOUNTING;
  }
  return null;
}

function getLifeCycleState(instance) {
  var internalInstance = ReactInstanceMap.get(instance);
  // Once a component gets mounted, it has an internal instance, once it
  // gets unmounted, it loses that internal instance.
  return internalInstance ?
         ComponentLifeCycle.MOUNTED :
         ComponentLifeCycle.UNMOUNTED;
}

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
    ReactLifeCycle = require('ReactLifeCycle');
    ReactInstanceMap = require('ReactInstanceMap');
  });

  it('should not reuse an instance when it has been unmounted', function() {
    var container = document.createElement('div');
    var StatefulComponent = React.createClass({
      getInitialState: function() {
        return {};
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

  it('should not allow update state inside of getInitialState', function() {
    spyOn(console, 'warn');
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
    ReactTestUtils.renderIntoDocument(<StatefulComponent />);
    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toBe(
      'Warning: setState(...): Can only update a mounted or ' +
      'mounting component. This usually means you called setState() on an ' +
      'unmounted component. This is a no-op.'
    );
  });

  it('should correctly determine if a component is mounted', function() {
    spyOn(console, 'warn');
    var Component = React.createClass({
      componentWillMount: function() {
        expect(this.isMounted()).toBeFalsy();
      },
      componentDidMount: function() {
        expect(this.isMounted()).toBeTruthy();
      },
      render: function() {
        expect(this.isMounted()).toBeFalsy()
        return <div/>;
      }
    });

    var element = <Component />;

    var instance = ReactTestUtils.renderIntoDocument(element);
    expect(instance.isMounted()).toBeTruthy();

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Component is accessing isMounted inside its render()'
    );
  });

  it('warns if getDOMNode is used inside render', function() {
    spyOn(console, 'warn');
    var Component = React.createClass({
      getInitialState: function() {
        return {isMounted: false};
      },
      componentDidMount: function() {
        this.setState({isMounted: true});
      },
      render: function() {
        if (this.state.isMounted) {
          expect(this.getDOMNode().tagName).toBe('DIV');
        }
        return <div/>;
      }
    });

    ReactTestUtils.renderIntoDocument(<Component />);
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Component is accessing getDOMNode or findDOMNode inside its render()'
    );
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
          getLifeCycleState(this);
        this._testJournal.compositeLifeCycleAtStartOfGetInitialState =
          getCompositeLifeCycle(this);
        return initState;
      },

      componentWillMount: function() {
        this._testJournal.stateAtStartOfWillMount = clone(this.state);
        this._testJournal.lifeCycleAtStartOfWillMount =
          getLifeCycleState(this);
        this._testJournal.compositeLifeCycleAtStartOfWillMount =
          getCompositeLifeCycle(this);
        this.state.hasWillMountCompleted = true;
      },

      componentDidMount: function() {
        this._testJournal.stateAtStartOfDidMount = clone(this.state);
        this._testJournal.lifeCycleAtStartOfDidMount =
          getLifeCycleState(this);
        this.setState({hasDidMountCompleted: true});
      },

      render: function() {
        var isInitialRender = !this.state.hasRenderCompleted;
        if (isInitialRender) {
          this._testJournal.stateInInitialRender = clone(this.state);
          this._testJournal.lifeCycleInInitialRender = getLifeCycleState(this);
          this._testJournal.compositeLifeCycleInInitialRender =
            getCompositeLifeCycle(this);
        } else {
          this._testJournal.stateInLaterRender = clone(this.state);
          this._testJournal.lifeCycleInLaterRender = getLifeCycleState(this);
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
          getLifeCycleState(this);
        this.state.hasWillUnmountCompleted = true;
      }
    });

    // A component that is merely "constructed" (as in "constructor") but not
    // yet initialized, or rendered.
    //
    var container = document.createElement('div');
    var instance = React.render(<LifeCycleComponent />, container);

    // getInitialState
    expect(instance._testJournal.returnedFromGetInitialState).toEqual(
      GET_INIT_STATE_RETURN_VAL
    );
    expect(instance._testJournal.lifeCycleAtStartOfGetInitialState)
      .toBe(ComponentLifeCycle.UNMOUNTED);
    expect(instance._testJournal.compositeLifeCycleAtStartOfGetInitialState)
      .toBe(null);

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

    expect(getLifeCycleState(instance)).toBe(ComponentLifeCycle.MOUNTED);

    // Now *update the component*
    instance.forceUpdate();

    // render 2nd time
    expect(instance._testJournal.stateInLaterRender)
      .toEqual(NEXT_RENDER_STATE);
    expect(instance._testJournal.lifeCycleInLaterRender).toBe(
      ComponentLifeCycle.MOUNTED
    );

    expect(getLifeCycleState(instance)).toBe(ComponentLifeCycle.MOUNTED);

    React.unmountComponentAtNode(container);

    expect(instance._testJournal.stateAtStartOfWillUnmount)
      .toEqual(WILL_UNMOUNT_STATE);
    // componentWillUnmount called right before unmount.
    expect(instance._testJournal.lifeCycleAtStartOfWillUnmount).toBe(
      ComponentLifeCycle.MOUNTED
    );

    // But the current lifecycle of the component is unmounted.
    expect(getLifeCycleState(instance)).toBe(ComponentLifeCycle.UNMOUNTED);
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
      'Invariant Violation: setProps(...): You called `setProps` on a ' +
      'component with a parent. This is an anti-pattern since props will get ' +
      'reactively updated when rendered. Instead, change the owner\'s ' +
      '`render` method to pass the correct value as props to the component ' +
      'where it is created.'
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

    var instance = ReactTestUtils.renderIntoDocument(
      <Component text="uno" tooltipText="one" />
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


    var container = document.createElement('div');
    log = [];
    var instance = React.render(<Outer x={17} />, container);
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
    React.unmountComponentAtNode(container);
    expect(log).toEqual([
      'outer componentWillUnmount',
      'inner componentWillUnmount'
    ]);
  });
});

