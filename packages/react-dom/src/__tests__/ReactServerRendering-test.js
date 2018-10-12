/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactDOMServer;
let PropTypes;

function normalizeCodeLocInfo(str) {
  return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
}

describe('ReactDOMServer', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
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

          UNSAFE_componentWillMount() {
            lifecycle.push('componentWillMount');
          }

          componentDidMount() {
            lifecycle.push('componentDidMount');
          }

          render() {
            lifecycle.push('render');
            return <span>Component name: {this.state.name}</span>;
          }

          UNSAFE_componentWillUpdate() {
            lifecycle.push('componentWillUpdate');
          }

          componentDidUpdate() {
            lifecycle.push('componentDidUpdate');
          }

          shouldComponentUpdate() {
            lifecycle.push('shouldComponentUpdate');
          }

          UNSAFE_componentWillReceiveProps() {
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

    it('should not crash on poisoned hasOwnProperty', () => {
      let html;
      expect(
        () =>
          (html = ReactDOMServer.renderToString(
            <div hasOwnProperty="poison">
              <span unknown="test" />
            </div>,
          )),
      ).toWarnDev(['React does not recognize the `hasOwnProperty` prop']);
      expect(html).toContain('<span unknown="test">');
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

          UNSAFE_componentWillMount() {
            lifecycle.push('componentWillMount');
          }

          componentDidMount() {
            lifecycle.push('componentDidMount');
          }

          render() {
            lifecycle.push('render');
            return <span>Component name: {this.state.name}</span>;
          }

          UNSAFE_componentWillUpdate() {
            lifecycle.push('componentWillUpdate');
          }

          componentDidUpdate() {
            lifecycle.push('componentDidUpdate');
          }

          shouldComponentUpdate() {
            lifecycle.push('shouldComponentUpdate');
          }

          UNSAFE_componentWillReceiveProps() {
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
        UNSAFE_componentWillMount() {
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

        UNSAFE_componentWillMount() {
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

    it('renders with new context API', () => {
      const Context = React.createContext(0);

      function Consumer(props) {
        return (
          <Context.Consumer>{value => 'Result: ' + value}</Context.Consumer>
        );
      }

      const Indirection = React.Fragment;

      function App(props) {
        return (
          <Context.Provider value={props.value}>
            <Context.Provider value={2}>
              <Consumer />
            </Context.Provider>
            <Indirection>
              <Indirection>
                <Consumer />
                <Context.Provider value={3}>
                  <Consumer />
                </Context.Provider>
              </Indirection>
            </Indirection>
            <Consumer />
          </Context.Provider>
        );
      }

      const markup = ReactDOMServer.renderToString(<App value={1} />);
      // Extract the numbers rendered by the consumers
      const results = markup.match(/\d+/g).map(Number);
      expect(results).toEqual([2, 1, 3, 1]);
    });

    it('renders context API, reentrancy', () => {
      const Context = React.createContext(0);

      function Consumer(props) {
        return (
          <Context.Consumer>{value => 'Result: ' + value}</Context.Consumer>
        );
      }

      let reentrantMarkup;
      function Reentrant() {
        reentrantMarkup = ReactDOMServer.renderToString(
          <App value={1} reentrant={false} />,
        );
        return null;
      }

      const Indirection = React.Fragment;

      function App(props) {
        return (
          <Context.Provider value={props.value}>
            {props.reentrant && <Reentrant />}
            <Context.Provider value={2}>
              <Consumer />
            </Context.Provider>
            <Indirection>
              <Indirection>
                <Consumer />
                <Context.Provider value={3}>
                  <Consumer />
                </Context.Provider>
              </Indirection>
            </Indirection>
            <Consumer />
          </Context.Provider>
        );
      }

      const markup = ReactDOMServer.renderToString(
        <App value={1} reentrant={true} />,
      );
      // Extract the numbers rendered by the consumers
      const results = markup.match(/\d+/g).map(Number);
      const reentrantResults = reentrantMarkup.match(/\d+/g).map(Number);
      expect(results).toEqual([2, 1, 3, 1]);
      expect(reentrantResults).toEqual([2, 1, 3, 1]);
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
        UNSAFE_componentWillMount() {
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
      UNSAFE_componentWillMount() {
        this.setState({text: 'hello'});
        setTimeout(() => {
          this.setState({text: 'error'});
        });
      }
      render() {
        return <div onClick={() => {}}>{this.state.text}</div>;
      }
    }

    ReactDOMServer.renderToString(<Foo />);
    expect(() => jest.runOnlyPendingTimers()).toWarnDev(
      'Warning: setState(...): Can only update a mounting component.' +
        ' This usually means you called setState() outside componentWillMount() on the server.' +
        ' This is a no-op.\n\nPlease check the code for the Foo component.',
      {withoutStack: true},
    );

    const markup = ReactDOMServer.renderToStaticMarkup(<Foo />);
    expect(markup).toBe('<div>hello</div>');
    // No additional warnings are expected
    jest.runOnlyPendingTimers();
  });

  it('warns with a no-op when an async forceUpdate is triggered', () => {
    class Baz extends React.Component {
      UNSAFE_componentWillMount() {
        this.forceUpdate();
        setTimeout(() => {
          this.forceUpdate();
        });
      }

      render() {
        return <div onClick={() => {}} />;
      }
    }

    ReactDOMServer.renderToString(<Baz />);
    expect(() => jest.runOnlyPendingTimers()).toWarnDev(
      'Warning: forceUpdate(...): Can only update a mounting component. ' +
        'This usually means you called forceUpdate() outside componentWillMount() on the server. ' +
        'This is a no-op.\n\nPlease check the code for the Baz component.',
      {withoutStack: true},
    );
    const markup = ReactDOMServer.renderToStaticMarkup(<Baz />);
    expect(markup).toBe('<div></div>');
  });

  it('throws for unsupported types on the server', () => {
    expect(() => {
      ReactDOMServer.renderToString(<React.unstable_Suspense />);
    }).toThrow('ReactDOMServer does not yet support Suspense.');

    expect(() => {
      const LazyFoo = React.lazy(
        () =>
          new Promise(resolve =>
            resolve(function Foo() {
              return <div />;
            }),
          ),
      );
      ReactDOMServer.renderToString(<LazyFoo />);
    }).toThrow('ReactDOMServer does not yet support lazy-loaded components.');

    expect(() => {
      const FooPromise = {then() {}};
      ReactDOMServer.renderToString(<FooPromise />);
    }).toThrow('ReactDOMServer does not yet support lazy-loaded components.');
  });

  it('should throw (in dev) when children are mutated during render', () => {
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
    function CompositeG(props) {
      // Make sure namespace passes through composites
      return <g>{props.children}</g>;
    }
    expect(() =>
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
      ),
    ).toWarnDev([
      'Warning: <inPUT /> is using incorrect casing. ' +
        'Use PascalCase for React components, ' +
        'or lowercase for HTML elements.',
      // linearGradient doesn't warn
      'Warning: <iFrame /> is using incorrect casing. ' +
        'Use PascalCase for React components, ' +
        'or lowercase for HTML elements.',
    ]);
  });

  it('should warn about contentEditable and children', () => {
    expect(() =>
      ReactDOMServer.renderToString(<div contentEditable={true} children="" />),
    ).toWarnDev(
      'Warning: A component is `contentEditable` and contains `children` ' +
        'managed by React. It is now your responsibility to guarantee that ' +
        'none of those nodes are unexpectedly modified or duplicated. This ' +
        'is probably not intentional.\n    in div (at **)',
    );
  });

  it('should warn when server rendering a class with a render method that does not extend React.Component', () => {
    class ClassWithRenderNotExtended {
      render() {
        return <div />;
      }
    }

    expect(() => {
      expect(() =>
        ReactDOMServer.renderToString(<ClassWithRenderNotExtended />),
      ).toThrow(TypeError);
    }).toWarnDev(
      'Warning: The <ClassWithRenderNotExtended /> component appears to have a render method, ' +
        "but doesn't extend React.Component. This is likely to cause errors. " +
        'Change ClassWithRenderNotExtended to extend React.Component instead.',
      {withoutStack: true},
    );

    // Test deduplication
    expect(() => {
      ReactDOMServer.renderToString(<ClassWithRenderNotExtended />);
    }).toThrow(TypeError);
  });

  // We're just testing importing, not using it.
  // It is important because even isomorphic components may import it.
  it('can import react-dom in Node environment', () => {
    if (
      typeof requestAnimationFrame !== 'undefined' ||
      global.hasOwnProperty('requestAnimationFrame') ||
      typeof requestIdleCallback !== 'undefined' ||
      global.hasOwnProperty('requestIdleCallback') ||
      typeof window !== 'undefined' ||
      global.hasOwnProperty('window')
    ) {
      // Don't remove this. This test is specifically checking
      // what happens when they *don't* exist. It's useless otherwise.
      throw new Error('Expected this test to run in a Node environment.');
    }
    jest.resetModules();
    expect(() => {
      require('react-dom');
    }).not.toThrow();
  });

  it('includes a useful stack in warnings', () => {
    function A() {
      return null;
    }

    function B() {
      return (
        <font>
          <C>
            <span ariaTypo="no" />
          </C>
        </font>
      );
    }

    class C extends React.Component {
      render() {
        return <b>{this.props.children}</b>;
      }
    }

    function Child() {
      return [<A key="1" />, <B key="2" />, <span ariaTypo2="no" />];
    }

    function App() {
      return (
        <div>
          <section />
          <span>
            <Child />
          </span>
        </div>
      );
    }

    expect(() => ReactDOMServer.renderToString(<App />)).toWarnDev([
      'Invalid ARIA attribute `ariaTypo`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in span (at **)\n' +
        '    in b (at **)\n' +
        '    in C (at **)\n' +
        '    in font (at **)\n' +
        '    in B (at **)\n' +
        '    in Child (at **)\n' +
        '    in span (at **)\n' +
        '    in div (at **)\n' +
        '    in App (at **)',
      'Invalid ARIA attribute `ariaTypo2`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in span (at **)\n' +
        '    in Child (at **)\n' +
        '    in span (at **)\n' +
        '    in div (at **)\n' +
        '    in App (at **)',
    ]);
  });

  it('reports stacks with re-entrant renderToString() calls', () => {
    function Child2(props) {
      return <span ariaTypo3="no">{props.children}</span>;
    }

    function App2() {
      return (
        <Child2>
          {ReactDOMServer.renderToString(<blink ariaTypo2="no" />)}
        </Child2>
      );
    }

    function Child() {
      return (
        <span ariaTypo4="no">{ReactDOMServer.renderToString(<App2 />)}</span>
      );
    }

    function App() {
      return (
        <div>
          <span ariaTypo="no" />
          <Child />
          <font ariaTypo5="no" />
        </div>
      );
    }

    expect(() => ReactDOMServer.renderToString(<App />)).toWarnDev([
      // ReactDOMServer(App > div > span)
      'Invalid ARIA attribute `ariaTypo`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in span (at **)\n' +
        '    in div (at **)\n' +
        '    in App (at **)',
      // ReactDOMServer(App > div > Child) >>> ReactDOMServer(App2) >>> ReactDOMServer(blink)
      'Invalid ARIA attribute `ariaTypo2`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in blink (at **)',
      // ReactDOMServer(App > div > Child) >>> ReactDOMServer(App2 > Child2 > span)
      'Invalid ARIA attribute `ariaTypo3`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in span (at **)\n' +
        '    in Child2 (at **)\n' +
        '    in App2 (at **)',
      // ReactDOMServer(App > div > Child > span)
      'Invalid ARIA attribute `ariaTypo4`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in span (at **)\n' +
        '    in Child (at **)\n' +
        '    in div (at **)\n' +
        '    in App (at **)',
      // ReactDOMServer(App > div > font)
      'Invalid ARIA attribute `ariaTypo5`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in font (at **)\n' +
        '    in div (at **)\n' +
        '    in App (at **)',
    ]);
  });
});
