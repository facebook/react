/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let findDOMNode;
let ReactDOMClient;
let ReactDOMServer;

let act;

describe('ReactDOM', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server');
    findDOMNode =
      ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
        .findDOMNode;

    act = require('internal-test-utils').act;
  });

  it('should bubble onSubmit', async () => {
    const container = document.createElement('div');

    let count = 0;
    let buttonRef;

    function Parent() {
      return (
        <div
          onSubmit={event => {
            event.preventDefault();
            count++;
          }}>
          <Child />
        </div>
      );
    }

    function Child() {
      return (
        <form>
          <input type="submit" ref={button => (buttonRef = button)} />
        </form>
      );
    }

    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);
    try {
      await act(() => {
        root.render(<Parent />);
      });
      buttonRef.click();
      expect(count).toBe(1);
    } finally {
      document.body.removeChild(container);
    }
  });

  it('allows a DOM element to be used with a string', async () => {
    const element = React.createElement('div', {className: 'foo'});
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(element);
    });

    const node = container.firstChild;
    expect(node.tagName).toBe('DIV');
  });

  it('should allow children to be passed as an argument', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement('div', null, 'child'));
    });

    const argNode = container.firstChild;
    expect(argNode.innerHTML).toBe('child');
  });

  it('should overwrite props.children with children argument', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement('div', {children: 'fakechild'}, 'child'));
    });

    const conflictNode = container.firstChild;
    expect(conflictNode.innerHTML).toBe('child');
  });

  /**
   * We need to make sure that updates occur to the actual node that's in the
   * DOM, instead of a stale cache.
   */
  it('should purge the DOM cache when removing nodes', async () => {
    let container = document.createElement('div');
    let root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <div>
          <div key="theDog" className="dog" />,
          <div key="theBird" className="bird" />
        </div>,
      );
    });
    // Warm the cache with theDog
    container = document.createElement('div');
    root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <div>
          <div key="theDog" className="dogbeforedelete" />,
          <div key="theBird" className="bird" />,
        </div>,
      );
    });
    // Remove theDog - this should purge the cache
    container = document.createElement('div');
    root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <div>
          <div key="theBird" className="bird" />,
        </div>,
      );
    });
    // Now, put theDog back. It's now a different DOM node.
    container = document.createElement('div');
    root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <div>
          <div key="theDog" className="dog" />,
          <div key="theBird" className="bird" />,
        </div>,
      );
    });
    // Change the className of theDog. It will use the same element
    container = document.createElement('div');
    root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <div>
          <div key="theDog" className="bigdog" />,
          <div key="theBird" className="bird" />,
        </div>,
      );
    });

    const myDiv = container.firstChild;
    const dog = myDiv.childNodes[0];
    expect(dog.className).toBe('bigdog');
  });

  // @gate !disableLegacyMode
  it('throws in render() if the mount callback in legacy roots is not a function', async () => {
    spyOnDev(console, 'warn');
    spyOnDev(console, 'error');

    function Foo() {
      this.a = 1;
      this.b = 2;
    }

    class A extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    const myDiv = document.createElement('div');
    await expect(async () => {
      await expect(async () => {
        await act(() => {
          ReactDOM.render(<A />, myDiv, 'no');
        });
      }).rejects.toThrowError(
        'Invalid argument passed as callback. Expected a function. Instead ' +
          'received: no',
      );
    }).toErrorDev(
      [
        'Expected the last optional `callback` argument to be a function. Instead received: no.',
        'Expected the last optional `callback` argument to be a function. Instead received: no.',
      ],
      {withoutStack: 2},
    );

    await expect(async () => {
      await expect(async () => {
        await act(() => {
          ReactDOM.render(<A />, myDiv, {foo: 'bar'});
        });
      }).rejects.toThrowError(
        'Invalid argument passed as callback. Expected a function. Instead ' +
          'received: [object Object]',
      );
    }).toErrorDev(
      [
        "Expected the last optional `callback` argument to be a function. Instead received: { foo: 'bar' }",
        "Expected the last optional `callback` argument to be a function. Instead received: { foo: 'bar' }.",
      ],
      {withoutStack: 2},
    );

    await expect(async () => {
      await expect(async () => {
        await act(() => {
          ReactDOM.render(<A />, myDiv, new Foo());
        });
      }).rejects.toThrowError(
        'Invalid argument passed as callback. Expected a function. Instead ' +
          'received: [object Object]',
      );
    }).toErrorDev(
      [
        'Expected the last optional `callback` argument to be a function. Instead received: Foo { a: 1, b: 2 }.',
        'Expected the last optional `callback` argument to be a function. Instead received: Foo { a: 1, b: 2 }.',
      ],
      {withoutStack: 2},
    );
  });

  // @gate !disableLegacyMode
  it('throws in render() if the update callback in legacy roots is not a function', async () => {
    function Foo() {
      this.a = 1;
      this.b = 2;
    }

    class A extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    const myDiv = document.createElement('div');
    ReactDOM.render(<A />, myDiv);
    await expect(async () => {
      await expect(async () => {
        await act(() => {
          ReactDOM.render(<A />, myDiv, 'no');
        });
      }).rejects.toThrowError(
        'Invalid argument passed as callback. Expected a function. Instead ' +
          'received: no',
      );
    }).toErrorDev(
      [
        'Expected the last optional `callback` argument to be a function. Instead received: no.',
        'Expected the last optional `callback` argument to be a function. Instead received: no.',
      ],
      {withoutStack: 2},
    );

    ReactDOM.render(<A />, myDiv); // Re-mount
    await expect(async () => {
      await expect(async () => {
        await act(() => {
          ReactDOM.render(<A />, myDiv, {foo: 'bar'});
        });
      }).rejects.toThrowError(
        'Invalid argument passed as callback. Expected a function. Instead ' +
          'received: [object Object]',
      );
    }).toErrorDev(
      [
        "Expected the last optional `callback` argument to be a function. Instead received: { foo: 'bar' }.",
        "Expected the last optional `callback` argument to be a function. Instead received: { foo: 'bar' }.",
      ],
      {withoutStack: 2},
    );

    ReactDOM.render(<A />, myDiv); // Re-mount
    await expect(async () => {
      await expect(async () => {
        await act(() => {
          ReactDOM.render(<A />, myDiv, new Foo());
        });
      }).rejects.toThrowError(
        'Invalid argument passed as callback. Expected a function. Instead ' +
          'received: [object Object]',
      );
    }).toErrorDev(
      [
        'Expected the last optional `callback` argument to be a function. Instead received: Foo { a: 1, b: 2 }.',
        'Expected the last optional `callback` argument to be a function. Instead received: Foo { a: 1, b: 2 }.',
      ],
      {withoutStack: 2},
    );
  });

  it('preserves focus', async () => {
    let input;
    let input2;
    class A extends React.Component {
      render() {
        return (
          <div>
            <input id="one" ref={r => (input = input || r)} />
            {this.props.showTwo && (
              <input id="two" ref={r => (input2 = input2 || r)} />
            )}
          </div>
        );
      }

      componentDidUpdate() {
        // Focus should have been restored to the original input
        expect(document.activeElement.id).toBe('one');
        input2.focus();
        expect(document.activeElement.id).toBe('two');
        log.push('input2 focused');
      }
    }

    const log = [];
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);
    try {
      await act(() => {
        root.render(<A showTwo={false} />);
      });
      input.focus();

      // When the second input is added, let's simulate losing focus, which is
      // something that could happen when manipulating DOM nodes (but is hard to
      // deterministically force without relying intensely on React DOM
      // implementation details)
      const div = container.firstChild;
      ['appendChild', 'insertBefore'].forEach(name => {
        const mutator = div[name];
        div[name] = function () {
          if (input) {
            input.blur();
            expect(document.activeElement.tagName).toBe('BODY');
            log.push('input2 inserted');
          }
          return mutator.apply(this, arguments);
        };
      });

      expect(document.activeElement.id).toBe('one');
      await act(() => {
        root.render(<A showTwo={true} />);
      });
      // input2 gets added, which causes input to get blurred. Then
      // componentDidUpdate focuses input2 and that should make it down to here,
      // not get overwritten by focus restoration.
      expect(document.activeElement.id).toBe('two');
      expect(log).toEqual(['input2 inserted', 'input2 focused']);
    } finally {
      document.body.removeChild(container);
    }
  });

  it('calls focus() on autoFocus elements after they have been mounted to the DOM', async () => {
    const originalFocus = HTMLElement.prototype.focus;

    try {
      let focusedElement;
      let inputFocusedAfterMount = false;

      // This test needs to determine that focus is called after mount.
      // Can't check document.activeElement because PhantomJS is too permissive;
      // It doesn't require element to be in the DOM to be focused.
      HTMLElement.prototype.focus = function () {
        focusedElement = this;
        inputFocusedAfterMount = !!this.parentNode;
      };

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <div>
            <h1>Auto-focus Test</h1>
            <input autoFocus={true} />
            <p>The above input should be focused after mount.</p>
          </div>,
        );
      });

      expect(inputFocusedAfterMount).toBe(true);
      expect(focusedElement.tagName).toBe('INPUT');
    } finally {
      HTMLElement.prototype.focus = originalFocus;
    }
  });

  it("shouldn't fire duplicate event handler while handling other nested dispatch", async () => {
    const actual = [];

    class Wrapper extends React.Component {
      componentDidMount() {
        this.ref1.click();
      }

      render() {
        return (
          <div>
            <div
              onClick={() => {
                actual.push('1st node clicked');
                this.ref2.click();
              }}
              ref={ref => (this.ref1 = ref)}
            />
            <div
              onClick={ref => {
                actual.push("2nd node clicked imperatively from 1st's handler");
              }}
              ref={ref => (this.ref2 = ref)}
            />
          </div>
        );
      }
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);
    try {
      await act(() => {
        root.render(<Wrapper />);
      });

      const expected = [
        '1st node clicked',
        "2nd node clicked imperatively from 1st's handler",
      ];

      expect(actual).toEqual(expected);
    } finally {
      document.body.removeChild(container);
    }
  });

  it('should not crash with devtools installed', async () => {
    try {
      global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        inject: function () {},
        onCommitFiberRoot: function () {},
        onCommitFiberUnmount: function () {},
        supportsFiber: true,
      };
      jest.resetModules();
      React = require('react');
      ReactDOM = require('react-dom');
      class Component extends React.Component {
        render() {
          return <div />;
        }
      }
      const root = ReactDOMClient.createRoot(document.createElement('div'));
      await act(() => {
        root.render(<Component />);
      });
    } finally {
      delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    }
  });

  it('should not crash calling findDOMNode inside a function component', async () => {
    class Component extends React.Component {
      render() {
        return <div />;
      }
    }

    const container = document.createElement('div');
    let root = ReactDOMClient.createRoot(container);
    let instance;
    await act(() => {
      root.render(<Component ref={current => (instance = current)} />);
    });

    const App = () => {
      findDOMNode(instance);
      return <div />;
    };

    if (__DEV__) {
      root = ReactDOMClient.createRoot(document.createElement('div'));
      await act(() => {
        root.render(<App />);
      });
    }
  });

  it('reports stacks with re-entrant renderToString() calls on the client', async () => {
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

    function ServerEntry() {
      return ReactDOMServer.renderToString(<Child />);
    }

    function App() {
      return (
        <div>
          <span ariaTypo="no" />
          <ServerEntry />
          <font ariaTypo5="no" />
        </div>
      );
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await expect(async () => {
      await act(() => {
        root.render(<App />);
      });
    }).toErrorDev([
      // ReactDOM(App > div > span)
      'Invalid ARIA attribute `ariaTypo`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in span (at **)\n' +
        (gate(flags => flags.enableOwnerStacks) ? '' : '    in div (at **)\n') +
        '    in App (at **)',
      // ReactDOM(App > div > ServerEntry) >>> ReactDOMServer(Child) >>> ReactDOMServer(App2) >>> ReactDOMServer(blink)
      'Invalid ARIA attribute `ariaTypo2`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in blink (at **)',
      // ReactDOM(App > div > ServerEntry) >>> ReactDOMServer(Child) >>> ReactDOMServer(App2 > Child2 > span)
      'Invalid ARIA attribute `ariaTypo3`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in span (at **)\n' +
        '    in Child2 (at **)\n' +
        '    in App2 (at **)',
      // ReactDOM(App > div > ServerEntry) >>> ReactDOMServer(Child > span)
      'Invalid ARIA attribute `ariaTypo4`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in span (at **)\n' +
        '    in Child (at **)',
      // ReactDOM(App > div > font)
      'Invalid ARIA attribute `ariaTypo5`. ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in font (at **)\n' +
        (gate(flags => flags.enableOwnerStacks) ? '' : '    in div (at **)\n') +
        '    in App (at **)',
    ]);
  });
});
