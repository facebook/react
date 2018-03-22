/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let createRenderer;
let PropTypes;
let React;

describe('ReactShallowRenderer', () => {
  beforeEach(() => {
    jest.resetModules();

    createRenderer = require('react-test-renderer/shallow').createRenderer;
    PropTypes = require('prop-types');
    React = require('react');
  });

  it('should call all of the legacy lifecycle hooks', () => {
    const logs = [];
    const logger = message => () => logs.push(message) || true;

    class SomeComponent extends React.Component {
      UNSAFE_componentWillMount = logger('componentWillMount');
      componentDidMount = logger('componentDidMount');
      UNSAFE_componentWillReceiveProps = logger('componentWillReceiveProps');
      shouldComponentUpdate = logger('shouldComponentUpdate');
      UNSAFE_componentWillUpdate = logger('componentWillUpdate');
      componentDidUpdate = logger('componentDidUpdate');
      componentWillUnmount = logger('componentWillUnmount');
      render() {
        return <div />;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SomeComponent foo={1} />);

    // Calling cDU might lead to problems with host component references.
    // Since our components aren't really mounted, refs won't be available.
    expect(logs).toEqual(['componentWillMount']);

    logs.splice(0);

    const instance = shallowRenderer.getMountedInstance();
    instance.setState({});

    expect(logs).toEqual(['shouldComponentUpdate', 'componentWillUpdate']);

    logs.splice(0);

    shallowRenderer.render(<SomeComponent foo={2} />);

    // The previous shallow renderer did not trigger cDU for props changes.
    expect(logs).toEqual([
      'componentWillReceiveProps',
      'shouldComponentUpdate',
      'componentWillUpdate',
    ]);
  });

  it('should call all of the new lifecycle hooks', () => {
    const logs = [];
    const logger = message => () => logs.push(message) || true;

    class SomeComponent extends React.Component {
      state = {};
      static getDerivedStateFromProps = logger('getDerivedStateFromProps');
      componentDidMount = logger('componentDidMount');
      shouldComponentUpdate = logger('shouldComponentUpdate');
      componentDidUpdate = logger('componentDidUpdate');
      componentWillUnmount = logger('componentWillUnmount');
      render() {
        return <div />;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SomeComponent foo={1} />);

    // Calling cDU might lead to problems with host component references.
    // Since our components aren't really mounted, refs won't be available.
    expect(logs).toEqual(['getDerivedStateFromProps']);

    logs.splice(0);

    const instance = shallowRenderer.getMountedInstance();
    instance.setState({});

    expect(logs).toEqual(['shouldComponentUpdate']);

    logs.splice(0);

    shallowRenderer.render(<SomeComponent foo={2} />);

    // The previous shallow renderer did not trigger cDU for props changes.
    expect(logs).toEqual(['getDerivedStateFromProps', 'shouldComponentUpdate']);
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

    const shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(<Component />)).toWarnDev(
      'Unsafe legacy lifecycles will not be called for components using the new getDerivedStateFromProps() API.',
    );
  });

  it('should warn about deprecated lifecycles (cWM/cWRP/cWU) if new static gDSFP is present', () => {
    let shallowRenderer;

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

    shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(<AllLegacyLifecycles />)).toWarnDev(
      'Unsafe legacy lifecycles will not be called for components using the new getDerivedStateFromProps() API.\n\n' +
        'AllLegacyLifecycles uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
        '  componentWillMount\n' +
        '  UNSAFE_componentWillReceiveProps\n' +
        '  componentWillUpdate\n\n' +
        'The above lifecycles should be removed. Learn more about this warning here:\n' +
        'https://fb.me/react-async-component-lifecycle-hooks',
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

    shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(<WillMount />)).toWarnDev(
      'Unsafe legacy lifecycles will not be called for components using the new getDerivedStateFromProps() API.\n\n' +
        'WillMount uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
        '  UNSAFE_componentWillMount\n\n' +
        'The above lifecycles should be removed. Learn more about this warning here:\n' +
        'https://fb.me/react-async-component-lifecycle-hooks',
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

    shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(<WillMountAndUpdate />)).toWarnDev(
      'Unsafe legacy lifecycles will not be called for components using the new getDerivedStateFromProps() API.\n\n' +
        'WillMountAndUpdate uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
        '  componentWillMount\n' +
        '  UNSAFE_componentWillUpdate\n\n' +
        'The above lifecycles should be removed. Learn more about this warning here:\n' +
        'https://fb.me/react-async-component-lifecycle-hooks',
    );

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

    shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(<WillReceiveProps />)).toWarnDev(
      'Unsafe legacy lifecycles will not be called for components using the new getDerivedStateFromProps() API.\n\n' +
        'WillReceiveProps uses getDerivedStateFromProps() but also contains the following legacy lifecycles:\n' +
        '  componentWillReceiveProps\n\n' +
        'The above lifecycles should be removed. Learn more about this warning here:\n' +
        'https://fb.me/react-async-component-lifecycle-hooks',
    );
  });

  it('should only render 1 level deep', () => {
    function Parent() {
      return (
        <div>
          <Child />
        </div>
      );
    }
    function Child() {
      throw Error('This component should not render');
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(React.createElement(Parent));
  });

  it('should have shallow rendering', () => {
    class SomeComponent extends React.Component {
      render() {
        return (
          <div>
            <span className="child1" />
            <span className="child2" />
          </div>
        );
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SomeComponent />);

    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />,
    ]);
  });

  it('should handle ForwardRef', () => {
    const testRef = React.createRef();
    const SomeComponent = React.forwardRef((props, ref) => {
      expect(ref).toEqual(testRef);
      return (
        <div>
          <span className="child1" />
          <span className="child2" />
        </div>
      );
    });

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SomeComponent ref={testRef} />);

    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />,
    ]);
  });

  it('should enable shouldComponentUpdate to prevent a re-render', () => {
    let renderCounter = 0;
    class SimpleComponent extends React.Component {
      state = {update: false};
      shouldComponentUpdate(nextProps, nextState) {
        return this.state.update !== nextState.update;
      }
      render() {
        renderCounter++;
        return <div>{`${renderCounter}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SimpleComponent />);
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>1</div>);

    const instance = shallowRenderer.getMountedInstance();
    instance.setState({update: false});
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>1</div>);

    instance.setState({update: true});
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>2</div>);
  });

  it('should enable PureComponent to prevent a re-render', () => {
    let renderCounter = 0;
    class SimpleComponent extends React.PureComponent {
      state = {update: false};
      render() {
        renderCounter++;
        return <div>{`${renderCounter}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SimpleComponent />);
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>1</div>);

    const instance = shallowRenderer.getMountedInstance();
    instance.setState({update: false});
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>1</div>);

    instance.setState({update: true});
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>2</div>);
  });

  it('should not run shouldComponentUpdate during forced update', () => {
    let scuCounter = 0;
    class SimpleComponent extends React.Component {
      state = {count: 1};
      shouldComponentUpdate() {
        scuCounter++;
        return false;
      }
      render() {
        return <div>{`${this.state.count}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SimpleComponent />);
    expect(scuCounter).toEqual(0);
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>1</div>);

    // Force update the initial state. sCU should not fire.
    const instance = shallowRenderer.getMountedInstance();
    instance.forceUpdate();
    expect(scuCounter).toEqual(0);
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>1</div>);

    // Setting state updates the instance, but doesn't re-render
    // because sCU returned false.
    instance.setState(state => ({count: state.count + 1}));
    expect(scuCounter).toEqual(1);
    expect(instance.state.count).toEqual(2);
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>1</div>);

    // A force update updates the render output, but doesn't call sCU.
    instance.forceUpdate();
    expect(scuCounter).toEqual(1);
    expect(instance.state.count).toEqual(2);
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>2</div>);
  });

  it('should rerender when calling forceUpdate', () => {
    let renderCounter = 0;
    class SimpleComponent extends React.Component {
      render() {
        renderCounter += 1;
        return <div />;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SimpleComponent />);
    expect(renderCounter).toEqual(1);

    const instance = shallowRenderer.getMountedInstance();
    instance.forceUpdate();
    expect(renderCounter).toEqual(2);
  });

  it('should shallow render a functional component', () => {
    function SomeComponent(props, context) {
      return (
        <div>
          <div>{props.foo}</div>
          <div>{context.bar}</div>
          <span className="child1" />
          <span className="child2" />
        </div>
      );
    }
    SomeComponent.contextTypes = {
      bar: PropTypes.string,
    };

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SomeComponent foo={'FOO'} />, {
      bar: 'BAR',
    });

    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <div>FOO</div>,
      <div>BAR</div>,
      <span className="child1" />,
      <span className="child2" />,
    ]);
  });

  it('should shallow render a component returning strings directly from render', () => {
    const Text = ({value}) => value;

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<Text value="foo" />);
    expect(result).toEqual('foo');
  });

  it('should shallow render a component returning numbers directly from render', () => {
    const Text = ({value}) => value;

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<Text value={10} />);
    expect(result).toEqual(10);
  });

  it('should shallow render a fragment', () => {
    class SomeComponent extends React.Component {
      render() {
        return <div />;
      }
    }
    class Fragment extends React.Component {
      render() {
        return [<div key="a" />, <span key="b" />, <SomeComponent />];
      }
    }
    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<Fragment />);
    expect(result).toEqual([
      <div key="a" />,
      <span key="b" />,
      <SomeComponent />,
    ]);
  });

  it('should shallow render a React.fragment', () => {
    class SomeComponent extends React.Component {
      render() {
        return <div />;
      }
    }
    class Fragment extends React.Component {
      render() {
        return (
          <React.Fragment>
            <div />
            <span />
            <SomeComponent />
          </React.Fragment>
        );
      }
    }
    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<Fragment />);
    expect(result).toEqual(
      <React.Fragment>
        <div />
        <span />
        <SomeComponent />
      </React.Fragment>,
    );
  });

  it('should throw for invalid elements', () => {
    class SomeComponent extends React.Component {
      render() {
        return <div />;
      }
    }

    const shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(SomeComponent)).toThrowError(
      'ReactShallowRenderer render(): Invalid component element. Instead of ' +
        'passing a component class, make sure to instantiate it by passing it ' +
        'to React.createElement.',
    );
    expect(() => shallowRenderer.render(<div />)).toThrowError(
      'ReactShallowRenderer render(): Shallow rendering works only with ' +
        'custom components, not primitives (div). Instead of calling ' +
        '`.render(el)` and inspecting the rendered output, look at `el.props` ' +
        'directly instead.',
    );
  });

  it('should have shallow unmounting', () => {
    const componentWillUnmount = jest.fn();

    class SomeComponent extends React.Component {
      componentWillUnmount = componentWillUnmount;
      render() {
        return <div />;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SomeComponent />);
    shallowRenderer.unmount();

    expect(componentWillUnmount).toBeCalled();
  });

  it('can shallow render to null', () => {
    class SomeComponent extends React.Component {
      render() {
        return null;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SomeComponent />);

    expect(result).toBe(null);
  });

  it('can shallow render with a ref', () => {
    class SomeComponent extends React.Component {
      render() {
        return <div ref="hello" />;
      }
    }

    const shallowRenderer = createRenderer();
    // Shouldn't crash.
    shallowRenderer.render(<SomeComponent />);
  });

  it('lets you update shallowly rendered components', () => {
    class SomeComponent extends React.Component {
      state = {clicked: false};

      onClick = () => {
        this.setState({clicked: true});
      };

      render() {
        const className = this.state.clicked ? 'was-clicked' : '';

        if (this.props.aNew === 'prop') {
          return (
            <a href="#" onClick={this.onClick} className={className}>
              Test link
            </a>
          );
        } else {
          return (
            <div>
              <span className="child1" />
              <span className="child2" />
            </div>
          );
        }
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SomeComponent />);
    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />,
    ]);

    const updatedResult = shallowRenderer.render(<SomeComponent aNew="prop" />);
    expect(updatedResult.type).toBe('a');

    const mockEvent = {};
    updatedResult.props.onClick(mockEvent);

    const updatedResultCausedByClick = shallowRenderer.getRenderOutput();
    expect(updatedResultCausedByClick.type).toBe('a');
    expect(updatedResultCausedByClick.props.className).toBe('was-clicked');
  });

  it('can access the mounted component instance', () => {
    class SimpleComponent extends React.Component {
      someMethod = () => {
        return this.props.n;
      };

      render() {
        return <div>{this.props.n}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SimpleComponent n={5} />);
    expect(shallowRenderer.getMountedInstance().someMethod()).toEqual(5);
  });

  it('can shallowly render components with contextTypes', () => {
    class SimpleComponent extends React.Component {
      static contextTypes = {
        name: PropTypes.string,
      };

      render() {
        return <div />;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result).toEqual(<div />);
  });

  it('passes expected params to legacy component lifecycle methods', () => {
    const componentDidUpdateParams = [];
    const componentWillReceivePropsParams = [];
    const componentWillUpdateParams = [];
    const setStateParams = [];
    const shouldComponentUpdateParams = [];

    const initialProp = {prop: 'init prop'};
    const initialState = {state: 'init state'};
    const initialContext = {context: 'init context'};
    const updatedState = {state: 'updated state'};
    const updatedProp = {prop: 'updated prop'};
    const updatedContext = {context: 'updated context'};

    class SimpleComponent extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = initialState;
      }
      static contextTypes = {
        context: PropTypes.string,
      };
      componentDidUpdate(...args) {
        componentDidUpdateParams.push(...args);
      }
      UNSAFE_componentWillReceiveProps(...args) {
        componentWillReceivePropsParams.push(...args);
        this.setState((...innerArgs) => {
          setStateParams.push(...innerArgs);
          return updatedState;
        });
      }
      UNSAFE_componentWillUpdate(...args) {
        componentWillUpdateParams.push(...args);
      }
      shouldComponentUpdate(...args) {
        shouldComponentUpdateParams.push(...args);
        return true;
      }
      render() {
        return null;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(
      React.createElement(SimpleComponent, initialProp),
      initialContext,
    );
    expect(componentDidUpdateParams).toEqual([]);
    expect(componentWillReceivePropsParams).toEqual([]);
    expect(componentWillUpdateParams).toEqual([]);
    expect(setStateParams).toEqual([]);
    expect(shouldComponentUpdateParams).toEqual([]);

    // Lifecycle hooks should be invoked with the correct prev/next params on update.
    shallowRenderer.render(
      React.createElement(SimpleComponent, updatedProp),
      updatedContext,
    );
    expect(componentWillReceivePropsParams).toEqual([
      updatedProp,
      updatedContext,
    ]);
    expect(setStateParams).toEqual([initialState, initialProp]);
    expect(shouldComponentUpdateParams).toEqual([
      updatedProp,
      updatedState,
      updatedContext,
    ]);
    expect(componentWillUpdateParams).toEqual([
      updatedProp,
      updatedState,
      updatedContext,
    ]);
    expect(componentDidUpdateParams).toEqual([]);
  });

  it('passes expected params to new component lifecycle methods', () => {
    const componentDidUpdateParams = [];
    const getDerivedStateFromPropsParams = [];
    const shouldComponentUpdateParams = [];

    const initialProp = {prop: 'init prop'};
    const initialState = {state: 'init state'};
    const initialContext = {context: 'init context'};
    const updatedProp = {prop: 'updated prop'};
    const updatedContext = {context: 'updated context'};

    class SimpleComponent extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = initialState;
      }
      static contextTypes = {
        context: PropTypes.string,
      };
      componentDidUpdate(...args) {
        componentDidUpdateParams.push(...args);
      }
      static getDerivedStateFromProps(...args) {
        getDerivedStateFromPropsParams.push(args);
        return null;
      }
      shouldComponentUpdate(...args) {
        shouldComponentUpdateParams.push(...args);
        return true;
      }
      render() {
        return null;
      }
    }

    const shallowRenderer = createRenderer();

    // The only lifecycle hook that should be invoked on initial render
    // Is the static getDerivedStateFromProps() methods
    shallowRenderer.render(
      React.createElement(SimpleComponent, initialProp),
      initialContext,
    );
    expect(getDerivedStateFromPropsParams).toEqual([
      [initialProp, initialState],
    ]);
    expect(componentDidUpdateParams).toEqual([]);
    expect(shouldComponentUpdateParams).toEqual([]);

    // Lifecycle hooks should be invoked with the correct prev/next params on update.
    shallowRenderer.render(
      React.createElement(SimpleComponent, updatedProp),
      updatedContext,
    );
    expect(getDerivedStateFromPropsParams).toEqual([
      [initialProp, initialState],
      [updatedProp, initialState],
    ]);
    expect(shouldComponentUpdateParams).toEqual([
      updatedProp,
      initialState,
      updatedContext,
    ]);
    expect(componentDidUpdateParams).toEqual([]);
  });

  it('can shallowly render components with ref as function', () => {
    class SimpleComponent extends React.Component {
      state = {clicked: false};

      handleUserClick = () => {
        this.setState({clicked: true});
      };

      render() {
        return (
          <div
            ref={() => {}}
            onClick={this.handleUserClick}
            className={this.state.clicked ? 'clicked' : ''}
          />
        );
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SimpleComponent />);
    let result = shallowRenderer.getRenderOutput();
    expect(result.type).toEqual('div');
    expect(result.props.className).toEqual('');
    result.props.onClick();

    result = shallowRenderer.getRenderOutput();
    expect(result.type).toEqual('div');
    expect(result.props.className).toEqual('clicked');
  });

  it('can initialize state via static getDerivedStateFromProps', () => {
    class SimpleComponent extends React.Component {
      state = {
        count: 1,
      };

      static getDerivedStateFromProps(props, prevState) {
        return {
          count: prevState.count + props.incrementBy,
          other: 'foobar',
        };
      }

      render() {
        return (
          <div>{`count:${this.state.count}, other:${this.state.other}`}</div>
        );
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent incrementBy={2} />);
    expect(result).toEqual(<div>count:3, other:foobar</div>);
  });

  it('can setState in componentWillMount when shallow rendering', () => {
    class SimpleComponent extends React.Component {
      UNSAFE_componentWillMount() {
        this.setState({groovy: 'doovy'});
      }

      render() {
        return <div>{this.state.groovy}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result).toEqual(<div>doovy</div>);
  });

  it('can setState in componentWillMount repeatedly when shallow rendering', () => {
    class SimpleComponent extends React.Component {
      state = {
        separator: '-',
      };

      UNSAFE_componentWillMount() {
        this.setState({groovy: 'doovy'});
        this.setState({doovy: 'groovy'});
      }

      render() {
        const {groovy, doovy, separator} = this.state;

        return <div>{`${groovy}${separator}${doovy}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result).toEqual(<div>doovy-groovy</div>);
  });

  it('can setState in componentWillMount with an updater function repeatedly when shallow rendering', () => {
    class SimpleComponent extends React.Component {
      state = {
        separator: '-',
      };

      UNSAFE_componentWillMount() {
        this.setState(state => ({groovy: 'doovy'}));
        this.setState(state => ({doovy: state.groovy}));
      }

      render() {
        const {groovy, doovy, separator} = this.state;

        return <div>{`${groovy}${separator}${doovy}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result).toEqual(<div>doovy-doovy</div>);
  });

  it('can setState in componentWillReceiveProps when shallow rendering', () => {
    class SimpleComponent extends React.Component {
      state = {count: 0};

      UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.updateState) {
          this.setState({count: 1});
        }
      }

      render() {
        return <div>{this.state.count}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(
      <SimpleComponent updateState={false} />,
    );
    expect(result.props.children).toEqual(0);

    result = shallowRenderer.render(<SimpleComponent updateState={true} />);
    expect(result.props.children).toEqual(1);
  });

  it('can update state with static getDerivedStateFromProps when shallow rendering', () => {
    class SimpleComponent extends React.Component {
      state = {count: 1};

      static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.updateState) {
          return {count: nextProps.incrementBy + prevState.count};
        }

        return null;
      }

      render() {
        return <div>{this.state.count}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(
      <SimpleComponent updateState={false} incrementBy={0} />,
    );
    expect(result.props.children).toEqual(1);

    result = shallowRenderer.render(
      <SimpleComponent updateState={true} incrementBy={2} />,
    );
    expect(result.props.children).toEqual(3);

    result = shallowRenderer.render(
      <SimpleComponent updateState={false} incrementBy={2} />,
    );
    expect(result.props.children).toEqual(3);
  });

  it('can setState with an updater function', () => {
    let instance;

    class SimpleComponent extends React.Component {
      state = {
        counter: 0,
      };

      render() {
        instance = this;
        return (
          <button ref="button" onClick={this.onClick}>
            {this.state.counter}
          </button>
        );
      }
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(<SimpleComponent defaultCount={1} />);
    expect(result.props.children).toEqual(0);

    instance.setState((state, props) => {
      return {counter: props.defaultCount + 1};
    });

    result = shallowRenderer.getRenderOutput();
    expect(result.props.children).toEqual(2);
  });

  it('can setState with a callback', () => {
    let instance;

    class SimpleComponent extends React.Component {
      state = {
        counter: 0,
      };
      render() {
        instance = this;
        return <p>{this.state.counter}</p>;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result.props.children).toBe(0);

    const callback = jest.fn(function() {
      expect(this).toBe(instance);
    });

    instance.setState({counter: 1}, callback);

    const updated = shallowRenderer.getRenderOutput();
    expect(updated.props.children).toBe(1);
    expect(callback).toHaveBeenCalled();
  });

  it('can replaceState with a callback', () => {
    let instance;

    class SimpleComponent extends React.Component {
      state = {
        counter: 0,
      };
      render() {
        instance = this;
        return <p>{this.state.counter}</p>;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result.props.children).toBe(0);

    const callback = jest.fn(function() {
      expect(this).toBe(instance);
    });

    // No longer a public API, but we can test that it works internally by
    // reaching into the updater.
    shallowRenderer._updater.enqueueReplaceState(
      instance,
      {counter: 1},
      callback,
    );

    const updated = shallowRenderer.getRenderOutput();
    expect(updated.props.children).toBe(1);
    expect(callback).toHaveBeenCalled();
  });

  it('can forceUpdate with a callback', () => {
    let instance;

    class SimpleComponent extends React.Component {
      state = {
        counter: 0,
      };
      render() {
        instance = this;
        return <p>{this.state.counter}</p>;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result.props.children).toBe(0);

    const callback = jest.fn(function() {
      expect(this).toBe(instance);
    });

    instance.forceUpdate(callback);

    const updated = shallowRenderer.getRenderOutput();
    expect(updated.props.children).toBe(0);
    expect(callback).toHaveBeenCalled();
  });

  it('can pass context when shallowly rendering', () => {
    class SimpleComponent extends React.Component {
      static contextTypes = {
        name: PropTypes.string,
      };

      render() {
        return <div>{this.context.name}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />, {
      name: 'foo',
    });
    expect(result).toEqual(<div>foo</div>);
  });

  it('should track context across updates', () => {
    class SimpleComponent extends React.Component {
      static contextTypes = {
        foo: PropTypes.string,
      };

      state = {
        bar: 'bar',
      };

      render() {
        return <div>{`${this.context.foo}:${this.state.bar}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(<SimpleComponent />, {
      foo: 'foo',
    });
    expect(result).toEqual(<div>foo:bar</div>);

    const instance = shallowRenderer.getMountedInstance();
    instance.setState({bar: 'baz'});

    result = shallowRenderer.getRenderOutput();
    expect(result).toEqual(<div>foo:baz</div>);
  });

  it('should filter context by contextTypes', () => {
    class SimpleComponent extends React.Component {
      static contextTypes = {
        foo: PropTypes.string,
      };
      render() {
        return <div>{`${this.context.foo}:${this.context.bar}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(<SimpleComponent />, {
      foo: 'foo',
      bar: 'bar',
    });
    expect(result).toEqual(<div>foo:undefined</div>);
  });

  it('can fail context when shallowly rendering', () => {
    class SimpleComponent extends React.Component {
      static contextTypes = {
        name: PropTypes.string.isRequired,
      };

      render() {
        return <div>{this.context.name}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(<SimpleComponent />)).toWarnDev(
      'Warning: Failed context type: The context `name` is marked as ' +
        'required in `SimpleComponent`, but its value is `undefined`.\n' +
        '    in SimpleComponent (at **)',
    );
  });

  it('should warn about propTypes (but only once)', () => {
    class SimpleComponent extends React.Component {
      render() {
        return React.createElement('div', null, this.props.name);
      }
    }

    SimpleComponent.propTypes = {
      name: PropTypes.string.isRequired,
    };

    const shallowRenderer = createRenderer();
    expect(() =>
      shallowRenderer.render(React.createElement(SimpleComponent, {name: 123})),
    ).toWarnDev(
      'Warning: Failed prop type: Invalid prop `name` of type `number` ' +
        'supplied to `SimpleComponent`, expected `string`.\n' +
        '    in SimpleComponent',
    );
  });

  it('should enable rendering of cloned element', () => {
    class SimpleComponent extends React.Component {
      constructor(props) {
        super(props);

        this.state = {
          bar: 'bar',
        };
      }

      render() {
        return <div>{`${this.props.foo}:${this.state.bar}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    const el = <SimpleComponent foo="foo" />;
    let result = shallowRenderer.render(el);
    expect(result).toEqual(<div>foo:bar</div>);

    const cloned = React.cloneElement(el, {foo: 'baz'});
    result = shallowRenderer.render(cloned);
    expect(result).toEqual(<div>baz:bar</div>);
  });

  it('this.state should be updated on setState callback inside componentWillMount', () => {
    let stateSuccessfullyUpdated = false;

    class Component extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          hasUpdatedState: false,
        };
      }

      UNSAFE_componentWillMount() {
        this.setState(
          {hasUpdatedState: true},
          () => (stateSuccessfullyUpdated = this.state.hasUpdatedState),
        );
      }

      render() {
        return <div>{this.props.children}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<Component />);
    expect(stateSuccessfullyUpdated).toBe(true);
  });

  it('should handle multiple callbacks', () => {
    const mockFn = jest.fn();
    const shallowRenderer = createRenderer();

    class Component extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          foo: 'foo',
        };
      }

      UNSAFE_componentWillMount() {
        this.setState({foo: 'bar'}, () => mockFn());
        this.setState({foo: 'foobar'}, () => mockFn());
      }

      render() {
        return <div>{this.state.foo}</div>;
      }
    }

    shallowRenderer.render(<Component />);

    expect(mockFn.mock.calls.length).toBe(2);

    // Ensure the callback queue is cleared after the callbacks are invoked
    const mountedInstance = shallowRenderer.getMountedInstance();
    mountedInstance.setState({foo: 'bar'}, () => mockFn());
    expect(mockFn.mock.calls.length).toBe(3);
  });

  it('should call the setState callback even if shouldComponentUpdate = false', done => {
    const mockFn = jest.fn().mockReturnValue(false);

    class Component extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          hasUpdatedState: false,
        };
      }

      shouldComponentUpdate() {
        return mockFn();
      }

      render() {
        return <div>{this.state.hasUpdatedState}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<Component />);

    const mountedInstance = shallowRenderer.getMountedInstance();
    mountedInstance.setState({hasUpdatedState: true}, () => {
      expect(mockFn).toBeCalled();
      expect(mountedInstance.state.hasUpdatedState).toBe(true);
      done();
    });
  });

  it('throws usefully when rendering badly-typed elements', () => {
    const shallowRenderer = createRenderer();

    const renderAndVerifyWarningAndError = (Component, typeString) => {
      expect(() => {
        expect(() => shallowRenderer.render(<Component />)).toWarnDev(
          'React.createElement: type is invalid -- expected a string ' +
            '(for built-in components) or a class/function (for composite components) ' +
            `but got: ${typeString}.`,
        );
      }).toThrowError(
        'ReactShallowRenderer render(): Shallow rendering works only with custom ' +
          `components, but the provided element type was \`${typeString}\`.`,
      );
    };

    renderAndVerifyWarningAndError(undefined, 'undefined');
    renderAndVerifyWarningAndError(null, 'null');
    renderAndVerifyWarningAndError([], 'array');
    renderAndVerifyWarningAndError({}, 'object');
  });

  it('should have initial state of null if not defined', () => {
    class SomeComponent extends React.Component {
      render() {
        return <span />;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SomeComponent />);

    expect(shallowRenderer.getMountedInstance().state).toBeNull();
  });

  it('should warn if both componentWillReceiveProps and static getDerivedStateFromProps exist', () => {
    class ComponentWithWarnings extends React.Component {
      state = {};
      static getDerivedStateFromProps(props, prevState) {
        return null;
      }
      UNSAFE_componentWillReceiveProps(nextProps) {}
      render() {
        return null;
      }
    }

    const shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(<ComponentWithWarnings />)).toWarnDev(
      'ComponentWithWarnings uses getDerivedStateFromProps() but also contains the following legacy lifecycles',
    );

    // Should not log duplicate warning
    shallowRenderer.render(<ComponentWithWarnings />);
  });

  it('should warn if getDerivedStateFromProps returns undefined', () => {
    class Component extends React.Component {
      state = {};
      static getDerivedStateFromProps() {}
      render() {
        return null;
      }
    }

    const shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(<Component />)).toWarnDev(
      'Component.getDerivedStateFromProps(): A valid state object (or null) must ' +
        'be returned. You have returned undefined.',
    );

    // De-duped
    shallowRenderer.render(<Component />);
  });

  it('should warn if state not initialized before getDerivedStateFromProps', () => {
    class Component extends React.Component {
      static getDerivedStateFromProps() {
        return null;
      }
      render() {
        return null;
      }
    }

    const shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(<Component />)).toWarnDev(
      'Component: Did not properly initialize state during construction. ' +
        'Expected state to be an object, but it was undefined.',
    );

    // De-duped
    shallowRenderer.render(<Component />);
  });

  it('should invoke both deprecated and new lifecycles if both are present', () => {
    const log = [];

    class Component extends React.Component {
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

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<Component foo="bar" />);
    expect(log).toEqual(['componentWillMount', 'UNSAFE_componentWillMount']);

    log.length = 0;

    shallowRenderer.render(<Component foo="baz" />);
    expect(log).toEqual([
      'componentWillReceiveProps',
      'UNSAFE_componentWillReceiveProps',
      'componentWillUpdate',
      'UNSAFE_componentWillUpdate',
    ]);
  });
});
