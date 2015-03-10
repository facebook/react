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

var React;

describe('ReactES6Class', function() {

  var container;
  var Inner;
  var attachedListener = null;
  var renderedName = null;

  beforeEach(function() {
    React = require('React');
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
    var instance = React.render(element, container);
    expect(container.firstChild).not.toBeNull();
    expect(container.firstChild.tagName).toBe(expectedTag);
    expect(container.firstChild.className).toBe(expectedClassName);
    return instance;
  }

  it('preserves the name of the class for use in error messages', function() {
    class Foo extends React.Component { }
    expect(Foo.name).toBe('Foo');
  });

  it('throws if no render function is defined', function() {
    class Foo extends React.Component { }
    expect(() => React.render(<Foo />, container)).toThrow();
  });

  it('renders a simple stateless component with prop', function() {
    class Foo {
      render() {
        return <Inner name={this.props.bar} />;
      }
    }
    test(<Foo bar="foo" />, 'DIV', 'foo');
    test(<Foo bar="bar" />, 'DIV', 'bar');
  });

  it('renders based on state using initial values in this.props', function() {
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

  it('renders based on state using props in the constructor', function() {
    class Foo extends React.Component {
      constructor(props) {
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
    var instance = test(<Foo initialValue="foo" />, 'DIV', 'foo');
    instance.changeState();
    test(<Foo />, 'SPAN', 'bar');
  });

  it('renders based on context in the constructor', function() {
    class Foo extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {tag: context.tag, className: this.context.className};
      }
      render() {
        var Tag = this.state.tag;
        return <Tag className={this.state.className} />;
      }
    }
    Foo.contextTypes = {
      tag: React.PropTypes.string,
      className: React.PropTypes.string
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
      tag: React.PropTypes.string,
      className: React.PropTypes.string
    };
    test(<Outer />, 'SPAN', 'foo');
  });

  it('renders only once when setting state in componentWillMount', function() {
    var renderCount = 0;
    class Foo extends React.Component {
      constructor(props) {
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

  it('should throw with non-object in the initial state property', function() {
    [['an array'], 'a string', 1234].forEach(function(state) {
      class Foo {
        constructor() {
          this.state = state;
        }
        render() {
          return <span />;
        }
      }
      expect(() => test(<Foo />, 'span', '')).toThrow(
        'Invariant Violation: Foo.state: ' +
        'must be set to an object or null'
      );
    });
  });

  it('should render with null in the initial state property', function() {
    class Foo extends React.Component {
      constructor() {
        this.state = null;
      }
      render() {
        return <span />;
      }
    }
    test(<Foo />, 'SPAN', '');
  });

  it('setState through an event handler', function() {
    class Foo extends React.Component {
      constructor(props) {
        this.state = {bar: props.initialValue};
      }
      handleClick() {
        this.setState({bar: 'bar'});
      }
      render() {
        return (
          <Inner
            name={this.state.bar}
            onClick={this.handleClick.bind(this)}
          />
        );
      }
    }
    test(<Foo initialValue="foo" />, 'DIV', 'foo');
    attachedListener();
    expect(renderedName).toBe('bar');
  });

  it('should not implicitly bind event handlers', function() {
    class Foo extends React.Component {
      constructor(props) {
        this.state = {bar: props.initialValue};
      }
      handleClick() {
        this.setState({bar: 'bar'});
      }
      render() {
        return (
          <Inner
            name={this.state.bar}
            onClick={this.handleClick}
          />
        );
      }
    }
    test(<Foo initialValue="foo" />, 'DIV', 'foo');
    expect(attachedListener).toThrow();
  });

  it('renders using forceUpdate even when there is no state', function() {
    class Foo extends React.Component {
      constructor(props) {
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

  it('will call all the normal life cycle methods', function() {
    var lifeCycles = [];
    class Foo {
      constructor() {
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
    expect(lifeCycles).toEqual([
      'will-mount',
      'did-mount'
    ]);
    lifeCycles = []; // reset
    test(<Foo value="bar" />, 'SPAN', 'bar');
    expect(lifeCycles).toEqual([
      'receive-props', {value: 'bar'},
      'should-update', {value: 'bar'}, {},
      'will-update', {value: 'bar'}, {},
      'did-update', {value: 'foo'}, {}
    ]);
    lifeCycles = []; // reset
    React.unmountComponentAtNode(container);
    expect(lifeCycles).toEqual([
      'will-unmount'
    ]);
  });

  it('warns when classic properties are defined on the instance, ' +
     'but does not invoke them.', function() {
    spyOn(console, 'warn');
    var getInitialStateWasCalled = false;
    class Foo extends React.Component {
      constructor() {
        this.contextTypes = {};
        this.propTypes = {};
      }
      getInitialState() {
        getInitialStateWasCalled = true;
        return {};
      }
      render() {
        return <span className="foo" />;
      }
    }
    test(<Foo />, 'SPAN', 'foo');
    expect(getInitialStateWasCalled).toBe(false);
    expect(console.warn.calls.length).toBe(3);
    expect(console.warn.calls[0].args[0]).toContain(
      'getInitialState was defined on Foo, a plain JavaScript class.'
    );
    expect(console.warn.calls[1].args[0]).toContain(
      'propTypes was defined as an instance property on Foo.'
    );
    expect(console.warn.calls[2].args[0]).toContain(
      'contextTypes was defined as an instance property on Foo.'
    );
  });

  it('should warn when mispelling shouldComponentUpdate', function() {
    spyOn(console, 'warn');

    class NamedComponent {
      componentShouldUpdate() {
        return false;
      }
      render() {
        return <span className="foo" />;
      }
    }
    test(<NamedComponent />, 'SPAN', 'foo');

    expect(console.warn.calls.length).toBe(1);
    expect(console.warn.calls[0].args[0]).toBe(
      'Warning: ' +
      'NamedComponent has a method called componentShouldUpdate(). Did you ' +
      'mean shouldComponentUpdate()? The name is phrased as a question ' +
      'because the function is expected to return a value.'
    );
  });

  it('should throw AND warn when trying to access classic APIs', function() {
    spyOn(console, 'warn');
    var instance = test(<Inner name="foo" />, 'DIV', 'foo');
    expect(() => instance.getDOMNode()).toThrow();
    expect(() => instance.replaceState({})).toThrow();
    expect(() => instance.isMounted()).toThrow();
    expect(() => instance.setProps({name: 'bar'})).toThrow();
    expect(() => instance.replaceProps({name: 'bar'})).toThrow();
    expect(console.warn.calls.length).toBe(5);
    expect(console.warn.calls[0].args[0]).toContain(
      'getDOMNode(...) is deprecated in plain JavaScript React classes'
    );
    expect(console.warn.calls[1].args[0]).toContain(
      'replaceState(...) is deprecated in plain JavaScript React classes'
    );
    expect(console.warn.calls[2].args[0]).toContain(
      'isMounted(...) is deprecated in plain JavaScript React classes'
    );
    expect(console.warn.calls[3].args[0]).toContain(
      'setProps(...) is deprecated in plain JavaScript React classes'
    );
    expect(console.warn.calls[4].args[0]).toContain(
      'replaceProps(...) is deprecated in plain JavaScript React classes'
    );
  });

  it('supports this.context passed via getChildContext', function() {
    class Bar {
      render() {
        return <div className={this.context.bar} />;
      }
    }
    Bar.contextTypes = {bar: React.PropTypes.string};
    class Foo {
      getChildContext() {
        return {bar: 'bar-through-context'};
      }
      render() {
        return <Bar />;
      }
    }
    Foo.childContextTypes = {bar: React.PropTypes.string};
    test(<Foo />, 'DIV', 'bar-through-context');
  });

  it('supports classic refs', function() {
    class Foo {
      render() {
        return <Inner name="foo" ref="inner" />;
      }
    }
    var instance = test(<Foo />, 'DIV', 'foo');
    expect(instance.refs.inner.getName()).toBe('foo');
  });

  it('supports drilling through to the DOM using findDOMNode', function() {
    var instance = test(<Inner name="foo" />, 'DIV', 'foo');
    var node = React.findDOMNode(instance);
    expect(node).toBe(container.firstChild);
  });

});
