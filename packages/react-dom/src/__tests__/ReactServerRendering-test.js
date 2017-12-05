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
let ReactCallReturn;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;
let PropTypes;

function normalizeCodeLocInfo(str) {
  return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
}

describe('ReactDOMServer', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactCallReturn = require('react-call-return');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    PropTypes = require('prop-types');
    ReactDOMServer = require('react-dom/server');
  });

  describe('renderToString', () => {
    it('should generate simple markup', () => {
      const response = ReactDOMServer.renderToString(<span>hello world</span>);
      expect(response).toMatch(
        new RegExp('<span data-reactroot=""' + '>hello world</span>'),
      );
    });

    it('should generate simple markup for self-closing tags', () => {
      const response = ReactDOMServer.renderToString(<img />);
      expect(response).toMatch(new RegExp('<img data-reactroot=""' + '/>'));
    });

    it('should generate comment markup for component returns null', () => {
      class NullComponent extends React.Component {
        render() {
          return null;
        }
      }

      const response = ReactDOMServer.renderToString(<NullComponent />);
      expect(response).toBe('');
    });

    // TODO: Test that listeners are not registered onto any document/container.

    it('should render composite components', () => {
      class Parent extends React.Component {
        render() {
          return (
            <div>
              <Child name="child" />
            </div>
          );
        }
      }

      class Child extends React.Component {
        render() {
          return <span>My name is {this.props.name}</span>;
        }
      }

      const response = ReactDOMServer.renderToString(<Parent />);
      expect(response).toMatch(
        new RegExp(
          '<div ' +
            'data-reactroot' +
            '=""' +
            '>' +
            '<span' +
            '>' +
            'My name is <!-- -->child' +
            '</span>' +
            '</div>',
        ),
      );
    });

    it('should only execute certain lifecycle methods', () => {
      function runTest() {
        const lifecycle = [];

        class TestComponent extends React.Component {
          constructor(props) {
            super(props);
            lifecycle.push('getInitialState');
            this.state = {name: 'TestComponent'};
          }

          componentWillMount() {
            lifecycle.push('componentWillMount');
          }

          componentDidMount() {
            lifecycle.push('componentDidMount');
          }

          render() {
            lifecycle.push('render');
            return <span>Component name: {this.state.name}</span>;
          }

          componentWillUpdate() {
            lifecycle.push('componentWillUpdate');
          }

          componentDidUpdate() {
            lifecycle.push('componentDidUpdate');
          }

          shouldComponentUpdate() {
            lifecycle.push('shouldComponentUpdate');
          }

          componentWillReceiveProps() {
            lifecycle.push('componentWillReceiveProps');
          }

          componentWillUnmount() {
            lifecycle.push('componentWillUnmount');
          }
        }

        const response = ReactDOMServer.renderToString(<TestComponent />);

        expect(response).toMatch(
          new RegExp(
            '<span ' +
              'data-reactroot' +
              '=""' +
              '>' +
              'Component name: <!-- -->TestComponent' +
              '</span>',
          ),
        );
        expect(lifecycle).toEqual([
          'getInitialState',
          'componentWillMount',
          'render',
        ]);
      }

      runTest();
    });

    it('should have the correct mounting behavior (old hydrate API)', () => {
      spyOnDev(console, 'warn');
      spyOnDev(console, 'error');

      let mountCount = 0;
      let numClicks = 0;

      class TestComponent extends React.Component {
        componentDidMount() {
          mountCount++;
        }

        click = () => {
          numClicks++;
        };

        render() {
          return (
            <span ref="span" onClick={this.click}>
              Name: {this.props.name}
            </span>
          );
        }
      }

      const element = document.createElement('div');
      ReactDOM.render(<TestComponent />, element);

      let lastMarkup = element.innerHTML;

      // Exercise the update path. Markup should not change,
      // but some lifecycle methods should be run again.
      ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(1);

      // Unmount and remount. We should get another mount event and
      // we should get different markup, as the IDs are unique each time.
      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');
      ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(2);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Now kill the node and render it on top of server-rendered markup, as if
      // we used server rendering. We should mount again, but the markup should
      // be unchanged. We will append a sentinel at the end of innerHTML to be
      // sure that innerHTML was not changed.
      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');

      lastMarkup = ReactDOMServer.renderToString(<TestComponent name="x" />);
      element.innerHTML = lastMarkup;

      let instance = ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(3);
      if (__DEV__) {
        expect(console.warn.calls.count()).toBe(1);
        expect(console.warn.calls.argsFor(0)[0]).toContain(
          'render(): Calling ReactDOM.render() to hydrate server-rendered markup ' +
            'will stop working in React v17. Replace the ReactDOM.render() call ' +
            'with ReactDOM.hydrate() if you want React to attach to the server HTML.',
        );
        console.warn.calls.reset();
      }
      expect(element.innerHTML).toBe(lastMarkup);

      // Ensure the events system works after mount into server markup
      expect(numClicks).toEqual(0);
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance.refs.span));
      expect(numClicks).toEqual(1);

      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');

      // Now simulate a situation where the app is not idempotent. React should
      // warn but do the right thing.
      element.innerHTML = lastMarkup;
      instance = ReactDOM.render(<TestComponent name="y" />, element);
      expect(mountCount).toEqual(4);
      if (__DEV__) {
        expect(console.error.calls.count()).toBe(1);
        expect(console.error.calls.argsFor(0)[0]).toContain(
          'Text content did not match. Server: "x" Client: "y"',
        );
        console.error.calls.reset();
      }
      expect(element.innerHTML.length > 0).toBe(true);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Ensure the events system works after markup mismatch.
      expect(numClicks).toEqual(1);
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance.refs.span));
      expect(numClicks).toEqual(2);
      if (__DEV__) {
        expect(console.warn.calls.count()).toBe(0);
        expect(console.error.calls.count()).toBe(0);
      }
    });

    it('should have the correct mounting behavior (new hydrate API)', () => {
      spyOnDev(console, 'error');

      let mountCount = 0;
      let numClicks = 0;

      class TestComponent extends React.Component {
        componentDidMount() {
          mountCount++;
        }

        click = () => {
          numClicks++;
        };

        render() {
          return (
            <span ref="span" onClick={this.click}>
              Name: {this.props.name}
            </span>
          );
        }
      }

      const element = document.createElement('div');
      ReactDOM.render(<TestComponent />, element);

      let lastMarkup = element.innerHTML;

      // Exercise the update path. Markup should not change,
      // but some lifecycle methods should be run again.
      ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(1);

      // Unmount and remount. We should get another mount event and
      // we should get different markup, as the IDs are unique each time.
      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');
      ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(2);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Now kill the node and render it on top of server-rendered markup, as if
      // we used server rendering. We should mount again, but the markup should
      // be unchanged. We will append a sentinel at the end of innerHTML to be
      // sure that innerHTML was not changed.
      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');

      lastMarkup = ReactDOMServer.renderToString(<TestComponent name="x" />);
      element.innerHTML = lastMarkup;

      let instance = ReactDOM.hydrate(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(3);
      expect(element.innerHTML).toBe(lastMarkup);

      // Ensure the events system works after mount into server markup
      expect(numClicks).toEqual(0);
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance.refs.span));
      expect(numClicks).toEqual(1);

      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');

      // Now simulate a situation where the app is not idempotent. React should
      // warn but do the right thing.
      element.innerHTML = lastMarkup;
      instance = ReactDOM.hydrate(<TestComponent name="y" />, element);
      expect(mountCount).toEqual(4);
      if (__DEV__) {
        expect(console.error.calls.count()).toBe(1);
      }
      expect(element.innerHTML.length > 0).toBe(true);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Ensure the events system works after markup mismatch.
      expect(numClicks).toEqual(1);
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance.refs.span));
      expect(numClicks).toEqual(2);
    });

    // We have a polyfill for autoFocus on the client, but we intentionally don't
    // want it to call focus() when hydrating because this can mess up existing
    // focus before the JS has loaded.
    it('should emit autofocus on the server but not focus() when hydrating', () => {
      const element = document.createElement('div');
      element.innerHTML = ReactDOMServer.renderToString(
        <input autoFocus={true} />,
      );
      expect(element.firstChild.autofocus).toBe(true);

      // It should not be called on mount.
      element.firstChild.focus = jest.fn();
      ReactDOM.hydrate(<input autoFocus={true} />, element);
      expect(element.firstChild.focus).not.toHaveBeenCalled();

      // Or during an update.
      ReactDOM.render(<input autoFocus={true} />, element);
      expect(element.firstChild.focus).not.toHaveBeenCalled();
    });

    it('should not focus on either server or client with autofocus={false}', () => {
      const element = document.createElement('div');
      element.innerHTML = ReactDOMServer.renderToString(
        <input autoFocus={false} />,
      );
      expect(element.firstChild.autofocus).toBe(false);

      element.firstChild.focus = jest.fn();
      ReactDOM.hydrate(<input autoFocus={false} />, element);
      expect(element.firstChild.focus).not.toHaveBeenCalled();

      ReactDOM.render(<input autoFocus={false} />, element);
      expect(element.firstChild.focus).not.toHaveBeenCalled();
    });

    it('should throw with silly args', () => {
      expect(
        ReactDOMServer.renderToString.bind(ReactDOMServer, {x: 123}),
      ).toThrowError(
        'Objects are not valid as a React child (found: object with keys {x})',
      );
    });

    it('should throw prop mapping error for an <iframe /> with invalid props', () => {
      let caughtErr;
      try {
        ReactDOMServer.renderToString(<iframe style="border:none;" />);
      } catch (err) {
        caughtErr = err;
      }
      expect(caughtErr).not.toBe(undefined);
      expect(normalizeCodeLocInfo(caughtErr.message)).toContain(
        'The `style` prop expects a mapping from style properties to values, not ' +
          "a string. For example, style={{marginRight: spacing + 'em'}} when using JSX." +
          (__DEV__ ? '\n    in iframe (at **)' : ''),
      );
    });
  });

  describe('renderToStaticMarkup', () => {
    it('should not put checksum and React ID on components', () => {
      class NestedComponent extends React.Component {
        render() {
          return <div>inner text</div>;
        }
      }

      class TestComponent extends React.Component {
        render() {
          return (
            <span>
              <NestedComponent />
            </span>
          );
        }
      }

      const response = ReactDOMServer.renderToStaticMarkup(<TestComponent />);

      expect(response).toBe('<span><div>inner text</div></span>');
    });

    it('should not put checksum and React ID on text components', () => {
      class TestComponent extends React.Component {
        render() {
          return (
            <span>
              {'hello'} {'world'}
            </span>
          );
        }
      }

      const response = ReactDOMServer.renderToStaticMarkup(<TestComponent />);

      expect(response).toBe('<span>hello world</span>');
    });

    it('should not use comments for empty nodes', () => {
      class TestComponent extends React.Component {
        render() {
          return null;
        }
      }

      const response = ReactDOMServer.renderToStaticMarkup(<TestComponent />);

      expect(response).toBe('');
    });

    it('should only execute certain lifecycle methods', () => {
      function runTest() {
        const lifecycle = [];

        class TestComponent extends React.Component {
          constructor(props) {
            super(props);
            lifecycle.push('getInitialState');
            this.state = {name: 'TestComponent'};
          }

          componentWillMount() {
            lifecycle.push('componentWillMount');
          }

          componentDidMount() {
            lifecycle.push('componentDidMount');
          }

          render() {
            lifecycle.push('render');
            return <span>Component name: {this.state.name}</span>;
          }

          componentWillUpdate() {
            lifecycle.push('componentWillUpdate');
          }

          componentDidUpdate() {
            lifecycle.push('componentDidUpdate');
          }

          shouldComponentUpdate() {
            lifecycle.push('shouldComponentUpdate');
          }

          componentWillReceiveProps() {
            lifecycle.push('componentWillReceiveProps');
          }

          componentWillUnmount() {
            lifecycle.push('componentWillUnmount');
          }
        }

        const response = ReactDOMServer.renderToStaticMarkup(<TestComponent />);

        expect(response).toBe('<span>Component name: TestComponent</span>');
        expect(lifecycle).toEqual([
          'getInitialState',
          'componentWillMount',
          'render',
        ]);
      }

      runTest();
    });

    it('should throw with silly args', () => {
      expect(
        ReactDOMServer.renderToStaticMarkup.bind(ReactDOMServer, {x: 123}),
      ).toThrowError(
        'Objects are not valid as a React child (found: object with keys {x})',
      );
    });

    it('allows setState in componentWillMount without using DOM', () => {
      class Component extends React.Component {
        componentWillMount() {
          this.setState({text: 'hello, world'});
        }

        render() {
          return <div>{this.state.text}</div>;
        }
      }
      const markup = ReactDOMServer.renderToString(<Component />);
      expect(markup).toContain('hello, world');
    });

    it('allows setState in componentWillMount with custom constructor', () => {
      class Component extends React.Component {
        constructor() {
          super();
          this.state = {text: 'default state'};
        }

        componentWillMount() {
          this.setState({text: 'hello, world'});
        }

        render() {
          return <div>{this.state.text}</div>;
        }
      }
      const markup = ReactDOMServer.renderToString(<Component />);
      expect(markup).toContain('hello, world');
    });

    it('renders with props when using custom constructor', () => {
      class Component extends React.Component {
        constructor() {
          super();
        }

        render() {
          return <div>{this.props.text}</div>;
        }
      }

      const markup = ReactDOMServer.renderToString(
        <Component text="hello, world" />,
      );
      expect(markup).toContain('hello, world');
    });

    it('renders with context when using custom constructor', () => {
      class Component extends React.Component {
        constructor() {
          super();
        }

        render() {
          return <div>{this.context.text}</div>;
        }
      }

      Component.contextTypes = {
        text: PropTypes.string.isRequired,
      };

      class ContextProvider extends React.Component {
        getChildContext() {
          return {
            text: 'hello, world',
          };
        }

        render() {
          return this.props.children;
        }
      }

      ContextProvider.childContextTypes = {
        text: PropTypes.string,
      };

      const markup = ReactDOMServer.renderToString(
        <ContextProvider>
          <Component />
        </ContextProvider>,
      );
      expect(markup).toContain('hello, world');
    });

    it('renders components with different batching strategies', () => {
      class StaticComponent extends React.Component {
        render() {
          const staticContent = ReactDOMServer.renderToStaticMarkup(
            <div>
              <img src="foo-bar.jpg" />
            </div>,
          );
          return <div dangerouslySetInnerHTML={{__html: staticContent}} />;
        }
      }

      class Component extends React.Component {
        componentWillMount() {
          this.setState({text: 'hello, world'});
        }

        render() {
          return <div>{this.state.text}</div>;
        }
      }

      expect(
        ReactDOMServer.renderToString.bind(
          ReactDOMServer,
          <div>
            <StaticComponent />
            <Component />
          </div>,
        ),
      ).not.toThrow();
    });
  });

  it('warns with a no-op when an async setState is triggered', () => {
    class Foo extends React.Component {
      componentWillMount() {
        this.setState({text: 'hello'});
        setTimeout(() => {
          this.setState({text: 'error'});
        });
      }
      render() {
        return <div onClick={() => {}}>{this.state.text}</div>;
      }
    }

    spyOnDev(console, 'error');
    ReactDOMServer.renderToString(<Foo />);
    jest.runOnlyPendingTimers();
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.mostRecent().args[0]).toBe(
        'Warning: setState(...): Can only update a mounting component.' +
          ' This usually means you called setState() outside componentWillMount() on the server.' +
          ' This is a no-op.\n\nPlease check the code for the Foo component.',
      );
    }

    const markup = ReactDOMServer.renderToStaticMarkup(<Foo />);
    expect(markup).toBe('<div>hello</div>');
    jest.runOnlyPendingTimers();
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
    }
  });

  it('warns with a no-op when an async forceUpdate is triggered', () => {
    class Baz extends React.Component {
      componentWillMount() {
        this.forceUpdate();
        setTimeout(() => {
          this.forceUpdate();
        });
      }

      render() {
        return <div onClick={() => {}} />;
      }
    }

    spyOnDev(console, 'error');
    ReactDOMServer.renderToString(<Baz />);
    jest.runOnlyPendingTimers();
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.mostRecent().args[0]).toBe(
        'Warning: forceUpdate(...): Can only update a mounting component. ' +
          'This usually means you called forceUpdate() outside componentWillMount() on the server. ' +
          'This is a no-op.\n\nPlease check the code for the Baz component.',
      );
    }
    const markup = ReactDOMServer.renderToStaticMarkup(<Baz />);
    expect(markup).toBe('<div></div>');
  });

  it('should throw (in dev) when children are mutated during render', () => {
    spyOnDev(console, 'error');
    function Wrapper(props) {
      props.children[1] = <p key={1} />; // Mutation is illegal
      return <div>{props.children}</div>;
    }
    if (__DEV__) {
      expect(() => {
        ReactDOMServer.renderToStaticMarkup(
          <Wrapper>
            <span key={0} />
            <span key={1} />
            <span key={2} />
          </Wrapper>,
        );
      }).toThrowError(/Cannot assign to read only property.*/);
    } else {
      expect(
        ReactDOMServer.renderToStaticMarkup(
          <Wrapper>
            <span key={0} />
            <span key={1} />
            <span key={2} />
          </Wrapper>,
        ),
      ).toContain('<p>');
    }
  });

  it('warns about lowercase html but not in svg tags', () => {
    spyOnDev(console, 'error');
    function CompositeG(props) {
      // Make sure namespace passes through composites
      return <g>{props.children}</g>;
    }
    ReactDOMServer.renderToStaticMarkup(
      <div>
        <inPUT />
        <svg>
          <CompositeG>
            <linearGradient />
            <foreignObject>
              {/* back to HTML */}
              <iFrame />
            </foreignObject>
          </CompositeG>
        </svg>
      </div>,
    );
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(2);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: <inPUT /> is using uppercase HTML. Always use lowercase ' +
          'HTML tags in React.',
      );
      // linearGradient doesn't warn
      expect(console.error.calls.argsFor(1)[0]).toBe(
        'Warning: <iFrame /> is using uppercase HTML. Always use lowercase ' +
          'HTML tags in React.',
      );
    }
  });

  it('should warn about contentEditable and children', () => {
    spyOnDev(console, 'error');
    ReactDOMServer.renderToString(<div contentEditable={true} children="" />);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: A component is `contentEditable` and contains `children` ' +
          'managed by React. It is now your responsibility to guarantee that ' +
          'none of those nodes are unexpectedly modified or duplicated. This ' +
          'is probably not intentional.\n    in div (at **)',
      );
    }
  });

  it('should throw rendering portals on the server', () => {
    const div = document.createElement('div');
    expect(() => {
      ReactDOMServer.renderToString(
        <div>{ReactDOM.createPortal(<div />, div)}</div>,
      );
    }).toThrow(
      'Portals are not currently supported by the server renderer. ' +
        'Render them conditionally so that they only appear on the client render.',
    );
  });

  it('should throw rendering call/return on the server', () => {
    const div = document.createElement('div');
    expect(() => {
      ReactDOMServer.renderToString(
        <div>{ReactCallReturn.unstable_createReturn(42)}</div>,
      );
    }).toThrow(
      'The experimental Call and Return types are not currently supported by the server renderer.',
    );
    expect(() => {
      ReactDOMServer.renderToString(
        <div>
          {ReactCallReturn.unstable_createCall(null, function() {}, {})}
        </div>,
      );
    }).toThrow(
      'The experimental Call and Return types are not currently supported by the server renderer.',
    );
  });
});
