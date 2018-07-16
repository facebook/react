/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let PropTypes;
let React;
let ReactDOM;

describe('ReactES6Class', () => {
  let container;
  const freeze = function(expectation) {
    Object.freeze(expectation);
    return expectation;
  };
  let Inner;
  let attachedListener = null;
  let renderedName = null;

  beforeEach(() => {
    PropTypes = require('prop-types');
    React = require('react');
    ReactDOM = require('react-dom');
    container = document.createElement('div');
    attachedListener = null;
    renderedName = null;
    Inner = class extends React.Component {
      getName() {
        return this.props.name;
      }
      render() {
        attachedListener = this.props.onClick;
        renderedName = this.props.name;
        return <div className={this.props.name} />;
      }
    };
  });

  function test(element, expectedTag, expectedClassName) {
    const instance = ReactDOM.render(element, container);
    expect(container.firstChild).not.toBeNull();
    expect(container.firstChild.tagName).toBe(expectedTag);
    expect(container.firstChild.className).toBe(expectedClassName);
    return instance;
  }

  it('preserves the name of the class for use in error messages', () => {
    class Foo extends React.Component {}
    expect(Foo.name).toBe('Foo');
  });

  it('throws if no render function is defined', () => {
    class Foo extends React.Component {}
    expect(() =>
      expect(() => ReactDOM.render(<Foo />, container)).toThrow(),
    ).toWarnDev(
      [
        // A failed component renders twice in DEV
        'Warning: Foo(...): No `render` method found on the returned component ' +
          'instance: you may have forgotten to define `render`.',
        'Warning: Foo(...): No `render` method found on the returned component ' +
          'instance: you may have forgotten to define `render`.',
      ],
      {withoutStack: true},
    );
  });

  it('renders a simple stateless component with prop', () => {
    class Foo extends React.Component {
      render() {
        return <Inner name={this.props.bar} />;
      }
    }
    test(<Foo bar="foo" />, 'DIV', 'foo');
    test(<Foo bar="bar" />, 'DIV', 'bar');
  });

  it('renders based on state using initial values in this.props', () => {
    class Foo extends React.Component {
      constructor(props) {
        super(props);
        this.state = {bar: this.props.initialValue};
      }
      render() {
        return <span className={this.state.bar} />;
      }
    }
    test(<Foo initialValue="foo" />, 'SPAN', 'foo');
  });

  it('renders based on state using props in the constructor', () => {
    class Foo extends React.Component {
      constructor(props) {
        super(props);
        this.state = {bar: props.initialValue};
      }
      changeState() {
        this.setState({bar: 'bar'});
      }
      render() {
        if (this.state.bar === 'foo') {
          return <div className="foo" />;
        }
        return <span className={this.state.bar} />;
      }
    }
    const instance = test(<Foo initialValue="foo" />, 'DIV', 'foo');
    instance.changeState();
    test(<Foo />, 'SPAN', 'bar');
  });

  it('sets initial state with value returned by static getDerivedStateFromProps', () => {
    class Foo extends React.Component {
      state = {};
      static getDerivedStateFromProps(nextProps, prevState) {
        return {
          foo: nextProps.foo,
          bar: 'bar',
        };
      }
      render() {
        return <div className={`${this.state.foo} ${this.state.bar}`} />;
      }
    }
    test(<Foo foo="foo" />, 'DIV', 'foo bar');
  });

  it('warns if getDerivedStateFromProps is not static', () => {
    class Foo extends React.Component {
      getDerivedStateFromProps() {
        return {};
      }
      render() {
        return <div />;
      }
    }
    expect(() => ReactDOM.render(<Foo foo="foo" />, container)).toWarnDev(
      'Foo: getDerivedStateFromProps() is defined as an instance method ' +
        'and will be ignored. Instead, declare it as a static method.',
      {withoutStack: true},
    );
  });

  it('warns if getDerivedStateFromCatch is not static', () => {
    class Foo extends React.Component {
      getDerivedStateFromCatch() {
        return {};
      }
      render() {
        return <div />;
      }
    }
    expect(() => ReactDOM.render(<Foo foo="foo" />, container)).toWarnDev(
      'Foo: getDerivedStateFromCatch() is defined as an instance method ' +
        'and will be ignored. Instead, declare it as a static method.',
      {withoutStack: true},
    );
  });

  it('warns if getSnapshotBeforeUpdate is static', () => {
    class Foo extends React.Component {
      static getSnapshotBeforeUpdate() {}
      render() {
        return <div />;
      }
    }
    expect(() => ReactDOM.render(<Foo foo="foo" />, container)).toWarnDev(
      'Foo: getSnapshotBeforeUpdate() is defined as a static method ' +
        'and will be ignored. Instead, declare it as an instance method.',
      {withoutStack: true},
    );
  });

  it('warns if state not initialized before static getDerivedStateFromProps', () => {
    class Foo extends React.Component {
      static getDerivedStateFromProps(nextProps, prevState) {
        return {
          foo: nextProps.foo,
          bar: 'bar',
        };
      }
      render() {
        return <div className={`${this.state.foo} ${this.state.bar}`} />;
      }
    }
    expect(() => ReactDOM.render(<Foo foo="foo" />, container)).toWarnDev(
      'Foo: Did not properly initialize state during construction. ' +
        'Expected state to be an object, but it was undefined.',
      {withoutStack: true},
    );
  });

  it('updates initial state with values returned by static getDerivedStateFromProps', () => {
    class Foo extends React.Component {
      state = {
        foo: 'foo',
        bar: 'bar',
      };
      static getDerivedStateFromProps(nextProps, prevState) {
        return {
          foo: `not-${prevState.foo}`,
        };
      }
      render() {
        return <div className={`${this.state.foo} ${this.state.bar}`} />;
      }
    }
    test(<Foo />, 'DIV', 'not-foo bar');
  });

  it('renders updated state with values returned by static getDerivedStateFromProps', () => {
    class Foo extends React.Component {
      state = {
        value: 'initial',
      };
      static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.update) {
          return {
            value: 'updated',
          };
        }
        return null;
      }
      render() {
        return <div className={this.state.value} />;
      }
    }
    test(<Foo update={false} />, 'DIV', 'initial');
    test(<Foo update={true} />, 'DIV', 'updated');
  });

  it('renders based on context in the constructor', () => {
    class Foo extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {tag: context.tag, className: this.context.className};
      }
      render() {
        const Tag = this.state.tag;
        return <Tag className={this.state.className} />;
      }
    }
    Foo.contextTypes = {
      tag: PropTypes.string,
      className: PropTypes.string,
    };

    class Outer extends React.Component {
      getChildContext() {
        return {tag: 'span', className: 'foo'};
      }
      render() {
        return <Foo />;
      }
    }
    Outer.childContextTypes = {
      tag: PropTypes.string,
      className: PropTypes.string,
    };
    test(<Outer />, 'SPAN', 'foo');
  });

  it('renders only once when setting state in componentWillMount', () => {
    let renderCount = 0;
    class Foo extends React.Component {
      constructor(props) {
        super(props);
        this.state = {bar: props.initialValue};
      }
      UNSAFE_componentWillMount() {
        this.setState({bar: 'bar'});
      }
      render() {
        renderCount++;
        return <span className={this.state.bar} />;
      }
    }
    test(<Foo initialValue="foo" />, 'SPAN', 'bar');
    expect(renderCount).toBe(1);
  });

  it('should warn with non-object in the initial state property', () => {
    [['an array'], 'a string', 1234].forEach(function(state) {
      class Foo extends React.Component {
        constructor() {
          super();
          this.state = state;
        }
        render() {
          return <span />;
        }
      }
      expect(() => test(<Foo />, 'SPAN', '')).toWarnDev(
        'Foo.state: must be set to an object or null',
        {withoutStack: true},
      );
    });
  });

  it('should render with null in the initial state property', () => {
    class Foo extends React.Component {
      constructor() {
        super();
        this.state = null;
      }
      render() {
        return <span />;
      }
    }
    test(<Foo />, 'SPAN', '');
  });

  it('setState through an event handler', () => {
    class Foo extends React.Component {
      constructor(props) {
        super(props);
        this.state = {bar: props.initialValue};
      }
      handleClick() {
        this.setState({bar: 'bar'});
      }
      render() {
        return (
          <Inner name={this.state.bar} onClick={this.handleClick.bind(this)} />
        );
      }
    }
    test(<Foo initialValue="foo" />, 'DIV', 'foo');
    attachedListener();
    expect(renderedName).toBe('bar');
  });

  it('should not implicitly bind event handlers', () => {
    class Foo extends React.Component {
      constructor(props) {
        super(props);
        this.state = {bar: props.initialValue};
      }
      handleClick() {
        this.setState({bar: 'bar'});
      }
      render() {
        return <Inner name={this.state.bar} onClick={this.handleClick} />;
      }
    }
    test(<Foo initialValue="foo" />, 'DIV', 'foo');
    expect(attachedListener).toThrow();
  });

  it('renders using forceUpdate even when there is no state', () => {
    class Foo extends React.Component {
      constructor(props) {
        super(props);
        this.mutativeValue = props.initialValue;
      }
      handleClick() {
        this.mutativeValue = 'bar';
        this.forceUpdate();
      }
      render() {
        return (
          <Inner
            name={this.mutativeValue}
            onClick={this.handleClick.bind(this)}
          />
        );
      }
    }
    test(<Foo initialValue="foo" />, 'DIV', 'foo');
    attachedListener();
    expect(renderedName).toBe('bar');
  });

  it('will call all the normal life cycle methods', () => {
    let lifeCycles = [];
    class Foo extends React.Component {
      constructor() {
        super();
        this.state = {};
      }
      UNSAFE_componentWillMount() {
        lifeCycles.push('will-mount');
      }
      componentDidMount() {
        lifeCycles.push('did-mount');
      }
      UNSAFE_componentWillReceiveProps(nextProps) {
        lifeCycles.push('receive-props', nextProps);
      }
      shouldComponentUpdate(nextProps, nextState) {
        lifeCycles.push('should-update', nextProps, nextState);
        return true;
      }
      UNSAFE_componentWillUpdate(nextProps, nextState) {
        lifeCycles.push('will-update', nextProps, nextState);
      }
      componentDidUpdate(prevProps, prevState) {
        lifeCycles.push('did-update', prevProps, prevState);
      }
      componentWillUnmount() {
        lifeCycles.push('will-unmount');
      }
      render() {
        return <span className={this.props.value} />;
      }
    }
    test(<Foo value="foo" />, 'SPAN', 'foo');
    expect(lifeCycles).toEqual(['will-mount', 'did-mount']);
    lifeCycles = []; // reset
    test(<Foo value="bar" />, 'SPAN', 'bar');
    // prettier-ignore
    expect(lifeCycles).toEqual([
      'receive-props', freeze({value: 'bar'}),
      'should-update', freeze({value: 'bar'}), {},
      'will-update', freeze({value: 'bar'}), {},
      'did-update', freeze({value: 'foo'}), {},
    ]);
    lifeCycles = []; // reset
    ReactDOM.unmountComponentAtNode(container);
    expect(lifeCycles).toEqual(['will-unmount']);
  });

  it('warns when classic properties are defined on the instance, but does not invoke them.', () => {
    let getDefaultPropsWasCalled = false;
    let getInitialStateWasCalled = false;
    class Foo extends React.Component {
      constructor() {
        super();
        this.contextTypes = {};
        this.propTypes = {};
      }
      getInitialState() {
        getInitialStateWasCalled = true;
        return {};
      }
      getDefaultProps() {
        getDefaultPropsWasCalled = true;
        return {};
      }
      render() {
        return <span className="foo" />;
      }
    }

    expect(() => test(<Foo />, 'SPAN', 'foo')).toWarnDev(
      [
        'getInitialState was defined on Foo, a plain JavaScript class.',
        'getDefaultProps was defined on Foo, a plain JavaScript class.',
        'propTypes was defined as an instance property on Foo.',
        'contextTypes was defined as an instance property on Foo.',
      ],
      {withoutStack: true},
    );
    expect(getInitialStateWasCalled).toBe(false);
    expect(getDefaultPropsWasCalled).toBe(false);
  });

  it('does not warn about getInitialState() on class components if state is also defined.', () => {
    class Foo extends React.Component {
      state = this.getInitialState();
      getInitialState() {
        return {};
      }
      render() {
        return <span className="foo" />;
      }
    }
    test(<Foo />, 'SPAN', 'foo');
  });

  it('should warn when misspelling shouldComponentUpdate', () => {
    class NamedComponent extends React.Component {
      componentShouldUpdate() {
        return false;
      }
      render() {
        return <span className="foo" />;
      }
    }

    expect(() => test(<NamedComponent />, 'SPAN', 'foo')).toWarnDev(
      'Warning: ' +
        'NamedComponent has a method called componentShouldUpdate(). Did you ' +
        'mean shouldComponentUpdate()? The name is phrased as a question ' +
        'because the function is expected to return a value.',
      {withoutStack: true},
    );
  });

  it('should warn when misspelling componentWillReceiveProps', () => {
    class NamedComponent extends React.Component {
      componentWillRecieveProps() {
        return false;
      }
      render() {
        return <span className="foo" />;
      }
    }

    expect(() => test(<NamedComponent />, 'SPAN', 'foo')).toWarnDev(
      'Warning: ' +
        'NamedComponent has a method called componentWillRecieveProps(). Did ' +
        'you mean componentWillReceiveProps()?',
      {withoutStack: true},
    );
  });

  it('should warn when misspelling UNSAFE_componentWillReceiveProps', () => {
    class NamedComponent extends React.Component {
      UNSAFE_componentWillRecieveProps() {
        return false;
      }
      render() {
        return <span className="foo" />;
      }
    }

    expect(() => test(<NamedComponent />, 'SPAN', 'foo')).toWarnDev(
      'Warning: ' +
        'NamedComponent has a method called UNSAFE_componentWillRecieveProps(). ' +
        'Did you mean UNSAFE_componentWillReceiveProps()?',
      {withoutStack: true},
    );
  });

  it('should throw AND warn when trying to access classic APIs', () => {
    const instance = test(<Inner name="foo" />, 'DIV', 'foo');
    expect(() =>
      expect(() => instance.replaceState({})).toThrow(),
    ).toLowPriorityWarnDev(
      'replaceState(...) is deprecated in plain JavaScript React classes',
      {withoutStack: true},
    );
    expect(() =>
      expect(() => instance.isMounted()).toThrow(),
    ).toLowPriorityWarnDev(
      'isMounted(...) is deprecated in plain JavaScript React classes',
      {withoutStack: true},
    );
  });

  it('supports this.context passed via getChildContext', () => {
    class Bar extends React.Component {
      render() {
        return <div className={this.context.bar} />;
      }
    }
    Bar.contextTypes = {bar: PropTypes.string};
    class Foo extends React.Component {
      getChildContext() {
        return {bar: 'bar-through-context'};
      }
      render() {
        return <Bar />;
      }
    }
    Foo.childContextTypes = {bar: PropTypes.string};
    test(<Foo />, 'DIV', 'bar-through-context');
  });

  it('supports classic refs', () => {
    class Foo extends React.Component {
      render() {
        return <Inner name="foo" ref="inner" />;
      }
    }
    const instance = test(<Foo />, 'DIV', 'foo');
    expect(instance.refs.inner.getName()).toBe('foo');
  });

  it('supports drilling through to the DOM using findDOMNode', () => {
    const instance = test(<Inner name="foo" />, 'DIV', 'foo');
    const node = ReactDOM.findDOMNode(instance);
    expect(node).toBe(container.firstChild);
  });
});
