/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  | 'MOUNTED'
  /**
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

  it("warns if setting 'this.state = props'", () => {
    class StatefulComponent extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = props;
      }
      render() {
        return <div />;
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(<StatefulComponent />);
    }).toErrorDev(
      'StatefulComponent: It is not recommended to assign props directly to state ' +
        "because updates to props won't be reflected in state. " +
        'In most cases, it is better to use props directly.',
    );
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
    }).toErrorDev(
      "Warning: Can't call setState on a component that is not yet mounted. " +
        'This is a no-op, but it might indicate a bug in your application. ' +
        'Instead, assign to `this.state` directly or define a `state = {};` ' +
        'class property with the desired state in the StatefulComponent component.',
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
    }).toErrorDev('Component is accessing isMounted inside its render()');
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
    }).toErrorDev('Component is accessing isMounted inside its render()');
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
    }).toErrorDev('Component is accessing findDOMNode inside its render()');
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
    }).toErrorDev(
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

  it('should call nested legacy lifecycle methods in the right order', () => {
    let log;
    const logger = function(msg) {
      return function() {
        // return true for shouldComponentUpdate
        log.push(msg);
        return true;
      };
    };
    class Outer extends React.Component {
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
    ReactDOM.render(<Outer x={1} />, container);
    expect(log).toEqual([
      'outer componentWillMount',
      'inner componentWillMount',
      'inner componentDidMount',
      'outer componentDidMount',
    ]);

    // Dedup warnings
    log = [];
    ReactDOM.render(<Outer x={2} />, container);
    expect(log).toEqual([
      'outer componentWillReceiveProps',
      'outer shouldComponentUpdate',
      'outer componentWillUpdate',
      'inner componentWillReceiveProps',
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

  it('should call nested new lifecycle methods in the right order', () => {
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
      componentDidMount = logger('outer componentDidMount');
      shouldComponentUpdate = logger('outer shouldComponentUpdate');
      getSnapshotBeforeUpdate = logger('outer getSnapshotBeforeUpdate');
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
      componentDidMount = logger('inner componentDidMount');
      shouldComponentUpdate = logger('inner shouldComponentUpdate');
      getSnapshotBeforeUpdate = logger('inner getSnapshotBeforeUpdate');
      componentDidUpdate = logger('inner componentDidUpdate');
      componentWillUnmount = logger('inner componentWillUnmount');
      render() {
        return <span>{this.props.x}</span>;
      }
    }

    const container = document.createElement('div');
    log = [];
    ReactDOM.render(<Outer x={1} />, container);
    expect(log).toEqual([
      'outer getDerivedStateFromProps',
      'inner getDerivedStateFromProps',
      'inner componentDidMount',
      'outer componentDidMount',
    ]);

    // Dedup warnings
    log = [];
    ReactDOM.render(<Outer x={2} />, container);
    expect(log).toEqual([
      'outer getDerivedStateFromProps',
      'outer shouldComponentUpdate',
      'inner getDerivedStateFromProps',
      'inner shouldComponentUpdate',
      'inner getSnapshotBeforeUpdate',
      'outer getSnapshotBeforeUpdate',
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

  it('should not invoke deprecated lifecycles (cWM/cWRP/cWU) if new static gDSFP is present', () => {
    class Component extends React.Component {
      state = {};
      static getDerivedStateFromProps() {
        return null;
      }
      componentWillMount() {
        throw Error('unexpected');
      }
      componentWillReceiveProps() {
        throw Error('unexpected');
      }
      componentWillUpdate() {
        throw Error('unexpected');
      }
      render() {
        return null;
      }
    }

    const container = document.createElement('div');
    expect(() => {
      expect(() => ReactDOM.render(<Component />, container)).toErrorDev(
        'Unsafe legacy lifecycles will not be called for components using new component APIs.',
      );
    }).toWarnDev(
      [
        'componentWillMount has been renamed',
        'componentWillReceiveProps has been renamed',
        'componentWillUpdate has been renamed',
      ],
      {withoutStack: true},
    );
  });

  it('should not invoke deprecated lifecycles (cWM/cWRP/cWU) if new getSnapshotBeforeUpdate is present', () => {
    class Component extends React.Component {
      state = {};
      getSnapshotBeforeUpdate() {
        return null;
      }
      componentWillMount() {
        throw Error('unexpected');
      }
      componentWillReceiveProps() {
        throw Error('unexpected');
      }
      componentWillUpdate() {
        throw Error('unexpected');
      }
      componentDidUpdate() {}
      render() {
        return null;
      }
    }

    const container = document.createElement('div');
    expect(() => {
      expect(() =>
        ReactDOM.render(<Component value={1} />, container),
      ).toErrorDev(
        'Unsafe legacy lifecycles will not be called for components using new component APIs.',
      );
    }).toWarnDev(
      [
        'componentWillMount has been renamed',
        'componentWillReceiveProps has been renamed',
        'componentWillUpdate has been renamed',
      ],
      {withoutStack: true},
    );
    ReactDOM.render(<Component value={2} />, container);
  });

  it('should not invoke new unsafe lifecycles (cWM/cWRP/cWU) if static gDSFP is present', () => {
    class Component extends React.Component {
      state = {};
      static getDerivedStateFromProps() {
        return null;
      }
      UNSAFE_componentWillMount() {
        throw Error('unexpected');
      }
      UNSAFE_componentWillReceiveProps() {
        throw Error('unexpected');
      }
      UNSAFE_componentWillUpdate() {
        throw Error('unexpected');
      }
      render() {
        return null;
      }
    }

    const container = document.createElement('div');
    expect(() =>
      ReactDOM.render(<Component value={1} />, container),
    ).toErrorDev(
      'Unsafe legacy lifecycles will not be called for components using new component APIs.',
    );
    ReactDOM.render(<Component value={2} />, container);
  });

  it('should warn about deprecated lifecycles (cWM/cWRP/cWU) if new static gDSFP is present', () => {
    const container = document.createElement('div');

    class AllLegacyLifecycles extends React.Component {
      state = {};
      static getDerivedStateFromProps() {
        return null;
      }
      componentWillMount() {}
      UNSAFE_componentWillReceiveProps() {}
      componentWillUpdate() {}
      render() {
        return null;
      }
    }

    expect(() => {
      expect(() =>
        ReactDOM.render(<AllLegacyLifecycles />, container),
      ).toErrorDev(
        'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
          'AllLegacyLifecycles uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
          '  componentWillMount\n' +
          '  UNSAFE_componentWillReceiveProps\n' +
          '  componentWillUpdate\n\n' +
          'The above lifecycles should be removed. Learn more about this warning here:\n' +
          'https://fb.me/react-unsafe-component-lifecycles',
      );
    }).toWarnDev(
      [
        'componentWillMount has been renamed',
        'componentWillUpdate has been renamed',
      ],
      {withoutStack: true},
    );

    class WillMount extends React.Component {
      state = {};
      static getDerivedStateFromProps() {
        return null;
      }
      UNSAFE_componentWillMount() {}
      render() {
        return null;
      }
    }

    expect(() => ReactDOM.render(<WillMount />, container)).toErrorDev(
      'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
        'WillMount uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
        '  UNSAFE_componentWillMount\n\n' +
        'The above lifecycles should be removed. Learn more about this warning here:\n' +
        'https://fb.me/react-unsafe-component-lifecycles',
    );

    class WillMountAndUpdate extends React.Component {
      state = {};
      static getDerivedStateFromProps() {
        return null;
      }
      componentWillMount() {}
      UNSAFE_componentWillUpdate() {}
      render() {
        return null;
      }
    }

    expect(() => {
      expect(() =>
        ReactDOM.render(<WillMountAndUpdate />, container),
      ).toErrorDev(
        'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
          'WillMountAndUpdate uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
          '  componentWillMount\n' +
          '  UNSAFE_componentWillUpdate\n\n' +
          'The above lifecycles should be removed. Learn more about this warning here:\n' +
          'https://fb.me/react-unsafe-component-lifecycles',
      );
    }).toWarnDev(['componentWillMount has been renamed'], {
      withoutStack: true,
    });

    class WillReceiveProps extends React.Component {
      state = {};
      static getDerivedStateFromProps() {
        return null;
      }
      componentWillReceiveProps() {}
      render() {
        return null;
      }
    }

    expect(() => {
      expect(() => ReactDOM.render(<WillReceiveProps />, container)).toErrorDev(
        'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
          'WillReceiveProps uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
          '  componentWillReceiveProps\n\n' +
          'The above lifecycles should be removed. Learn more about this warning here:\n' +
          'https://fb.me/react-unsafe-component-lifecycles',
      );
    }).toWarnDev(['componentWillReceiveProps has been renamed'], {
      withoutStack: true,
    });
  });

  it('should warn about deprecated lifecycles (cWM/cWRP/cWU) if new getSnapshotBeforeUpdate is present', () => {
    const container = document.createElement('div');

    class AllLegacyLifecycles extends React.Component {
      state = {};
      getSnapshotBeforeUpdate() {}
      componentWillMount() {}
      UNSAFE_componentWillReceiveProps() {}
      componentWillUpdate() {}
      componentDidUpdate() {}
      render() {
        return null;
      }
    }

    expect(() => {
      expect(() =>
        ReactDOM.render(<AllLegacyLifecycles />, container),
      ).toErrorDev(
        'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
          'AllLegacyLifecycles uses getSnapshotBeforeUpdate() but also contains the following legacy lifecycles:\n' +
          '  componentWillMount\n' +
          '  UNSAFE_componentWillReceiveProps\n' +
          '  componentWillUpdate\n\n' +
          'The above lifecycles should be removed. Learn more about this warning here:\n' +
          'https://fb.me/react-unsafe-component-lifecycles',
      );
    }).toWarnDev(
      [
        'componentWillMount has been renamed',
        'componentWillUpdate has been renamed',
      ],
      {withoutStack: true},
    );

    class WillMount extends React.Component {
      state = {};
      getSnapshotBeforeUpdate() {}
      UNSAFE_componentWillMount() {}
      componentDidUpdate() {}
      render() {
        return null;
      }
    }

    expect(() => ReactDOM.render(<WillMount />, container)).toErrorDev(
      'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
        'WillMount uses getSnapshotBeforeUpdate() but also contains the following legacy lifecycles:\n' +
        '  UNSAFE_componentWillMount\n\n' +
        'The above lifecycles should be removed. Learn more about this warning here:\n' +
        'https://fb.me/react-unsafe-component-lifecycles',
    );

    class WillMountAndUpdate extends React.Component {
      state = {};
      getSnapshotBeforeUpdate() {}
      componentWillMount() {}
      UNSAFE_componentWillUpdate() {}
      componentDidUpdate() {}
      render() {
        return null;
      }
    }

    expect(() => {
      expect(() =>
        ReactDOM.render(<WillMountAndUpdate />, container),
      ).toErrorDev(
        'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
          'WillMountAndUpdate uses getSnapshotBeforeUpdate() but also contains the following legacy lifecycles:\n' +
          '  componentWillMount\n' +
          '  UNSAFE_componentWillUpdate\n\n' +
          'The above lifecycles should be removed. Learn more about this warning here:\n' +
          'https://fb.me/react-unsafe-component-lifecycles',
      );
    }).toWarnDev(['componentWillMount has been renamed'], {
      withoutStack: true,
    });

    class WillReceiveProps extends React.Component {
      state = {};
      getSnapshotBeforeUpdate() {}
      componentWillReceiveProps() {}
      componentDidUpdate() {}
      render() {
        return null;
      }
    }

    expect(() => {
      expect(() => ReactDOM.render(<WillReceiveProps />, container)).toErrorDev(
        'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
          'WillReceiveProps uses getSnapshotBeforeUpdate() but also contains the following legacy lifecycles:\n' +
          '  componentWillReceiveProps\n\n' +
          'The above lifecycles should be removed. Learn more about this warning here:\n' +
          'https://fb.me/react-unsafe-component-lifecycles',
      );
    }).toWarnDev(['componentWillReceiveProps has been renamed'], {
      withoutStack: true,
    });
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
    expect(() =>
      ReactDOM.render(<Parent ref={c => c && log.push('ref')} />, div),
    ).toErrorDev(
      'Warning: The <Parent /> component appears to be a function component that returns a class instance. ' +
        'Change Parent to a class that extends React.Component instead. ' +
        "If you can't use a class try assigning the prototype on the function as a workaround. " +
        '`Parent.prototype = React.Component.prototype`. ' +
        "Don't use an arrow function since it cannot be called with `new` by React.",
    );
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
    expect(() => ReactDOM.render(<MyComponent />, div)).toErrorDev(
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
    expect(() => ReactDOM.render(<MyComponent />, div)).toErrorDev(
      '`MyComponent` uses `getDerivedStateFromProps` but its initial state is ' +
        'undefined. This is not recommended. Instead, define the initial state by ' +
        'assigning an object to `this.state` in the constructor of `MyComponent`. ' +
        'This ensures that `getDerivedStateFromProps` arguments have a consistent shape.',
    );

    // De-duped
    ReactDOM.render(<MyComponent />, div);
  });

  it('should invoke both deprecated and new lifecycles if both are present', () => {
    const log = [];

    class MyComponent extends React.Component {
      componentWillMount() {
        log.push('componentWillMount');
      }
      componentWillReceiveProps() {
        log.push('componentWillReceiveProps');
      }
      componentWillUpdate() {
        log.push('componentWillUpdate');
      }
      UNSAFE_componentWillMount() {
        log.push('UNSAFE_componentWillMount');
      }
      UNSAFE_componentWillReceiveProps() {
        log.push('UNSAFE_componentWillReceiveProps');
      }
      UNSAFE_componentWillUpdate() {
        log.push('UNSAFE_componentWillUpdate');
      }
      render() {
        return null;
      }
    }

    const div = document.createElement('div');
    expect(() => ReactDOM.render(<MyComponent foo="bar" />, div)).toWarnDev(
      [
        'componentWillMount has been renamed',
        'componentWillReceiveProps has been renamed',
        'componentWillUpdate has been renamed',
      ],
      {withoutStack: true},
    );
    expect(log).toEqual(['componentWillMount', 'UNSAFE_componentWillMount']);

    log.length = 0;

    ReactDOM.render(<MyComponent foo="baz" />, div);
    expect(log).toEqual([
      'componentWillReceiveProps',
      'UNSAFE_componentWillReceiveProps',
      'componentWillUpdate',
      'UNSAFE_componentWillUpdate',
    ]);
  });

  it('should not override state with stale values if prevState is spread within getDerivedStateFromProps', () => {
    const divRef = React.createRef();
    let childInstance;

    class Child extends React.Component {
      state = {local: 0};
      static getDerivedStateFromProps(nextProps, prevState) {
        return {...prevState, remote: nextProps.remote};
      }
      updateState = () => {
        this.setState(state => ({local: state.local + 1}));
        this.props.onChange(this.state.remote + 1);
      };
      render() {
        childInstance = this;
        return (
          <div
            onClick={this.updateState}
            ref={
              divRef
            }>{`remote:${this.state.remote}, local:${this.state.local}`}</div>
        );
      }
    }

    class Parent extends React.Component {
      state = {value: 0};
      handleChange = value => {
        this.setState({value});
      };
      render() {
        return <Child remote={this.state.value} onChange={this.handleChange} />;
      }
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      ReactDOM.render(<Parent />, container);
      expect(divRef.current.textContent).toBe('remote:0, local:0');

      // Trigger setState() calls
      childInstance.updateState();
      expect(divRef.current.textContent).toBe('remote:1, local:1');

      // Trigger batched setState() calls
      divRef.current.click();
      expect(divRef.current.textContent).toBe('remote:2, local:2');
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should pass the return value from getSnapshotBeforeUpdate to componentDidUpdate', () => {
    const log = [];

    class MyComponent extends React.Component {
      state = {
        value: 0,
      };
      static getDerivedStateFromProps(nextProps, prevState) {
        return {
          value: prevState.value + 1,
        };
      }
      getSnapshotBeforeUpdate(prevProps, prevState) {
        log.push(
          `getSnapshotBeforeUpdate() prevProps:${prevProps.value} prevState:${prevState.value}`,
        );
        return 'abc';
      }
      componentDidUpdate(prevProps, prevState, snapshot) {
        log.push(
          `componentDidUpdate() prevProps:${prevProps.value} prevState:${prevState.value} snapshot:${snapshot}`,
        );
      }
      render() {
        log.push('render');
        return null;
      }
    }

    const div = document.createElement('div');
    ReactDOM.render(
      <div>
        <MyComponent value="foo" />
      </div>,
      div,
    );
    expect(log).toEqual(['render']);
    log.length = 0;

    ReactDOM.render(
      <div>
        <MyComponent value="bar" />
      </div>,
      div,
    );
    expect(log).toEqual([
      'render',
      'getSnapshotBeforeUpdate() prevProps:foo prevState:1',
      'componentDidUpdate() prevProps:foo prevState:1 snapshot:abc',
    ]);
    log.length = 0;

    ReactDOM.render(
      <div>
        <MyComponent value="baz" />
      </div>,
      div,
    );
    expect(log).toEqual([
      'render',
      'getSnapshotBeforeUpdate() prevProps:bar prevState:2',
      'componentDidUpdate() prevProps:bar prevState:2 snapshot:abc',
    ]);
    log.length = 0;

    ReactDOM.render(<div />, div);
    expect(log).toEqual([]);
  });

  it('should pass previous state to shouldComponentUpdate even with getDerivedStateFromProps', () => {
    const divRef = React.createRef();
    class SimpleComponent extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          value: props.value,
        };
      }

      static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.value === prevState.value) {
          return null;
        }
        return {value: nextProps.value};
      }

      shouldComponentUpdate(nextProps, nextState) {
        return nextState.value !== this.state.value;
      }

      render() {
        return <div ref={divRef}>value: {this.state.value}</div>;
      }
    }

    const div = document.createElement('div');

    ReactDOM.render(<SimpleComponent value="initial" />, div);
    expect(divRef.current.textContent).toBe('value: initial');
    ReactDOM.render(<SimpleComponent value="updated" />, div);
    expect(divRef.current.textContent).toBe('value: updated');
  });

  it('should call getSnapshotBeforeUpdate before mutations are committed', () => {
    const log = [];

    class MyComponent extends React.Component {
      divRef = React.createRef();
      getSnapshotBeforeUpdate(prevProps, prevState) {
        log.push('getSnapshotBeforeUpdate');
        expect(this.divRef.current.textContent).toBe(
          `value:${prevProps.value}`,
        );
        return 'foobar';
      }
      componentDidUpdate(prevProps, prevState, snapshot) {
        log.push('componentDidUpdate');
        expect(this.divRef.current.textContent).toBe(
          `value:${this.props.value}`,
        );
        expect(snapshot).toBe('foobar');
      }
      render() {
        log.push('render');
        return <div ref={this.divRef}>{`value:${this.props.value}`}</div>;
      }
    }

    const div = document.createElement('div');
    ReactDOM.render(<MyComponent value="foo" />, div);
    expect(log).toEqual(['render']);
    log.length = 0;

    ReactDOM.render(<MyComponent value="bar" />, div);
    expect(log).toEqual([
      'render',
      'getSnapshotBeforeUpdate',
      'componentDidUpdate',
    ]);
    log.length = 0;
  });

  it('should warn if getSnapshotBeforeUpdate returns undefined', () => {
    class MyComponent extends React.Component {
      getSnapshotBeforeUpdate() {}
      componentDidUpdate() {}
      render() {
        return null;
      }
    }

    const div = document.createElement('div');
    ReactDOM.render(<MyComponent value="foo" />, div);
    expect(() => ReactDOM.render(<MyComponent value="bar" />, div)).toErrorDev(
      'MyComponent.getSnapshotBeforeUpdate(): A snapshot value (or null) must ' +
        'be returned. You have returned undefined.',
    );

    // De-duped
    ReactDOM.render(<MyComponent value="baz" />, div);
  });

  it('should warn if getSnapshotBeforeUpdate is defined with no componentDidUpdate', () => {
    class MyComponent extends React.Component {
      getSnapshotBeforeUpdate() {
        return null;
      }
      render() {
        return null;
      }
    }

    const div = document.createElement('div');
    expect(() => ReactDOM.render(<MyComponent />, div)).toErrorDev(
      'MyComponent: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). ' +
        'This component defines getSnapshotBeforeUpdate() only.',
    );

    // De-duped
    ReactDOM.render(<MyComponent />, div);
  });

  it('warns about deprecated unsafe lifecycles', function() {
    class MyComponent extends React.Component {
      componentWillMount() {}
      componentWillReceiveProps() {}
      componentWillUpdate() {}
      render() {
        return null;
      }
    }

    const container = document.createElement('div');
    expect(() => ReactDOM.render(<MyComponent x={1} />, container)).toWarnDev(
      [
        /* eslint-disable max-len */
        `Warning: componentWillMount has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.
* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: MyComponent`,
        `Warning: componentWillReceiveProps has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state
* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: MyComponent`,
        `Warning: componentWillUpdate has been renamed, and is not recommended for use. See https://fb.me/react-unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: MyComponent`,
        /* eslint-enable max-len */
      ],
      {withoutStack: true},
    );

    // Dedupe check (update and instantiate new)
    ReactDOM.render(<MyComponent x={2} />, container);
    ReactDOM.render(<MyComponent key="new" x={1} />, container);
  });

  describe('react-lifecycles-compat', () => {
    const {polyfill} = require('react-lifecycles-compat');

    it('should not warn for components with polyfilled getDerivedStateFromProps', () => {
      class PolyfilledComponent extends React.Component {
        state = {};
        static getDerivedStateFromProps() {
          return null;
        }
        render() {
          return null;
        }
      }

      polyfill(PolyfilledComponent);

      const container = document.createElement('div');
      ReactDOM.render(
        <React.StrictMode>
          <PolyfilledComponent />
        </React.StrictMode>,
        container,
      );
    });

    it('should not warn for components with polyfilled getSnapshotBeforeUpdate', () => {
      class PolyfilledComponent extends React.Component {
        getSnapshotBeforeUpdate() {
          return null;
        }
        componentDidUpdate() {}
        render() {
          return null;
        }
      }

      polyfill(PolyfilledComponent);

      const container = document.createElement('div');
      ReactDOM.render(
        <React.StrictMode>
          <PolyfilledComponent />
        </React.StrictMode>,
        container,
      );
    });
  });
});
