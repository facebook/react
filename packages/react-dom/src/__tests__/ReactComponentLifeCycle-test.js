/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactTestUtils;
let PropTypes;

const clone = function(o) {
  return JSON.parse(JSON.stringify(o));
};

const GET_INIT_STATE_RETURN_VAL = {
  hasWillMountCompleted: false,
  hasRenderCompleted: false,
  hasDidMountCompleted: false,
  hasWillUnmountCompleted: false,
};

const INIT_RENDER_STATE = {
  hasWillMountCompleted: true,
  hasRenderCompleted: false,
  hasDidMountCompleted: false,
  hasWillUnmountCompleted: false,
};

const DID_MOUNT_STATE = {
  hasWillMountCompleted: true,
  hasRenderCompleted: true,
  hasDidMountCompleted: false,
  hasWillUnmountCompleted: false,
};

const NEXT_RENDER_STATE = {
  hasWillMountCompleted: true,
  hasRenderCompleted: true,
  hasDidMountCompleted: true,
  hasWillUnmountCompleted: false,
};

const WILL_UNMOUNT_STATE = {
  hasWillMountCompleted: true,
  hasDidMountCompleted: true,
  hasRenderCompleted: true,
  hasWillUnmountCompleted: false,
};

const POST_WILL_UNMOUNT_STATE = {
  hasWillMountCompleted: true,
  hasDidMountCompleted: true,
  hasRenderCompleted: true,
  hasWillUnmountCompleted: true,
};

/**
 * Every React component is in one of these life cycles.
 */
type ComponentLifeCycle =
  /**
   * Mounted components have a DOM node representation and are capable of
   * receiving new props.
   */
  | 'MOUNTED' /**
   * Unmounted components are inactive and cannot receive new props.
   */
  | 'UNMOUNTED';

function getLifeCycleState(instance): ComponentLifeCycle {
  return instance.updater.isMounted(instance) ? 'MOUNTED' : 'UNMOUNTED';
}

/**
 * TODO: We should make any setState calls fail in
 * `getInitialState` and `componentWillMount`. They will usually fail
 * anyways because `this._renderedComponent` is empty, however, if a component
 * is *reused*, then that won't be the case and things will appear to work in
 * some cases. Better to just block all updates in initialization.
 */
describe('ReactComponentLifeCycle', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    PropTypes = require('prop-types');
  });

  it('should not reuse an instance when it has been unmounted', () => {
    const container = document.createElement('div');

    class StatefulComponent extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    const element = <StatefulComponent />;
    const firstInstance = ReactDOM.render(element, container);
    ReactDOM.unmountComponentAtNode(container);
    const secondInstance = ReactDOM.render(element, container);
    expect(firstInstance).not.toBe(secondInstance);
  });

  /**
   * If a state update triggers rerendering that in turn fires an onDOMReady,
   * that second onDOMReady should not fail.
   */
  it('it should fire onDOMReady when already in onDOMReady', () => {
    const _testJournal = [];

    class Child extends React.Component {
      componentDidMount() {
        _testJournal.push('Child:onDOMReady');
      }

      render() {
        return <div />;
      }
    }

    class SwitcherParent extends React.Component {
      constructor(props) {
        super(props);
        _testJournal.push('SwitcherParent:getInitialState');
        this.state = {showHasOnDOMReadyComponent: false};
      }

      componentDidMount() {
        _testJournal.push('SwitcherParent:onDOMReady');
        this.switchIt();
      }

      switchIt = () => {
        this.setState({showHasOnDOMReadyComponent: true});
      };

      render() {
        return (
          <div>
            {this.state.showHasOnDOMReadyComponent ? <Child /> : <div />}
          </div>
        );
      }
    }

    ReactTestUtils.renderIntoDocument(<SwitcherParent />);
    expect(_testJournal).toEqual([
      'SwitcherParent:getInitialState',
      'SwitcherParent:onDOMReady',
      'Child:onDOMReady',
    ]);
  });

  // You could assign state here, but not access members of it, unless you
  // had provided a getInitialState method.
  it('throws when accessing state in componentWillMount', () => {
    class StatefulComponent extends React.Component {
      UNSAFE_componentWillMount() {
        void this.state.yada;
      }

      render() {
        return <div />;
      }
    }

    let instance = <StatefulComponent />;
    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).toThrow();
  });

  it('should allow update state inside of componentWillMount', () => {
    class StatefulComponent extends React.Component {
      UNSAFE_componentWillMount() {
        this.setState({stateField: 'something'});
      }

      render() {
        return <div />;
      }
    }

    let instance = <StatefulComponent />;
    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).not.toThrow();
  });

  it('should not allow update state inside of getInitialState', () => {
    class StatefulComponent extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.setState({stateField: 'something'});

        this.state = {stateField: 'somethingelse'};
      }

      render() {
        return <div />;
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(<StatefulComponent />);
    }).toWarnDev(
      'Warning: setState(...): Can only update a mounted or ' +
        'mounting component. This usually means you called setState() on an ' +
        'unmounted component. This is a no-op.\n\nPlease check the code for the ' +
        'StatefulComponent component.',
    );

    // Check deduplication; (no extra warnings should be logged).
    ReactTestUtils.renderIntoDocument(<StatefulComponent />);
  });

  it('should correctly determine if a component is mounted', () => {
    class Component extends React.Component {
      _isMounted() {
        // No longer a public API, but we can test that it works internally by
        // reaching into the updater.
        return this.updater.isMounted(this);
      }
      UNSAFE_componentWillMount() {
        expect(this._isMounted()).toBeFalsy();
      }
      componentDidMount() {
        expect(this._isMounted()).toBeTruthy();
      }
      render() {
        expect(this._isMounted()).toBeFalsy();
        return <div />;
      }
    }

    const element = <Component />;

    expect(() => {
      const instance = ReactTestUtils.renderIntoDocument(element);
      expect(instance._isMounted()).toBeTruthy();
    }).toWarnDev('Component is accessing isMounted inside its render()');
  });

  it('should correctly determine if a null component is mounted', () => {
    class Component extends React.Component {
      _isMounted() {
        // No longer a public API, but we can test that it works internally by
        // reaching into the updater.
        return this.updater.isMounted(this);
      }
      UNSAFE_componentWillMount() {
        expect(this._isMounted()).toBeFalsy();
      }
      componentDidMount() {
        expect(this._isMounted()).toBeTruthy();
      }
      render() {
        expect(this._isMounted()).toBeFalsy();
        return null;
      }
    }

    const element = <Component />;

    expect(() => {
      const instance = ReactTestUtils.renderIntoDocument(element);
      expect(instance._isMounted()).toBeTruthy();
    }).toWarnDev('Component is accessing isMounted inside its render()');
  });

  it('isMounted should return false when unmounted', () => {
    class Component extends React.Component {
      render() {
        return <div />;
      }
    }

    const container = document.createElement('div');
    const instance = ReactDOM.render(<Component />, container);

    // No longer a public API, but we can test that it works internally by
    // reaching into the updater.
    expect(instance.updater.isMounted(instance)).toBe(true);

    ReactDOM.unmountComponentAtNode(container);

    expect(instance.updater.isMounted(instance)).toBe(false);
  });

  it('warns if findDOMNode is used inside render', () => {
    class Component extends React.Component {
      state = {isMounted: false};
      componentDidMount() {
        this.setState({isMounted: true});
      }
      render() {
        if (this.state.isMounted) {
          expect(ReactDOM.findDOMNode(this).tagName).toBe('DIV');
        }
        return <div />;
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(<Component />);
    }).toWarnDev('Component is accessing findDOMNode inside its render()');
  });

  it('should carry through each of the phases of setup', () => {
    class LifeCycleComponent extends React.Component {
      constructor(props, context) {
        super(props, context);
        this._testJournal = {};
        const initState = {
          hasWillMountCompleted: false,
          hasDidMountCompleted: false,
          hasRenderCompleted: false,
          hasWillUnmountCompleted: false,
        };
        this._testJournal.returnedFromGetInitialState = clone(initState);
        this._testJournal.lifeCycleAtStartOfGetInitialState = getLifeCycleState(
          this,
        );
        this.state = initState;
      }

      UNSAFE_componentWillMount() {
        this._testJournal.stateAtStartOfWillMount = clone(this.state);
        this._testJournal.lifeCycleAtStartOfWillMount = getLifeCycleState(this);
        this.state.hasWillMountCompleted = true;
      }

      componentDidMount() {
        this._testJournal.stateAtStartOfDidMount = clone(this.state);
        this._testJournal.lifeCycleAtStartOfDidMount = getLifeCycleState(this);
        this.setState({hasDidMountCompleted: true});
      }

      render() {
        const isInitialRender = !this.state.hasRenderCompleted;
        if (isInitialRender) {
          this._testJournal.stateInInitialRender = clone(this.state);
          this._testJournal.lifeCycleInInitialRender = getLifeCycleState(this);
        } else {
          this._testJournal.stateInLaterRender = clone(this.state);
          this._testJournal.lifeCycleInLaterRender = getLifeCycleState(this);
        }
        // you would *NEVER* do anything like this in real code!
        this.state.hasRenderCompleted = true;
        return <div ref="theDiv">I am the inner DIV</div>;
      }

      componentWillUnmount() {
        this._testJournal.stateAtStartOfWillUnmount = clone(this.state);
        this._testJournal.lifeCycleAtStartOfWillUnmount = getLifeCycleState(
          this,
        );
        this.state.hasWillUnmountCompleted = true;
      }
    }

    // A component that is merely "constructed" (as in "constructor") but not
    // yet initialized, or rendered.
    //
    const container = document.createElement('div');

    let instance;
    expect(() => {
      instance = ReactDOM.render(<LifeCycleComponent />, container);
    }).toWarnDev(
      'LifeCycleComponent is accessing isMounted inside its render() function',
    );

    // getInitialState
    expect(instance._testJournal.returnedFromGetInitialState).toEqual(
      GET_INIT_STATE_RETURN_VAL,
    );
    expect(instance._testJournal.lifeCycleAtStartOfGetInitialState).toBe(
      'UNMOUNTED',
    );

    // componentWillMount
    expect(instance._testJournal.stateAtStartOfWillMount).toEqual(
      instance._testJournal.returnedFromGetInitialState,
    );
    expect(instance._testJournal.lifeCycleAtStartOfWillMount).toBe('UNMOUNTED');

    // componentDidMount
    expect(instance._testJournal.stateAtStartOfDidMount).toEqual(
      DID_MOUNT_STATE,
    );
    expect(instance._testJournal.lifeCycleAtStartOfDidMount).toBe('MOUNTED');

    // initial render
    expect(instance._testJournal.stateInInitialRender).toEqual(
      INIT_RENDER_STATE,
    );
    expect(instance._testJournal.lifeCycleInInitialRender).toBe('UNMOUNTED');

    expect(getLifeCycleState(instance)).toBe('MOUNTED');

    // Now *update the component*
    instance.forceUpdate();

    // render 2nd time
    expect(instance._testJournal.stateInLaterRender).toEqual(NEXT_RENDER_STATE);
    expect(instance._testJournal.lifeCycleInLaterRender).toBe('MOUNTED');

    expect(getLifeCycleState(instance)).toBe('MOUNTED');

    ReactDOM.unmountComponentAtNode(container);

    expect(instance._testJournal.stateAtStartOfWillUnmount).toEqual(
      WILL_UNMOUNT_STATE,
    );
    // componentWillUnmount called right before unmount.
    expect(instance._testJournal.lifeCycleAtStartOfWillUnmount).toBe('MOUNTED');

    // But the current lifecycle of the component is unmounted.
    expect(getLifeCycleState(instance)).toBe('UNMOUNTED');
    expect(instance.state).toEqual(POST_WILL_UNMOUNT_STATE);
  });

  it('should not throw when updating an auxiliary component', () => {
    class Tooltip extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }

      componentDidMount() {
        this.container = document.createElement('div');
        this.updateTooltip();
      }

      componentDidUpdate() {
        this.updateTooltip();
      }

      updateTooltip = () => {
        // Even though this.props.tooltip has an owner, updating it shouldn't
        // throw here because it's mounted as a root component
        ReactDOM.render(this.props.tooltip, this.container);
      };
    }

    class Component extends React.Component {
      render() {
        return (
          <Tooltip ref="tooltip" tooltip={<div>{this.props.tooltipText}</div>}>
            {this.props.text}
          </Tooltip>
        );
      }
    }

    const container = document.createElement('div');
    ReactDOM.render(<Component text="uno" tooltipText="one" />, container);

    // Since `instance` is a root component, we can set its props. This also
    // makes Tooltip rerender the tooltip component, which shouldn't throw.
    ReactDOM.render(<Component text="dos" tooltipText="two" />, container);
  });

  it('should allow state updates in componentDidMount', () => {
    /**
     * calls setState in an componentDidMount.
     */
    class SetStateInComponentDidMount extends React.Component {
      state = {
        stateField: this.props.valueToUseInitially,
      };

      componentDidMount() {
        this.setState({stateField: this.props.valueToUseInOnDOMReady});
      }

      render() {
        return <div />;
      }
    }

    let instance = (
      <SetStateInComponentDidMount
        valueToUseInitially="hello"
        valueToUseInOnDOMReady="goodbye"
      />
    );
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state.stateField).toBe('goodbye');
  });

  it('should call nested lifecycle methods in the right order', () => {
    let log;
    const logger = function(msg) {
      return function() {
        // return true for shouldComponentUpdate
        log.push(msg);
        return true;
      };
    };
    class Outer extends React.Component {
      state = {};
      static getDerivedStateFromProps(props, prevState) {
        log.push('outer getDerivedStateFromProps');
        return null;
      }
      UNSAFE_componentWillMount = logger('outer componentWillMount');
      componentDidMount = logger('outer componentDidMount');
      UNSAFE_componentWillReceiveProps = logger(
        'outer componentWillReceiveProps',
      );
      shouldComponentUpdate = logger('outer shouldComponentUpdate');
      UNSAFE_componentWillUpdate = logger('outer componentWillUpdate');
      componentDidUpdate = logger('outer componentDidUpdate');
      componentWillUnmount = logger('outer componentWillUnmount');
      render() {
        return (
          <div>
            <Inner x={this.props.x} />
          </div>
        );
      }
    }

    class Inner extends React.Component {
      state = {};
      static getDerivedStateFromProps(props, prevState) {
        log.push('inner getDerivedStateFromProps');
        return null;
      }
      UNSAFE_componentWillMount = logger('inner componentWillMount');
      componentDidMount = logger('inner componentDidMount');
      UNSAFE_componentWillReceiveProps = logger(
        'inner componentWillReceiveProps',
      );
      shouldComponentUpdate = logger('inner shouldComponentUpdate');
      UNSAFE_componentWillUpdate = logger('inner componentWillUpdate');
      componentDidUpdate = logger('inner componentDidUpdate');
      componentWillUnmount = logger('inner componentWillUnmount');
      render() {
        return <span>{this.props.x}</span>;
      }
    }

    const container = document.createElement('div');
    log = [];
    expect(() => ReactDOM.render(<Outer x={1} />, container)).toWarnDev([
      'Warning: Outer: Defines both componentWillReceiveProps() and static ' +
        'getDerivedStateFromProps() methods. ' +
        'We recommend using only getDerivedStateFromProps().',
      'Warning: Inner: Defines both componentWillReceiveProps() and static ' +
        'getDerivedStateFromProps() methods. ' +
        'We recommend using only getDerivedStateFromProps().',
    ]);
    expect(log).toEqual([
      'outer getDerivedStateFromProps',
      'outer componentWillMount',
      'inner getDerivedStateFromProps',
      'inner componentWillMount',
      'inner componentDidMount',
      'outer componentDidMount',
    ]);

    // Dedup warnings
    log = [];
    ReactDOM.render(<Outer x={2} />, container);
    expect(log).toEqual([
      'outer componentWillReceiveProps',
      'outer getDerivedStateFromProps',
      'outer shouldComponentUpdate',
      'outer componentWillUpdate',
      'inner componentWillReceiveProps',
      'inner getDerivedStateFromProps',
      'inner shouldComponentUpdate',
      'inner componentWillUpdate',
      'inner componentDidUpdate',
      'outer componentDidUpdate',
    ]);

    log = [];
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'outer componentWillUnmount',
      'inner componentWillUnmount',
    ]);
  });

  it('calls effects on module-pattern component', function() {
    const log = [];

    function Parent() {
      return {
        render() {
          expect(typeof this.props).toBe('object');
          log.push('render');
          return <Child />;
        },
        UNSAFE_componentWillMount() {
          log.push('will mount');
        },
        componentDidMount() {
          log.push('did mount');
        },
        componentDidUpdate() {
          log.push('did update');
        },
        getChildContext() {
          return {x: 2};
        },
      };
    }
    Parent.childContextTypes = {
      x: PropTypes.number,
    };
    function Child(props, context) {
      expect(context.x).toBe(2);
      return <div />;
    }
    Child.contextTypes = {
      x: PropTypes.number,
    };

    const div = document.createElement('div');
    ReactDOM.render(<Parent ref={c => c && log.push('ref')} />, div);
    ReactDOM.render(<Parent ref={c => c && log.push('ref')} />, div);

    expect(log).toEqual([
      'will mount',
      'render',
      'did mount',
      'ref',

      'render',
      'did update',
      'ref',
    ]);
  });

  it('should warn if getDerivedStateFromProps returns undefined', () => {
    class MyComponent extends React.Component {
      state = {};
      static getDerivedStateFromProps() {}
      render() {
        return null;
      }
    }

    const div = document.createElement('div');
    expect(() => ReactDOM.render(<MyComponent />, div)).toWarnDev(
      'MyComponent.getDerivedStateFromProps(): A valid state object (or null) must ' +
        'be returned. You have returned undefined.',
    );

    // De-duped
    ReactDOM.render(<MyComponent />, div);
  });

  it('should warn if state is not initialized before getDerivedStateFromProps', () => {
    class MyComponent extends React.Component {
      static getDerivedStateFromProps() {
        return null;
      }
      render() {
        return null;
      }
    }

    const div = document.createElement('div');
    expect(() => ReactDOM.render(<MyComponent />, div)).toWarnDev(
      'MyComponent: Did not properly initialize state during construction. ' +
        'Expected state to be an object, but it was undefined.',
    );

    // De-duped
    ReactDOM.render(<MyComponent />, div);
  });
});
