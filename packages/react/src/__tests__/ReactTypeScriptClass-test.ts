/// <reference path="./testDefinitions/PropTypes.d.ts" />
/// <reference path="./testDefinitions/React.d.ts" />
/// <reference path="./testDefinitions/ReactDOM.d.ts" />

/*!
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React = require('react');
import ReactDOM = require('react-dom');
import PropTypes = require('prop-types');

// Before Each

let container;
let attachedListener = null;
let renderedName = null;

class Inner extends React.Component {
  getName() {
    return this.props.name;
  }
  render() {
    attachedListener = this.props.onClick;
    renderedName = this.props.name;
    return React.createElement('div', { className: this.props.name });
  }
}

function test(element, expectedTag, expectedClassName) {
  const instance = ReactDOM.render(element, container);
  expect(container.firstChild).not.toBeNull();
  expect(container.firstChild.tagName).toBe(expectedTag);
  expect(container.firstChild.className).toBe(expectedClassName);
  return instance;
}

// Classes need to be declared at the top level scope, so we declare all the
// classes that will be used by the tests below, instead of inlining them.
// TODO: Consider redesigning this using modules so that we can use non-unique
// names of classes and bundle them with the test code.

// it preserves the name of the class for use in error messages
// it throws if no render function is defined
class Empty extends React.Component { }

// it renders a simple stateless component with prop
class SimpleStateless extends React.Component {
  props : any;
  render() {
    return React.createElement(Inner, {name: this.props.bar});
  }
}

// it renders based on state using initial values in this.props
class InitialState extends React.Component {
  state = {
    bar: this.props.initialValue
  };
  render() {
    return React.createElement('span', {className: this.state.bar});
  }
}

// it renders based on state using props in the constructor
class StateBasedOnProps extends React.Component {
  constructor(props) {
    super(props);
    this.state = { bar: props.initialValue };
  }
  changeState() {
    this.setState({ bar: 'bar' });
  }
  render() {
    if (this.state.bar === 'foo') {
      return React.createElement('div', {className: 'foo'});
    }
    return React.createElement('span', {className: this.state.bar});
  }
}

// it renders based on context in the constructor
class StateBasedOnContext extends React.Component {
  static contextTypes = {
    tag: PropTypes.string,
    className: PropTypes.string
  };
  state = {
    tag: this.context.tag,
    className: this.context.className
  };
  render() {
    const Tag = this.state.tag;
    return React.createElement(Tag, {className: this.state.className});
  }
}

class ProvideChildContextTypes extends React.Component {
  static childContextTypes = {
    tag: PropTypes.string,
    className: PropTypes.string
  };
  getChildContext() {
    return { tag: 'span', className: 'foo' };
  }
  render() {
    return React.createElement(StateBasedOnContext);
  }
}

// it renders only once when setting state in componentWillMount
let renderCount = 0;
class RenderOnce extends React.Component {
  state = {
    bar: this.props.initialValue
  };
  componentWillMount() {
    this.setState({ bar: 'bar' });
  }
  render() {
    renderCount++;
    return React.createElement('span', {className: this.state.bar});
  }
}

// it should throw with non-object in the initial state property
class ArrayState extends React.Component {
  state = ['an array'];
  render() {
    return React.createElement('span');
  }
}
class StringState extends React.Component {
  state = 'a string';
  render() {
    return React.createElement('span');
  }
}
class NumberState extends React.Component {
  state = 1234;
  render() {
    return React.createElement('span');
  }
}

// it should render with null in the initial state property
class NullState extends React.Component {
  state = null;
  render() {
    return React.createElement('span');
  }
}

// it setState through an event handler
class BoundEventHandler extends React.Component {
  state = {
    bar: this.props.initialValue
  };
  handleClick = () => {
    this.setState({ bar: 'bar' });
  };
  render() {
    return (
      React.createElement(Inner, {
        name: this.state.bar,
        onClick: this.handleClick
      })
    );
  }
}

// it should not implicitly bind event handlers
class UnboundEventHandler extends React.Component {
  state = {
    bar: this.props.initialValue
  };
  handleClick() {
    this.setState({ bar: 'bar' });
  }
  render() {
    return React.createElement(
      Inner, { name: this.state.bar, onClick: this.handleClick }
    );
  }
}

// it renders using forceUpdate even when there is no state
class ForceUpdateWithNoState extends React.Component {
  mutativeValue : string = this.props.initialValue;
  handleClick() {
    this.mutativeValue = 'bar';
    this.forceUpdate();
  }
  render() {
    return (
      React.createElement(Inner, {
        name: this.mutativeValue,
        onClick: this.handleClick.bind(this)}
      )
    );
  }
}

// it will call all the normal life cycle methods
let lifeCycles = [];
class NormalLifeCycles extends React.Component {
  props : any;
  state = {};
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
    return React.createElement('span', {className: this.props.value});
  }
}

// warns when classic properties are defined on the instance,
// but does not invoke them.
let getInitialStateWasCalled = false;
let getDefaultPropsWasCalled = false;
class ClassicProperties extends React.Component {
  contextTypes = {};
  propTypes = {};
  getDefaultProps() {
    getDefaultPropsWasCalled = true;
    return {};
  }
  getInitialState() {
    getInitialStateWasCalled = true;
    return {};
  }
  render() {
    return React.createElement('span', {className: 'foo'});
  }
}

// it should warn when misspelling shouldComponentUpdate
class MisspelledComponent1 extends React.Component {
  componentShouldUpdate() {
    return false;
  }
  render() {
    return React.createElement('span', {className: 'foo'});
  }
}

// it should warn when misspelling componentWillReceiveProps
class MisspelledComponent2 extends React.Component {
  componentWillRecieveProps() {
    return false;
  }
  render() {
    return React.createElement('span', {className: 'foo'});
  }
}

// it supports this.context passed via getChildContext
class ReadContext extends React.Component {
  static contextTypes = { bar: PropTypes.string };
  render() {
    return React.createElement('div', { className: this.context.bar });
  }
}
class ProvideContext extends React.Component {
  static childContextTypes = { bar: PropTypes.string };
  getChildContext() {
    return { bar: 'bar-through-context' };
  }
  render() {
    return React.createElement(ReadContext);
  }
}

// it supports classic refs
class ClassicRefs extends React.Component {
  render() {
    return React.createElement(Inner, {name: 'foo', ref: 'inner'});
  }
}

// Describe the actual test cases.

describe('ReactTypeScriptClass', function() {

  beforeEach(function() {
    container = document.createElement('div');
    attachedListener = null;
    renderedName = null;
  });

  it('preserves the name of the class for use in error messages', function() {
    expect(Empty.name).toBe('Empty');
  });

  it('throws if no render function is defined', function() {
    spyOnDev(console, 'error');

    expect(() => ReactDOM.render(React.createElement(Empty), container)).toThrow();

    if (__DEV__) {
      expect((<any>console.error).calls.count()).toBe(1);
      expect((<any>console.error).calls.argsFor(0)[0]).toBe(
        'Warning: Empty(...): No `render` method found on the returned ' +
        'component instance: you may have forgotten to define `render`.'
      );
    }
  });

  it('renders a simple stateless component with prop', function() {
    test(React.createElement(SimpleStateless, {bar: 'foo'}), 'DIV', 'foo');
    test(React.createElement(SimpleStateless, {bar: 'bar'}), 'DIV', 'bar');
  });

  it('renders based on state using initial values in this.props', function() {
    test(
      React.createElement(InitialState, {initialValue: 'foo'}),
      'SPAN',
      'foo'
    );
  });

  it('renders based on state using props in the constructor', function() {
    const instance = test(
      React.createElement(StateBasedOnProps, {initialValue: 'foo'}),
      'DIV',
      'foo'
    );
    instance.changeState();
    test(React.createElement(StateBasedOnProps), 'SPAN', 'bar');
  });

  it('renders based on context in the constructor', function() {
    test(React.createElement(ProvideChildContextTypes), 'SPAN', 'foo');
  });

  it('renders only once when setting state in componentWillMount', function() {
    renderCount = 0;
    test(React.createElement(RenderOnce, {initialValue: 'foo'}), 'SPAN', 'bar');
    expect(renderCount).toBe(1);
  });

  it('should warn with non-object in the initial state property', function() {
    spyOnDev(console, 'error');
    test(React.createElement(ArrayState), 'SPAN', '');
    if (__DEV__) {
      expect((<any>console.error).calls.count()).toBe(1);
      expect((<any>console.error).calls.argsFor(0)[0]).toContain(
        'ArrayState.state: must be set to an object or null'
      );
      (<any>console.error).calls.reset()
    }
    test(React.createElement(StringState), 'SPAN', '');
    if (__DEV__) {
      expect((<any>console.error).calls.count()).toBe(1);
      expect((<any>console.error).calls.argsFor(0)[0]).toContain(
        'StringState.state: must be set to an object or null'
      );
      (<any>console.error).calls.reset()
    }
    test(React.createElement(NumberState), 'SPAN', '');
    if (__DEV__) {
      expect((<any>console.error).calls.count()).toBe(1);
      expect((<any>console.error).calls.argsFor(0)[0]).toContain(
        'NumberState.state: must be set to an object or null'
      );
      (<any>console.error).calls.reset()
    }
  });

  it('should render with null in the initial state property', function() {
    test(React.createElement(NullState), 'SPAN', '');
  });

  it('setState through an event handler', function() {
    test(
      React.createElement(BoundEventHandler, {initialValue: 'foo'}),
      'DIV',
      'foo'
    );
    attachedListener();
    expect(renderedName).toBe('bar');
  });

  it('should not implicitly bind event handlers', function() {
    test(
      React.createElement(UnboundEventHandler, {initialValue: 'foo'}),
      'DIV',
      'foo'
    );
    expect(attachedListener).toThrow();
  });

  it('renders using forceUpdate even when there is no state', function() {
    test(
      React.createElement(ForceUpdateWithNoState, {initialValue: 'foo'}),
      'DIV',
      'foo'
    );
    attachedListener();
    expect(renderedName).toBe('bar');
  });

  it('will call all the normal life cycle methods', function() {
    lifeCycles = [];
    test(React.createElement(NormalLifeCycles, {value: 'foo'}), 'SPAN', 'foo');
    expect(lifeCycles).toEqual([
      'will-mount',
      'did-mount'
    ]);
    lifeCycles = []; // reset
    test(React.createElement(NormalLifeCycles, {value: 'bar'}), 'SPAN', 'bar');
    expect(lifeCycles).toEqual([
      'receive-props', { value: 'bar' },
      'should-update', { value: 'bar' }, {},
      'will-update', { value: 'bar' }, {},
      'did-update', { value: 'foo' }, {}
    ]);
    lifeCycles = []; // reset
    ReactDOM.unmountComponentAtNode(container);
    expect(lifeCycles).toEqual([
      'will-unmount'
    ]);
  });

  it('warns when classic properties are defined on the instance, ' +
     'but does not invoke them.', function() {
    spyOnDev(console, 'error');
    getInitialStateWasCalled = false;
    getDefaultPropsWasCalled = false;
    test(React.createElement(ClassicProperties), 'SPAN', 'foo');
    expect(getInitialStateWasCalled).toBe(false);
    expect(getDefaultPropsWasCalled).toBe(false);

    if (__DEV__) {
      expect((<any>console.error).calls.count()).toBe(4);
      expect((<any>console.error).calls.argsFor(0)[0]).toContain(
        'getInitialState was defined on ClassicProperties, ' +
        'a plain JavaScript class.'
      );
      expect((<any>console.error).calls.argsFor(1)[0]).toContain(
        'getDefaultProps was defined on ClassicProperties, ' +
        'a plain JavaScript class.'
      );
      expect((<any>console.error).calls.argsFor(2)[0]).toContain(
        'propTypes was defined as an instance property on ClassicProperties.'
      );
      expect((<any>console.error).calls.argsFor(3)[0]).toContain(
        'contextTypes was defined as an instance property on ClassicProperties.'
      );
    }
  });

  it('does not warn about getInitialState() on class components ' +
     'if state is also defined.', () => {
    spyOnDev(console, 'error');

    class Example extends React.Component {
      state = {};
      getInitialState() {
        return {};
      }
      render() {
        return React.createElement('span', {className: 'foo'});
      }
    }

    test(React.createElement(Example), 'SPAN', 'foo');
    if (__DEV__) {
      expect((<any>console.error).calls.count()).toBe(0);
    }
  });

  it('should warn when misspelling shouldComponentUpdate', function() {
    spyOnDev(console, 'error');

    test(React.createElement(MisspelledComponent1), 'SPAN', 'foo');

    if (__DEV__) {
      expect((<any>console.error).calls.count()).toBe(1);
      expect((<any>console.error).calls.argsFor(0)[0]).toBe(
        'Warning: ' +
        'MisspelledComponent1 has a method called componentShouldUpdate(). Did ' +
        'you mean shouldComponentUpdate()? The name is phrased as a question ' +
        'because the function is expected to return a value.'
      );
    }
  });

  it('should warn when misspelling componentWillReceiveProps', function() {
    spyOnDev(console, 'error');

    test(React.createElement(MisspelledComponent2), 'SPAN', 'foo');

    if (__DEV__) {
      expect((<any>console.error).calls.count()).toBe(1);
      expect((<any>console.error).calls.argsFor(0)[0]).toBe(
        'Warning: ' +
        'MisspelledComponent2 has a method called componentWillRecieveProps(). ' +
        'Did you mean componentWillReceiveProps()?'
      );
    }
  });

  it('should throw AND warn when trying to access classic APIs', function() {
    spyOnDev(console, 'warn');
    const instance = test(
      React.createElement(Inner, {name: 'foo'}),
      'DIV','foo'
    );
    expect(() => instance.replaceState({})).toThrow();
    expect(() => instance.isMounted()).toThrow();
    if (__DEV__) {
      expect((<any>console.warn).calls.count()).toBe(2);
      expect((<any>console.warn).calls.argsFor(0)[0]).toContain(
        'replaceState(...) is deprecated in plain JavaScript React classes'
      );
      expect((<any>console.warn).calls.argsFor(1)[0]).toContain(
        'isMounted(...) is deprecated in plain JavaScript React classes'
      );
    }
  });

  it('supports this.context passed via getChildContext', function() {
    test(React.createElement(ProvideContext), 'DIV', 'bar-through-context');
  });

  it('supports classic refs', function() {
    const instance = test(React.createElement(ClassicRefs), 'DIV', 'foo');
    expect(instance.refs.inner.getName()).toBe('foo');
  });

  it('supports drilling through to the DOM using findDOMNode', function() {
    const instance = test(
      React.createElement(Inner, {name: 'foo'}),
      'DIV',
      'foo'
    );
    const node = ReactDOM.findDOMNode(instance);
    expect(node).toBe(container.firstChild);
  });

});
