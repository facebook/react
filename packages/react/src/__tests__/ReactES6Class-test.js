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
    spyOnDev(console, 'error');
    class Foo extends React.Component {}
    expect(() => ReactDOM.render(<Foo />, container)).toThrow();

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Foo(...): No `render` method found on the returned component ' +
          'instance: you may have forgotten to define `render`.',
      );
    }
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
      componentWillMount() {
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
    spyOnDev(console, 'error');
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
      test(<Foo />, 'SPAN', '');
      if (__DEV__) {
        expect(console.error.calls.count()).toBe(1);
        expect(console.error.calls.argsFor(0)[0]).toContain(
          'Foo.state: must be set to an object or null',
        );
        console.error.calls.reset();
      }
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
      componentWillMount() {
        lifeCycles.push('will-mount');
      }
      componentDidMount() {
        lifeCycles.push('did-mount');
      }
      componentWillReceiveProps(nextProps) {
        lifeCycles.push('receive-props', nextProps);
      }
      shouldComponentUpdate(nextProps, nextState) {
        lifeCycles.push('should-update', nextProps, nextState);
        return true;
      }
      componentWillUpdate(nextProps, nextState) {
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
    spyOnDev(console, 'error');
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
    test(<Foo />, 'SPAN', 'foo');
    expect(getInitialStateWasCalled).toBe(false);
    expect(getDefaultPropsWasCalled).toBe(false);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(4);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'getInitialState was defined on Foo, a plain JavaScript class.',
      );
      expect(console.error.calls.argsFor(1)[0]).toContain(
        'getDefaultProps was defined on Foo, a plain JavaScript class.',
      );
      expect(console.error.calls.argsFor(2)[0]).toContain(
        'propTypes was defined as an instance property on Foo.',
      );
      expect(console.error.calls.argsFor(3)[0]).toContain(
        'contextTypes was defined as an instance property on Foo.',
      );
    }
  });

  it('does not warn about getInitialState() on class components if state is also defined.', () => {
    spyOnDev(console, 'error');
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
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(0);
    }
  });

  it('should warn when misspelling shouldComponentUpdate', () => {
    spyOnDev(console, 'error');

    class NamedComponent extends React.Component {
      componentShouldUpdate() {
        return false;
      }
      render() {
        return <span className="foo" />;
      }
    }
    test(<NamedComponent />, 'SPAN', 'foo');

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: ' +
          'NamedComponent has a method called componentShouldUpdate(). Did you ' +
          'mean shouldComponentUpdate()? The name is phrased as a question ' +
          'because the function is expected to return a value.',
      );
    }
  });

  it('should warn when misspelling componentWillReceiveProps', () => {
    spyOnDev(console, 'error');

    class NamedComponent extends React.Component {
      componentWillRecieveProps() {
        return false;
      }
      render() {
        return <span className="foo" />;
      }
    }
    test(<NamedComponent />, 'SPAN', 'foo');

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: ' +
          'NamedComponent has a method called componentWillRecieveProps(). Did ' +
          'you mean componentWillReceiveProps()?',
      );
    }
  });

  it('should throw AND warn when trying to access classic APIs', () => {
    spyOnDev(console, 'warn');
    const instance = test(<Inner name="foo" />, 'DIV', 'foo');
    expect(() => instance.replaceState({})).toThrow();
    expect(() => instance.isMounted()).toThrow();
    if (__DEV__) {
      expect(console.warn.calls.count()).toBe(2);
      expect(console.warn.calls.argsFor(0)[0]).toContain(
        'replaceState(...) is deprecated in plain JavaScript React classes',
      );
      expect(console.warn.calls.argsFor(1)[0]).toContain(
        'isMounted(...) is deprecated in plain JavaScript React classes',
      );
    }
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
