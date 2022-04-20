/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let JSDOM;
let Stream;
let Scheduler;
let Suspense;
let React;
let ReactDOMClient;
let ReactDOMFizzServer;
let document;
let writable;
let container;
let buffer = '';
let hasErrored = false;
let fatalError = undefined;

describe('ReactDOMFizzServerHydrationWarning', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    Scheduler = require('scheduler');
    React = require('react');
    Suspense = React.Suspense;
    ReactDOMClient = require('react-dom/client');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzServer = require('react-dom/server');
    }
    Stream = require('stream');

    // Test Environment
    const jsdom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body><div id="container">',
      {
        runScripts: 'dangerously',
      },
    );
    document = jsdom.window.document;
    container = document.getElementById('container');

    buffer = '';
    hasErrored = false;

    writable = new Stream.PassThrough();
    writable.setEncoding('utf8');
    writable.on('data', chunk => {
      buffer += chunk;
    });
    writable.on('error', error => {
      hasErrored = true;
      fatalError = error;
    });
  });

  function normalizeCodeLocInfo(strOrErr) {
    if (strOrErr && strOrErr.replace) {
      return strOrErr.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function(
        m,
        name,
      ) {
        return '\n    in ' + name + ' (at **)';
      });
    }
    return strOrErr;
  }

  async function act(callback) {
    await callback();
    // Await one turn around the event loop.
    // This assumes that we'll flush everything we have so far.
    await new Promise(resolve => {
      setImmediate(resolve);
    });
    if (hasErrored) {
      throw fatalError;
    }
    // JSDOM doesn't support stream HTML parser so we need to give it a proper fragment.
    // We also want to execute any scripts that are embedded.
    // We assume that we have now received a proper fragment of HTML.
    const bufferedContent = buffer;
    buffer = '';
    const fakeBody = document.createElement('body');
    fakeBody.innerHTML = bufferedContent;
    while (fakeBody.firstChild) {
      const node = fakeBody.firstChild;
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script');
        script.textContent = node.textContent;
        fakeBody.removeChild(node);
        container.appendChild(script);
      } else {
        container.appendChild(node);
      }
    }
  }

  function getVisibleChildren(element) {
    const children = [];
    let node = element.firstChild;
    while (node) {
      if (node.nodeType === 1) {
        if (
          node.tagName !== 'SCRIPT' &&
          node.tagName !== 'TEMPLATE' &&
          node.tagName !== 'template' &&
          !node.hasAttribute('hidden') &&
          !node.hasAttribute('aria-hidden')
        ) {
          const props = {};
          const attributes = node.attributes;
          for (let i = 0; i < attributes.length; i++) {
            if (
              attributes[i].name === 'id' &&
              attributes[i].value.includes(':')
            ) {
              // We assume this is a React added ID that's a non-visual implementation detail.
              continue;
            }
            props[attributes[i].name] = attributes[i].value;
          }
          props.children = getVisibleChildren(node);
          children.push(React.createElement(node.tagName.toLowerCase(), props));
        }
      } else if (node.nodeType === 3) {
        children.push(node.data);
      }
      node = node.nextSibling;
    }
    return children.length === 0
      ? undefined
      : children.length === 1
      ? children[0]
      : children;
  }

  // @gate experimental
  it('suppresses and fixes text mismatches with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div>
          <span suppressHydrationWarning={true}>
            {isClient ? 'Client Text' : 'Server Text'}
          </span>
          <span suppressHydrationWarning={true}>{isClient ? 2 : 1}</span>
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Server Text</span>
        <span>1</span>
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        // Don't miss a hydration error. There should be none.
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(Scheduler).toFlushAndYield([]);
    // The text mismatch should be *silently* fixed. Even in production.
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Client Text</span>
        <span>2</span>
      </div>,
    );
  });

  // @gate experimental
  it('suppresses and fixes multiple text node mismatches with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div>
          <span suppressHydrationWarning={true}>
            {isClient ? 'Client1' : 'Server1'}
            {isClient ? 'Client2' : 'Server2'}
          </span>
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>
          {'Server1'}
          {'Server2'}
        </span>
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(Scheduler).toFlushAndYield([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>
          {'Client1'}
          {'Client2'}
        </span>
      </div>,
    );
  });

  // @gate experimental
  it('errors on text-to-element mismatches with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div>
          <span suppressHydrationWarning={true}>
            Hello, {isClient ? <span>Client</span> : 'Server'}!
          </span>
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>
          {'Hello, '}
          {'Server'}
          {'!'}
        </span>
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(() => {
      expect(Scheduler).toFlushAndYield([
        'Hydration failed because the initial UI does not match what was rendered on the server.',
        'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
      ]);
    }).toErrorDev(
      [
        'Expected server HTML to contain a matching <span> in <span>',
        'An error occurred during hydration. The server HTML was replaced with client content in <div>.',
      ],
      {withoutStack: 1},
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>
          Hello, <span>Client</span>!
        </span>
      </div>,
    );
  });

  // @gate experimental
  it('suppresses and fixes client-only single text node mismatches with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div>
          <span suppressHydrationWarning={true}>
            {isClient ? 'Client' : null}
          </span>
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span />
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(Scheduler).toFlushAndYield([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>{'Client'}</span>
      </div>,
    );
  });

  // TODO: This behavior is not consistent with client-only single text node.
  // @gate experimental
  it('errors on server-only single text node mismatches with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div>
          <span suppressHydrationWarning={true}>
            {isClient ? null : 'Server'}
          </span>
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>Server</span>
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(() => {
      expect(Scheduler).toFlushAndYield([
        'Hydration failed because the initial UI does not match what was rendered on the server.',
        'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
      ]);
    }).toErrorDev(
      [
        'Did not expect server HTML to contain the text node "Server" in <span>',
        'An error occurred during hydration. The server HTML was replaced with client content in <div>.',
      ],
      {withoutStack: 1},
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span />
      </div>,
    );
  });

  // @gate experimental
  it('errors on client-only extra text node mismatches with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div>
          <span suppressHydrationWarning={true}>
            <span>Shared</span>
            {isClient ? 'Client' : null}
          </span>
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>
          <span>Shared</span>
        </span>
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(() => {
      expect(Scheduler).toFlushAndYield([
        'Hydration failed because the initial UI does not match what was rendered on the server.',
        'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
      ]);
    }).toErrorDev(
      [
        'Expected server HTML to contain a matching text node for "Client" in <span>.',
        'An error occurred during hydration. The server HTML was replaced with client content in <div>.',
      ],
      {withoutStack: 1},
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>
          <span>Shared</span>
          {'Client'}
        </span>
      </div>,
    );
  });

  // @gate experimental
  it('errors on server-only extra text node mismatches with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div>
          <span suppressHydrationWarning={true}>
            <span>Shared</span>
            {isClient ? null : 'Server'}
          </span>
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>
          <span>Shared</span>Server
        </span>
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(() => {
      expect(Scheduler).toFlushAndYield([
        'Hydration failed because the initial UI does not match what was rendered on the server.',
        'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
      ]);
    }).toErrorDev(
      [
        'Did not expect server HTML to contain the text node "Server" in <span>.',
        'An error occurred during hydration. The server HTML was replaced with client content in <div>.',
      ],
      {withoutStack: 1},
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>
          <span>Shared</span>
        </span>
      </div>,
    );
  });

  // @gate experimental
  it('errors on element-to-text mismatches with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div>
          <span suppressHydrationWarning={true}>
            Hello, {isClient ? 'Client' : <span>Server</span>}!
          </span>
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>
          Hello, <span>Server</span>!
        </span>
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(() => {
      expect(Scheduler).toFlushAndYield([
        'Hydration failed because the initial UI does not match what was rendered on the server.',
        'Hydration failed because the initial UI does not match what was rendered on the server.',
        'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
      ]);
    }).toErrorDev(
      [
        'Expected server HTML to contain a matching text node for "Client" in <span>.',
        'An error occurred during hydration. The server HTML was replaced with client content in <div>.',
      ],
      {withoutStack: 1},
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span>
          {'Hello, '}
          {'Client'}
          {'!'}
        </span>
      </div>,
    );
  });

  // @gate experimental
  it('suppresses and does not fix attribute mismatches with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div>
          <span
            suppressHydrationWarning={true}
            className={isClient ? 'client' : 'server'}
            style={{opacity: isClient ? 1 : 0}}
            data-serveronly={isClient ? null : 'server-only'}
            data-clientonly={isClient ? 'client-only' : null}
          />
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span class="server" style="opacity:0" data-serveronly="server-only" />
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(Scheduler).toFlushAndYield([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span class="server" style="opacity:0" data-serveronly="server-only" />
      </div>,
    );
  });

  // @gate experimental
  it('suppresses and does not fix html mismatches with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div>
          <p
            suppressHydrationWarning={true}
            dangerouslySetInnerHTML={{
              __html: isClient ? 'Client HTML' : 'Server HTML',
            }}
          />
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>Server HTML</p>
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(Scheduler).toFlushAndYield([]);
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>Server HTML</p>
      </div>,
    );
  });

  // @gate experimental
  it('errors on insertions with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div suppressHydrationWarning={true}>
          <p>Client and server</p>
          {isClient && <p>Client only</p>}
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>Client and server</p>
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(() => {
      expect(Scheduler).toFlushAndYield([
        'Hydration failed because the initial UI does not match what was rendered on the server.',
        'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
      ]);
    }).toErrorDev(
      [
        'Expected server HTML to contain a matching <p> in <div>.',
        'An error occurred during hydration. The server HTML was replaced with client content in <div>.',
      ],
      {withoutStack: 1},
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>Client and server</p>
        <p>Client only</p>
      </div>,
    );
  });

  // @gate experimental
  it('errors on deletions with suppressHydrationWarning', async () => {
    function App({isClient}) {
      return (
        <div suppressHydrationWarning={true}>
          <p>Client and server</p>
          {!isClient && <p>Server only</p>}
        </div>
      );
    }
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <App isClient={false} />,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>Client and server</p>
        <p>Server only</p>
      </div>,
    );
    ReactDOMClient.hydrateRoot(container, <App isClient={true} />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(error.message);
      },
    });
    expect(() => {
      expect(Scheduler).toFlushAndYield([
        'Hydration failed because the initial UI does not match what was rendered on the server.',
        'There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
      ]);
    }).toErrorDev(
      [
        'Did not expect server HTML to contain a <p> in <div>.',
        'An error occurred during hydration. The server HTML was replaced with client content in <div>.',
      ],
      {withoutStack: 1},
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>Client and server</p>
      </div>,
    );
  });

  // @gate experimental && enableClientRenderFallbackOnTextMismatch && enableClientRenderFallbackOnHydrationMismatch
  it('#24384: Suspending should halt hydration warnings while still allowing siblings to warm up', async () => {
    const makeApp = () => {
      let resolve, resolved;
      const promise = new Promise(r => {
        resolve = () => {
          resolved = true;
          return r();
        };
      });
      function ComponentThatSuspends() {
        if (!resolved) {
          throw promise;
        }
        return <p>A</p>;
      }

      const App = ({text}) => {
        return (
          <div>
            <Suspense fallback={<h1>Loading...</h1>}>
              <ComponentThatSuspends />
              <h2 name={text}>{text}</h2>
            </Suspense>
          </div>
        );
      };

      return [App, resolve];
    };

    const [ServerApp, serverResolve] = makeApp();
    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <ServerApp text="initial" />,
      );
      pipe(writable);
    });
    await act(() => {
      serverResolve();
    });

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="initial">initial</h2>
      </div>,
    );

    // the client app is rendered with an intentionally incorrect text. The still Suspended component causes
    // hydration to fail silently (allowing for cache warming but otherwise skipping this boundary) until it
    // resolves.
    const [ClientApp, clientResolve] = makeApp();
    ReactDOMClient.hydrateRoot(container, <ClientApp text="replaced" />, {
      onRecoverableError(error) {
        Scheduler.unstable_yieldValue(
          'Logged recoverable error: ' + error.message,
        );
      },
    });
    Scheduler.unstable_flushAll();

    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="initial">initial</h2>
      </div>,
    );

    // Now that the boundary resolves to it's children the hydration completes and discovers that there is a mismatch requiring
    // client-side rendering.
    await clientResolve();
    expect(() => {
      expect(Scheduler).toFlushAndYield([
        'Logged recoverable error: Text content does not match server-rendered HTML.',
        'Logged recoverable error: There was an error while hydrating this Suspense boundary. Switched to client rendering.',
      ]);
    }).toErrorDev(
      'Warning: Prop `name` did not match. Server: "initial" Client: "replaced"',
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>A</p>
        <h2 name="replaced">replaced</h2>
      </div>,
    );

    expect(Scheduler).toFlushAndYield([]);
  });

  // @gate experimental && enableClientRenderFallbackOnTextMismatch && enableClientRenderFallbackOnHydrationMismatch
  it('only warns once on hydration mismatch while within a suspense boundary', async () => {
    const originalConsoleError = console.error;
    const mockError = jest.fn();
    console.error = (...args) => {
      mockError(...args.map(normalizeCodeLocInfo));
    };

    const App = ({text}) => {
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <h2>{text}</h2>
            <h2>{text}</h2>
            <h2>{text}</h2>
          </Suspense>
        </div>
      );
    };

    try {
      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <App text="initial" />,
        );
        pipe(writable);
      });

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h2>initial</h2>
          <h2>initial</h2>
          <h2>initial</h2>
        </div>,
      );

      ReactDOMClient.hydrateRoot(container, <App text="replaced" />, {
        onRecoverableError(error) {
          Scheduler.unstable_yieldValue(
            'Logged recoverable error: ' + error.message,
          );
        },
      });
      expect(Scheduler).toFlushAndYield([
        'Logged recoverable error: Text content does not match server-rendered HTML.',
        'Logged recoverable error: Text content does not match server-rendered HTML.',
        'Logged recoverable error: Text content does not match server-rendered HTML.',
        'Logged recoverable error: There was an error while hydrating this Suspense boundary. Switched to client rendering.',
      ]);

      expect(getVisibleChildren(container)).toEqual(
        <div>
          <h2>replaced</h2>
          <h2>replaced</h2>
          <h2>replaced</h2>
        </div>,
      );

      expect(Scheduler).toFlushAndYield([]);
      expect(mockError.mock.calls.length).toBe(1);
      expect(mockError.mock.calls[0]).toEqual([
        'Warning: Text content did not match. Server: "%s" Client: "%s"%s',
        'initial',
        'replaced',
        '\n' +
          '    in h2 (at **)\n' +
          '    in Suspense (at **)\n' +
          '    in div (at **)\n' +
          '    in App (at **)',
      ]);
    } finally {
      console.error = originalConsoleError;
    }
  });
});
