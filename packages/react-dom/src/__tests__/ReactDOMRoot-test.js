/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React = require('react');
let ReactDOM = require('react-dom');
let ReactDOMClient = require('react-dom/client');
let ReactDOMServer = require('react-dom/server');
let Scheduler = require('scheduler');
let act;
let useEffect;
let assertLog;
let waitForAll;

describe('ReactDOMRoot', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    useEffect = React.useEffect;

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;
    waitForAll = InternalTestUtils.waitForAll;
  });

  it('renders children', async () => {
    const root = ReactDOMClient.createRoot(container);
    root.render(<div>Hi</div>);
    await waitForAll([]);
    expect(container.textContent).toEqual('Hi');
  });

  it('warns if a callback parameter is provided to render', async () => {
    const callback = jest.fn();
    const root = ReactDOMClient.createRoot(container);
    expect(() => root.render(<div>Hi</div>, callback)).toErrorDev(
      'does not support the second callback argument. ' +
        'To execute a side effect after rendering, declare it in a component body with useEffect().',
      {withoutStack: true},
    );
    await waitForAll([]);
    expect(callback).not.toHaveBeenCalled();
  });

  it('warn if a object is passed to root.render(...)', async () => {
    function App() {
      return 'Child';
    }

    const root = ReactDOMClient.createRoot(container);
    expect(() => root.render(<App />, {})).toErrorDev(
      'You passed a second argument to root.render(...) but it only accepts ' +
        'one argument.',
      {
        withoutStack: true,
      },
    );
  });

  it('warn if a container is passed to root.render(...)', async () => {
    function App() {
      return 'Child';
    }

    const root = ReactDOMClient.createRoot(container);
    expect(() => root.render(<App />, container)).toErrorDev(
      'You passed a container to the second argument of root.render(...). ' +
        "You don't need to pass it again since you already passed it to create " +
        'the root.',
      {
        withoutStack: true,
      },
    );
  });

  it('warns if a callback parameter is provided to unmount', async () => {
    const callback = jest.fn();
    const root = ReactDOMClient.createRoot(container);
    root.render(<div>Hi</div>);
    expect(() => root.unmount(callback)).toErrorDev(
      'does not support a callback argument. ' +
        'To execute a side effect after rendering, declare it in a component body with useEffect().',
      {withoutStack: true},
    );
    await waitForAll([]);
    expect(callback).not.toHaveBeenCalled();
  });

  it('unmounts children', async () => {
    const root = ReactDOMClient.createRoot(container);
    root.render(<div>Hi</div>);
    await waitForAll([]);
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    await waitForAll([]);
    expect(container.textContent).toEqual('');
  });

  it('can be immediately unmounted', async () => {
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.unmount();
    });
  });

  it('supports hydration', async () => {
    const markup = await new Promise(resolve =>
      resolve(
        ReactDOMServer.renderToString(
          <div>
            <span className="extra" />
          </div>,
        ),
      ),
    );

    // Does not hydrate by default
    const container1 = document.createElement('div');
    container1.innerHTML = markup;
    const root1 = ReactDOMClient.createRoot(container1);
    root1.render(
      <div>
        <span />
      </div>,
    );
    await waitForAll([]);

    const container2 = document.createElement('div');
    container2.innerHTML = markup;
    ReactDOMClient.hydrateRoot(
      container2,
      <div>
        <span />
      </div>,
    );
    await expect(async () => await waitForAll([])).toErrorDev(
      "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.",
      {withoutStack: true},
    );
  });

  it('clears existing children', async () => {
    container.innerHTML = '<div>a</div><div>b</div>';
    const root = ReactDOMClient.createRoot(container);
    root.render(
      <div>
        <span>c</span>
        <span>d</span>
      </div>,
    );
    await waitForAll([]);
    expect(container.textContent).toEqual('cd');
    root.render(
      <div>
        <span>d</span>
        <span>c</span>
      </div>,
    );
    await waitForAll([]);
    expect(container.textContent).toEqual('dc');
  });

  it('throws a good message on invalid containers', () => {
    expect(() => {
      ReactDOMClient.createRoot(<div>Hi</div>);
    }).toThrow('Target container is not a DOM element.');
  });

  it('warns when creating two roots managing the same container', () => {
    ReactDOMClient.createRoot(container);
    expect(() => {
      ReactDOMClient.createRoot(container);
    }).toErrorDev(
      'You are calling ReactDOMClient.createRoot() on a container that ' +
        'has already been passed to createRoot() before. Instead, call ' +
        'root.render() on the existing root instead if you want to update it.',
      {withoutStack: true},
    );
  });

  it('does not warn when creating second root after first one is unmounted', async () => {
    const root = ReactDOMClient.createRoot(container);
    root.unmount();
    await waitForAll([]);
    ReactDOMClient.createRoot(container); // No warning
  });

  it('warns if creating a root on the document.body', async () => {
    // we no longer expect an error for this if float is enabled
    ReactDOMClient.createRoot(document.body);
  });

  it('warns if updating a root that has had its contents removed', async () => {
    const root = ReactDOMClient.createRoot(container);
    root.render(<div>Hi</div>);
    await waitForAll([]);
    container.innerHTML = '';

    // When either of these flags are on this validation is turned off so we
    // expect there to be no warnings
    root.render(<div>Hi</div>);
  });

  it('should render different components in same root', async () => {
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(() => {
      root.render(<div />);
    });
    expect(container.firstChild.nodeName).toBe('DIV');

    await act(() => {
      root.render(<span />);
    });
    expect(container.firstChild.nodeName).toBe('SPAN');
  });

  it('should not warn if mounting into non-empty node', async () => {
    container.innerHTML = '<div></div>';
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<div />);
    });

    expect(true).toBe(true);
  });

  it('should reuse markup if rendering to the same target twice', async () => {
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<div />);
    });
    const firstElm = container.firstChild;
    await act(() => {
      root.render(<div />);
    });

    expect(firstElm).toBe(container.firstChild);
  });

  it('should unmount and remount if the key changes', async () => {
    function Component({text}) {
      useEffect(() => {
        Scheduler.log('Mount');

        return () => {
          Scheduler.log('Unmount');
        };
      }, []);

      return <span>{text}</span>;
    }

    const root = ReactDOMClient.createRoot(container);

    await act(() => {
      root.render(<Component text="orange" key="A" />);
    });
    expect(container.firstChild.innerHTML).toBe('orange');
    assertLog(['Mount']);

    // If we change the key, the component is unmounted and remounted
    await act(() => {
      root.render(<Component text="green" key="B" />);
    });
    expect(container.firstChild.innerHTML).toBe('green');
    assertLog(['Unmount', 'Mount']);

    // But if we don't change the key, the component instance is reused
    await act(() => {
      root.render(<Component text="blue" key="B" />);
    });
    expect(container.firstChild.innerHTML).toBe('blue');
    assertLog([]);
  });

  it('throws if unmounting a root that has had its contents removed', async () => {
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<div>Hi</div>);
    });
    container.innerHTML = '';

    await expect(async () => {
      await act(() => {
        root.unmount();
      });
    }).rejects.toThrow('The node to be removed is not a child of this node.');
  });

  it('unmount is synchronous', async () => {
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render('Hi');
    });
    expect(container.textContent).toEqual('Hi');

    await act(() => {
      root.unmount();
      // Should have already unmounted
      expect(container.textContent).toEqual('');
    });
  });

  it('throws if an unmounted root is updated', async () => {
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render('Hi');
    });
    expect(container.textContent).toEqual('Hi');

    root.unmount();

    expect(() => root.render("I'm back")).toThrow(
      'Cannot update an unmounted root.',
    );
  });

  it('warns if root is unmounted inside an effect', async () => {
    const container1 = document.createElement('div');
    const root1 = ReactDOMClient.createRoot(container1);
    const container2 = document.createElement('div');
    const root2 = ReactDOMClient.createRoot(container2);

    function App({step}) {
      useEffect(() => {
        if (step === 2) {
          root2.unmount();
        }
      }, [step]);
      return 'Hi';
    }

    await act(() => {
      root1.render(<App step={1} />);
    });
    expect(container1.textContent).toEqual('Hi');

    expect(() => {
      ReactDOM.flushSync(() => {
        root1.render(<App step={2} />);
      });
    }).toErrorDev(
      'Attempted to synchronously unmount a root while React was ' +
        'already rendering.',
    );
  });

  // @gate disableCommentsAsDOMContainers
  it('errors if container is a comment node', () => {
    // This is an old feature used by www. Disabled in the open source build.
    const div = document.createElement('div');
    div.innerHTML = '<!-- react-mount-point-unstable -->';
    const commentNode = div.childNodes[0];

    expect(() => ReactDOMClient.createRoot(commentNode)).toThrow(
      'Target container is not a DOM element.',
    );
    expect(() => ReactDOMClient.hydrateRoot(commentNode)).toThrow(
      'Target container is not a DOM element.',
    );
  });

  it('warn if no children passed to hydrateRoot', async () => {
    expect(() => ReactDOMClient.hydrateRoot(container)).toErrorDev(
      'Must provide initial children as second argument to hydrateRoot.',
      {withoutStack: true},
    );
  });

  it('warn if JSX passed to createRoot', async () => {
    function App() {
      return 'Child';
    }

    expect(() => ReactDOMClient.createRoot(container, <App />)).toErrorDev(
      'You passed a JSX element to createRoot. You probably meant to call ' +
        'root.render instead',
      {
        withoutStack: true,
      },
    );
  });

  it('warns when given a function', () => {
    function Component() {
      return <div />;
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));

    expect(() => {
      ReactDOM.flushSync(() => {
        root.render(Component);
      });
    }).toErrorDev(
      'Functions are not valid as a React child. ' +
        'This may happen if you return Component instead of <Component /> from render. ' +
        'Or maybe you meant to call this function rather than return it.\n' +
        '  root.render(Component)',
      {withoutStack: true},
    );
  });

  it('warns when given a symbol', () => {
    const root = ReactDOMClient.createRoot(document.createElement('div'));

    expect(() => {
      ReactDOM.flushSync(() => {
        root.render(Symbol('foo'));
      });
    }).toErrorDev(
      'Symbols are not valid as a React child.\n' +
        '  root.render(Symbol(foo))',
      {withoutStack: true},
    );
  });
});
