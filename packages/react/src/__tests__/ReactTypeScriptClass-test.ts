/// <reference path="./testDefinitions/PropTypes.d.ts" />
/// <reference path="./testDefinitions/React.d.ts" />
/// <reference path="./testDefinitions/ReactDOM.d.ts" />
/// <reference path="./testDefinitions/ReactDOMClient.d.ts" />
/// <reference path="./testDefinitions/ReactInternalAct.d.ts" />

/*!
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React = require('react');
import ReactDOM = require('react-dom');
import ReactDOMClient = require('react-dom/client');
import PropTypes = require('prop-types');
import ReactFeatureFlags = require('shared/ReactFeatureFlags');

// Before Each

let container;
let root;
let attachedListener = null;
let renderedName = null;

class Inner extends React.Component {
  getName() {
    return this.props.name;
  }
  render() {
    attachedListener = this.props.onClick;
    renderedName = this.props.name;
    return React.createElement('div', {className: this.props.name});
  }
}

function test(element, expectedTag, expectedClassName) {
  ReactDOM.flushSync(() => root.render(element));
  expect(container.firstChild).not.toBeNull();
  expect(container.firstChild.tagName).toBe(expectedTag);
  expect(container.firstChild.className).toBe(expectedClassName);
}

// Classes need to be declared at the top level scope, so we declare all the
// classes that will be used by the tests below, instead of inlining them.
// TODO: Consider redesigning this using modules so that we can use non-unique
// names of classes and bundle them with the test code.

// it preserves the name of the class for use in error messages
// it throws if no render function is defined
class Empty extends React.Component {}

// it renders a simple stateless component with prop
class SimpleStateless extends React.Component {
  props: any;
  render() {
    return React.createElement(Inner, {name: this.props.bar});
  }
}

// it renders based on state using initial values in this.props
class InitialState extends React.Component {
  state = {
    bar: this.props.initialValue,
  };
  render() {
    return React.createElement('span', {className: this.state.bar});
  }
}

// it renders based on state using props in the constructor
class StateBasedOnProps extends React.Component {
  constructor(props) {
    super(props);
    this.state = {bar: props.initialValue};
  }
  changeState() {
    this.setState({bar: 'bar'});
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
    className: PropTypes.string,
  };
  state = {
    tag: this.context.tag,
    className: this.context.className,
  };
  render() {
    const Tag = this.state.tag;
    return React.createElement(Tag, {className: this.state.className});
  }
}

class ProvideChildContextTypes extends React.Component {
  static childContextTypes = {
    tag: PropTypes.string,
    className: PropTypes.string,
  };
  getChildContext() {
    return {tag: 'span', className: 'foo'};
  }
  render() {
    return React.createElement(StateBasedOnContext);
  }
}

// it renders only once when setting state in componentWillMount
let renderCount = 0;
class RenderOnce extends React.Component {
  state = {
    bar: this.props.initialValue,
  };
  UNSAFE_componentWillMount() {
    this.setState({bar: 'bar'});
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
    bar: this.props.initialValue,
  };
  handleClick = () => {
    this.setState({bar: 'bar'});
  };
  render() {
    return React.createElement(Inner, {
      name: this.state.bar,
      onClick: this.handleClick,
    });
  }
}

// it should not implicitly bind event handlers
class UnboundEventHandler extends React.Component {
  state = {
    bar: this.props.initialValue,
  };
  handleClick() {
    this.setState({bar: 'bar'});
  }
  render() {
    return React.createElement(Inner, {
      name: this.state.bar,
      onClick: this.handleClick,
    });
  }
}

// it renders using forceUpdate even when there is no state
class ForceUpdateWithNoState extends React.Component {
  mutativeValue: string = this.props.initialValue;
  handleClick() {
    this.mutativeValue = 'bar';
    this.forceUpdate();
  }
  render() {
    return React.createElement(Inner, {
      name: this.mutativeValue,
      onClick: this.handleClick.bind(this),
    });
  }
}

// it will call all the normal life cycle methods
let lifeCycles = [];
class NormalLifeCycles extends React.Component {
  props: any;
  state = {};
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
    return React.createElement('span', {className: this.props.value});
  }
}

// warns when classic properties are defined on the instance,
// but does not invoke them.
let getInitialStateWasCalled = false;
let getDefaultPropsWasCalled = false;
class ClassicProperties extends React.Component {
  contextTypes = {};
  contextType = {};
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

// it should warn when misspelling UNSAFE_componentWillReceiveProps
class MisspelledComponent3 extends React.Component {
  UNSAFE_componentWillRecieveProps() {
    return false;
  }
  render() {
    return React.createElement('span', {className: 'foo'});
  }
}

// it supports this.context passed via getChildContext
class ReadContext extends React.Component {
  static contextTypes = {bar: PropTypes.string};
  render() {
    return React.createElement('div', {className: this.context.bar});
  }
}
class ProvideContext extends React.Component {
  static childContextTypes = {bar: PropTypes.string};
  getChildContext() {
    return {bar: 'bar-through-context'};
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
    root = ReactDOMClient.createRoot(container);
    attachedListener = null;
    renderedName = null;
  });

  it('preserves the name of the class for use in error messages', function() {
    expect(Empty.name).toBe('Empty');
  });

  it('throws if no render function is defined', function() {
    class Foo extends React.Component {}
    const caughtErrors = [];
    function errorHandler(event) {
      event.preventDefault();
      caughtErrors.push(event.error);
    }
    window.addEventListener('error', errorHandler);
    try {
      expect(() => {
        ReactDOM.flushSync(() => root.render(React.createElement(Empty)))
      }).toErrorDev([
        // A failed component renders twice in DEV in concurrent mode
        'No `render` method found on the Empty instance: ' +
          'you may have forgotten to define `render`.',
        'No `render` method found on the Empty instance: ' +
          'you may have forgotten to define `render`.',
      ]);
    } finally {
      window.removeEventListener('error', errorHandler);
    }
    expect(caughtErrors.length).toBe(1);
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
    const ref = React.createRef();
    test(
      React.createElement(StateBasedOnProps, {initialValue: 'foo', ref: ref}),
      'DIV',
      'foo'
    );
    ReactDOM.flushSync(() => ref.current.changeState());
    test(React.createElement(StateBasedOnProps), 'SPAN', 'bar');
  });

  it('sets initial state with value returned by static getDerivedStateFromProps', function() {
    class Foo extends React.Component {
      state = {
        foo: null,
        bar: null,
      };
      static getDerivedStateFromProps(nextProps, prevState) {
        return {
          foo: nextProps.foo,
          bar: 'bar',
        };
      }
      render() {
        return React.createElement('div', {
          className: `${this.state.foo} ${this.state.bar}`,
        });
      }
    }
    test(React.createElement(Foo, {foo: 'foo'}), 'DIV', 'foo bar');
  });

  it('warns if getDerivedStateFromProps is not static', function() {
    class Foo extends React.Component {
      getDerivedStateFromProps() {
        return {};
      }
      render() {
        return React.createElement('div', {});
      }
    }
    expect(function() {
      ReactDOM.flushSync(() =>
        root.render(React.createElement(Foo, {foo: 'foo'}))
      );
    }).toErrorDev(
      'Foo: getDerivedStateFromProps() is defined as an instance method ' +
        'and will be ignored. Instead, declare it as a static method.'
    );
  });

  it('warns if getDerivedStateFromError is not static', function() {
    class Foo extends React.Component {
      getDerivedStateFromError() {
        return {};
      }
      render() {
        return React.createElement('div');
      }
    }
    expect(function() {
      ReactDOM.flushSync(() =>
        root.render(React.createElement(Foo, {foo: 'foo'}))
      );
    }).toErrorDev(
      'Foo: getDerivedStateFromError() is defined as an instance method ' +
        'and will be ignored. Instead, declare it as a static method.'
    );
  });

  it('warns if getSnapshotBeforeUpdate is static', function() {
    class Foo extends React.Component {
      static getSnapshotBeforeUpdate() {}
      render() {
        return React.createElement('div', {});
      }
    }
    expect(function() {
      ReactDOM.flushSync(() =>
        root.render(React.createElement(Foo, {foo: 'foo'}))
      );
    }).toErrorDev(
      'Foo: getSnapshotBeforeUpdate() is defined as a static method ' +
        'and will be ignored. Instead, declare it as an instance method.'
    );
  });

  it('warns if state not initialized before static getDerivedStateFromProps', function() {
    class Foo extends React.Component {
      static getDerivedStateFromProps(nextProps, prevState) {
        return {
          foo: nextProps.foo,
          bar: 'bar',
        };
      }
      render() {
        return React.createElement('div', {
          className: `${this.state.foo} ${this.state.bar}`,
        });
      }
    }
    expect(function() {
      ReactDOM.flushSync(() =>
        root.render(React.createElement(Foo, {foo: 'foo'}))
      );
    }).toErrorDev(
      '`Foo` uses `getDerivedStateFromProps` but its initial state is ' +
        'undefined. This is not recommended. Instead, define the initial state by ' +
        'assigning an object to `this.state` in the constructor of `Foo`. ' +
        'This ensures that `getDerivedStateFromProps` arguments have a consistent shape.'
    );
  });

  it('updates initial state with values returned by static getDerivedStateFromProps', function() {
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
        return React.createElement('div', {
          className: `${this.state.foo} ${this.state.bar}`,
        });
      }
    }
    test(React.createElement(Foo), 'DIV', 'not-foo bar');
  });

  it('renders updated state with values returned by static getDerivedStateFromProps', function() {
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
        return React.createElement('div', {className: this.state.value});
      }
    }
    test(React.createElement(Foo, {update: false}), 'DIV', 'initial');
    test(React.createElement(Foo, {update: true}), 'DIV', 'updated');
  });

  if (!ReactFeatureFlags.disableLegacyContext) {
    it('renders based on context in the constructor', function() {
      expect(() => test(React.createElement(ProvideChildContextTypes), 'SPAN', 'foo')).toErrorDev([
        'ProvideChildContextTypes uses the legacy childContextTypes API which will soon be removed. Use React.createContext() instead.',
        'StateBasedOnContext uses the legacy contextTypes API which will soon be removed. Use React.createContext() with static contextType instead.'
      ]);
    });
  }

  it('renders only once when setting state in componentWillMount', function() {
    renderCount = 0;
    test(React.createElement(RenderOnce, {initialValue: 'foo'}), 'SPAN', 'bar');
    expect(renderCount).toBe(1);
  });

  it('should warn with non-object in the initial state property', function() {
    expect(() => test(React.createElement(ArrayState), 'SPAN', '')).toErrorDev(
      'ArrayState.state: must be set to an object or null'
    );
    expect(() => test(React.createElement(StringState), 'SPAN', '')).toErrorDev(
      'StringState.state: must be set to an object or null'
    );
    expect(() => test(React.createElement(NumberState), 'SPAN', '')).toErrorDev(
      'NumberState.state: must be set to an object or null'
    );
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
    ReactDOM.flushSync(() => attachedListener());
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
    ReactDOM.flushSync(() => attachedListener());
    expect(renderedName).toBe('bar');
  });

  it('will call all the normal life cycle methods', function() {
    lifeCycles = [];
    test(React.createElement(NormalLifeCycles, {value: 'foo'}), 'SPAN', 'foo');
    expect(lifeCycles).toEqual(['will-mount', 'did-mount']);
    lifeCycles = []; // reset
    test(React.createElement(NormalLifeCycles, {value: 'bar'}), 'SPAN', 'bar');
    expect(lifeCycles).toEqual([
      'receive-props',
      {value: 'bar'},
      'should-update',
      {value: 'bar'},
      {},
      'will-update',
      {value: 'bar'},
      {},
      'did-update',
      {value: 'foo'},
      {},
    ]);
    lifeCycles = []; // reset
    ReactDOM.flushSync(() => root.unmount(container));
    expect(lifeCycles).toEqual(['will-unmount']);
  });

  if (!ReactFeatureFlags.disableLegacyContext) {
    it(
      'warns when classic properties are defined on the instance, ' +
        'but does not invoke them.',
      function() {
        getInitialStateWasCalled = false;
        getDefaultPropsWasCalled = false;
        expect(() =>
          test(React.createElement(ClassicProperties), 'SPAN', 'foo')
        ).toErrorDev([
          'getInitialState was defined on ClassicProperties, ' +
            'a plain JavaScript class.',
          'getDefaultProps was defined on ClassicProperties, ' +
            'a plain JavaScript class.',
          'contextTypes was defined as an instance property on ClassicProperties.',
          'contextType was defined as an instance property on ClassicProperties.',
        ]);
        expect(getInitialStateWasCalled).toBe(false);
        expect(getDefaultPropsWasCalled).toBe(false);
      }
    );
  }

  it(
    'does not warn about getInitialState() on class components ' +
      'if state is also defined.',
    () => {
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
    }
  );

  it('should warn when misspelling shouldComponentUpdate', function() {
    expect(() =>
      test(React.createElement(MisspelledComponent1), 'SPAN', 'foo')
    ).toErrorDev(
      '' +
        'MisspelledComponent1 has a method called componentShouldUpdate(). Did ' +
        'you mean shouldComponentUpdate()? The name is phrased as a question ' +
        'because the function is expected to return a value.'
    );
  });

  it('should warn when misspelling componentWillReceiveProps', function() {
    expect(() =>
      test(React.createElement(MisspelledComponent2), 'SPAN', 'foo')
    ).toErrorDev(
      '' +
        'MisspelledComponent2 has a method called componentWillRecieveProps(). ' +
        'Did you mean componentWillReceiveProps()?'
    );
  });

  it('should warn when misspelling UNSAFE_componentWillReceiveProps', function() {
    expect(() =>
      test(React.createElement(MisspelledComponent3), 'SPAN', 'foo')
    ).toErrorDev(
      '' +
        'MisspelledComponent3 has a method called UNSAFE_componentWillRecieveProps(). ' +
        'Did you mean UNSAFE_componentWillReceiveProps()?'
    );
  });

  it('should throw AND warn when trying to access classic APIs', function() {
    const ref = React.createRef();
    test(React.createElement(Inner, {name: 'foo', ref: ref}), 'DIV', 'foo');
    expect(() =>
      expect(() => ref.current.replaceState({})).toThrow()
    ).toWarnDev(
      'replaceState(...) is deprecated in plain JavaScript React classes',
      {withoutStack: true}
    );
    expect(() =>
      expect(() => ref.current.isMounted()).toThrow()
    ).toWarnDev(
      'isMounted(...) is deprecated in plain JavaScript React classes',
      {withoutStack: true}
    );
  });

  if (!ReactFeatureFlags.disableLegacyContext) {
    it('supports this.context passed via getChildContext', () => {
      expect(() => test(React.createElement(ProvideContext), 'DIV', 'bar-through-context')).toErrorDev([
        'ProvideContext uses the legacy childContextTypes API which will soon be removed. Use React.createContext() instead.',
        'ReadContext uses the legacy contextTypes API which will soon be removed. Use React.createContext() with static contextType instead.',
]      );
    });
  }

  if (!ReactFeatureFlags.disableStringRefs) {
    it('supports string refs', function() {
      const ref = React.createRef();
      expect(() => {
        test(React.createElement(ClassicRefs, {ref: ref}), 'DIV', 'foo');
      }).toErrorDev([
        'Component "ClassicRefs" contains the string ref "inner". ' +
          'Support for string refs will be removed in a future major release. ' +
          'We recommend using useRef() or createRef() instead. ' +
          'Learn more about using refs safely here: https://react.dev/link/strict-mode-string-ref\n' +
          '    in Inner (at **)',
      ]);
      expect(ref.current.refs.inner.getName()).toBe('foo');
    });
  }
});
