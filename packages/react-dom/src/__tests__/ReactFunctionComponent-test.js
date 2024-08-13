/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let PropTypes;
let React;
let ReactDOMClient;
let act;
let assertConsoleErrorDev;

function FunctionComponent(props) {
  return <div>{props.name}</div>;
}

describe('ReactFunctionComponent', () => {
  beforeEach(() => {
    jest.resetModules();
    PropTypes = require('prop-types');
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ({act, assertConsoleErrorDev} = require('internal-test-utils'));
  });

  it('should render stateless component', async () => {
    const el = document.createElement('div');

    const root = ReactDOMClient.createRoot(el);
    await act(() => {
      root.render(<FunctionComponent name="A" />);
    });

    expect(el.textContent).toBe('A');
  });

  it('should update stateless component', async () => {
    class Parent extends React.Component {
      render() {
        return <FunctionComponent {...this.props} />;
      }
    }

    const el = document.createElement('div');

    const root = ReactDOMClient.createRoot(el);
    await act(() => {
      root.render(<Parent name="A" />);
    });
    expect(el.textContent).toBe('A');

    await act(() => {
      root.render(<Parent name="B" />);
    });
    expect(el.textContent).toBe('B');
  });

  it('should unmount stateless component', async () => {
    const container = document.createElement('div');

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<FunctionComponent name="A" />);
    });
    expect(container.textContent).toBe('A');

    root.unmount();
    expect(container.textContent).toBe('');
  });

  // @gate !disableLegacyContext
  it('should pass context thru stateless component', async () => {
    class Child extends React.Component {
      static contextTypes = {
        test: PropTypes.string.isRequired,
      };

      render() {
        return <div>{this.context.test}</div>;
      }
    }

    function Parent() {
      return <Child />;
    }

    class GrandParent extends React.Component {
      static childContextTypes = {
        test: PropTypes.string.isRequired,
      };

      getChildContext() {
        return {test: this.props.test};
      }

      render() {
        return <Parent />;
      }
    }

    const el = document.createElement('div');

    const root = ReactDOMClient.createRoot(el);
    await act(() => {
      root.render(<GrandParent test="test" />);
    });

    assertConsoleErrorDev([
      'GrandParent uses the legacy childContextTypes API which will soon be removed. Use React.createContext() instead.',
      'Child uses the legacy contextTypes API which will soon be removed. Use React.createContext() with static contextType instead.',
    ]);

    expect(el.textContent).toBe('test');

    await act(() => {
      root.render(<GrandParent test="mest" />);
    });

    expect(el.textContent).toBe('mest');
  });

  it('should warn for getDerivedStateFromProps on a function component', async () => {
    function FunctionComponentWithChildContext() {
      return null;
    }
    FunctionComponentWithChildContext.getDerivedStateFromProps = function () {};

    const container = document.createElement('div');

    await expect(async () => {
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<FunctionComponentWithChildContext />);
      });
    }).toErrorDev(
      'FunctionComponentWithChildContext: Function ' +
        'components do not support getDerivedStateFromProps.',
    );
  });

  it('should warn for childContextTypes on a function component', async () => {
    function FunctionComponentWithChildContext(props) {
      return <div>{props.name}</div>;
    }

    FunctionComponentWithChildContext.childContextTypes = {
      foo: PropTypes.string,
    };

    const container = document.createElement('div');

    await expect(async () => {
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<FunctionComponentWithChildContext name="A" />);
      });
    }).toErrorDev(
      'childContextTypes cannot ' + 'be defined on a function component.',
    );
  });

  it('should not throw when stateless component returns undefined', async () => {
    function NotAComponent() {}
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(
      act(() => {
        root.render(
          <div>
            <NotAComponent />
          </div>,
        );
      }),
    ).resolves.not.toThrowError();
  });

  // @gate !disableStringRefs
  it('should throw on string refs in pure functions', async () => {
    function Child() {
      return <div ref="me" />;
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(
      act(() => {
        root.render(<Child test="test" />);
      }),
    )
      // TODO: This throws an AggregateError. Need to update test infra to
      // support matching against AggregateError.
      .rejects.toThrowError();
  });

  // @gate !enableRefAsProp || !__DEV__
  it('should warn when given a string ref', async () => {
    function Indirection(props) {
      return <div>{props.children}</div>;
    }

    class ParentUsingStringRef extends React.Component {
      render() {
        return (
          <Indirection>
            <FunctionComponent name="A" ref="stateless" />
          </Indirection>
        );
      }
    }

    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<ParentUsingStringRef />);
      });
    }).toErrorDev(
      'Function components cannot be given refs. ' +
        'Attempts to access this ref will fail. ' +
        'Did you mean to use React.forwardRef()?\n\n' +
        'Check the render method ' +
        'of `ParentUsingStringRef`.\n' +
        '    in FunctionComponent (at **)\n' +
        '    in div (at **)\n' +
        '    in Indirection (at **)\n' +
        '    in ParentUsingStringRef (at **)',
    );

    // No additional warnings should be logged
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<ParentUsingStringRef />);
    });
  });

  // @gate !enableRefAsProp || !__DEV__
  it('should warn when given a function ref', async () => {
    function Indirection(props) {
      return <div>{props.children}</div>;
    }

    const ref = jest.fn();
    class ParentUsingFunctionRef extends React.Component {
      render() {
        return (
          <Indirection>
            <FunctionComponent name="A" ref={ref} />
          </Indirection>
        );
      }
    }

    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<ParentUsingFunctionRef />);
      });
    }).toErrorDev(
      'Function components cannot be given refs. ' +
        'Attempts to access this ref will fail. ' +
        'Did you mean to use React.forwardRef()?\n\n' +
        'Check the render method ' +
        'of `ParentUsingFunctionRef`.\n' +
        '    in FunctionComponent (at **)\n' +
        '    in div (at **)\n' +
        '    in Indirection (at **)\n' +
        '    in ParentUsingFunctionRef (at **)',
    );
    expect(ref).not.toHaveBeenCalled();

    // No additional warnings should be logged
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<ParentUsingFunctionRef />);
    });
  });

  // @gate !enableRefAsProp || !__DEV__
  it('deduplicates ref warnings based on element or owner', async () => {
    // When owner uses JSX, we can use exact line location to dedupe warnings
    class AnonymousParentUsingJSX extends React.Component {
      render() {
        return <FunctionComponent name="A" ref={() => {}} />;
      }
    }

    let instance1;

    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      await act(() => {
        root.render(
          <AnonymousParentUsingJSX ref={current => (instance1 = current)} />,
        );
      });
    }).toErrorDev('Function components cannot be given refs.');
    // Should be deduped (offending element is on the same line):
    instance1.forceUpdate();
    // Should also be deduped (offending element is on the same line):
    let container = document.createElement('div');
    let root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<AnonymousParentUsingJSX />);
    });

    // When owner doesn't use JSX, and is anonymous, we warn once per internal instance.
    class AnonymousParentNotUsingJSX extends React.Component {
      render() {
        return React.createElement(FunctionComponent, {
          name: 'A',
          ref: () => {},
        });
      }
    }

    let instance2;
    await expect(async () => {
      container = document.createElement('div');
      root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <AnonymousParentNotUsingJSX ref={current => (instance2 = current)} />,
        );
      });
    }).toErrorDev('Function components cannot be given refs.');
    // Should be deduped (same internal instance, no additional warnings)
    instance2.forceUpdate();
    // Could not be differentiated (since owner is anonymous and no source location)
    container = document.createElement('div');
    root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<AnonymousParentNotUsingJSX />);
    });

    // When owner doesn't use JSX, but is named, we warn once per owner name
    class NamedParentNotUsingJSX extends React.Component {
      render() {
        return React.createElement(FunctionComponent, {
          name: 'A',
          ref: () => {},
        });
      }
    }
    let instance3;
    await expect(async () => {
      container = document.createElement('div');
      root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <NamedParentNotUsingJSX ref={current => (instance3 = current)} />,
        );
      });
    }).toErrorDev('Function components cannot be given refs.');
    // Should be deduped (same owner name, no additional warnings):
    instance3.forceUpdate();
    // Should also be deduped (same owner name, no additional warnings):
    container = document.createElement('div');
    root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<NamedParentNotUsingJSX />);
    });
  });

  // This guards against a regression caused by clearing the current debug fiber.
  // https://github.com/facebook/react/issues/10831
  // @gate !disableLegacyContext || !__DEV__
  // @gate !enableRefAsProp || !__DEV__
  it('should warn when giving a function ref with context', async () => {
    function Child() {
      return null;
    }
    Child.contextTypes = {
      foo: PropTypes.string,
    };

    class Parent extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string,
      };
      getChildContext() {
        return {
          foo: 'bar',
        };
      }
      render() {
        return <Child ref={function () {}} />;
      }
    }

    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Parent />);
      });
    }).toErrorDev(
      'Function components cannot be given refs. ' +
        'Attempts to access this ref will fail. ' +
        'Did you mean to use React.forwardRef()?\n\n' +
        'Check the render method ' +
        'of `Parent`.\n' +
        '    in Child (at **)\n' +
        '    in Parent (at **)',
    );
  });

  it('should use correct name in key warning', async () => {
    function Child() {
      return <div>{[<span />]}</div>;
    }

    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Child />);
      });
    }).toErrorDev(
      'Each child in a list should have a unique "key" prop.\n\n' +
        'Check the render method of `Child`.',
    );
  });

  // @gate !disableDefaultPropsExceptForClasses
  it('should support default props', async () => {
    function Child(props) {
      return <div>{props.test}</div>;
    }
    Child.defaultProps = {test: 2};

    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      await act(() => {
        root.render(<Child />);
      });
      expect(container.textContent).toBe('2');
    }).toErrorDev([
      'Child: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
    ]);
  });

  // @gate !disableLegacyContext && !disableLegacyContextForFunctionComponents
  it('should receive context', async () => {
    class Parent extends React.Component {
      static childContextTypes = {
        lang: PropTypes.string,
      };

      getChildContext() {
        return {lang: 'en'};
      }

      render() {
        return <Child />;
      }
    }

    function Child(props, context) {
      return <div>{context.lang}</div>;
    }
    Child.contextTypes = {lang: PropTypes.string};

    const el = document.createElement('div');

    const root = ReactDOMClient.createRoot(el);
    await act(() => {
      root.render(<Parent />);
    });
    assertConsoleErrorDev([
      'Parent uses the legacy childContextTypes API which will soon be removed. Use React.createContext() instead.',
      'Child uses the legacy contextTypes API which will be removed soon. Use React.createContext() with React.useContext() instead.',
    ]);
    expect(el.textContent).toBe('en');
  });

  it('should work with arrow functions', async () => {
    let Child = function () {
      return <div />;
    };
    // Will create a new bound function without a prototype, much like a native
    // arrow function.
    Child = Child.bind(this);

    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Child />);
      });
    }).not.toThrow();
  });

  it('should allow simple functions to return null', async () => {
    const Child = function () {
      return null;
    };
    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Child />);
      });
    }).not.toThrow();
  });

  it('should allow simple functions to return false', async () => {
    function Child() {
      return false;
    }
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(
      act(() => {
        root.render(<Child />);
      }),
    ).resolves.not.toThrow();
  });
});
