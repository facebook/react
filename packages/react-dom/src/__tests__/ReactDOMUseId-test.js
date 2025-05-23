/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment ./scripts/jest/ReactDOMServerIntegrationEnvironment
 */

let JSDOM;
let React;
let ReactDOMClient;
let clientAct;
let ReactDOMFizzServer;
let Stream;
let Suspense;
let useId;
let useState;
let document;
let writable;
let container;
let buffer = '';
let hasErrored = false;
let fatalError = undefined;
let waitForPaint;

describe('useId', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    clientAct = require('internal-test-utils').act;
    ReactDOMFizzServer = require('react-dom/server');
    Stream = require('stream');
    Suspense = React.Suspense;
    useId = React.useId;
    useState = React.useState;

    const InternalTestUtils = require('internal-test-utils');
    waitForPaint = InternalTestUtils.waitForPaint;

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

  async function serverAct(callback) {
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

  function normalizeTreeIdForTesting(id) {
    const result = id.match(/\u00AB(R|r)([a-z0-9]*)(H([0-9]*))?\u00BB/);
    if (result === undefined) {
      throw new Error('Invalid id format');
    }
    const [, serverClientPrefix, base32, hookIndex] = result;
    if (serverClientPrefix.endsWith('r')) {
      // Client ids aren't stable. For testing purposes, strip out the counter.
      return (
        'CLIENT_GENERATED_ID' +
        (hookIndex !== undefined ? ` (${hookIndex})` : '')
      );
    }
    // Formats the tree id as a binary sequence, so it's easier to visualize
    // the structure.
    return (
      parseInt(base32, 32).toString(2) +
      (hookIndex !== undefined ? ` (${hookIndex})` : '')
    );
  }

  function DivWithId({children}) {
    const id = normalizeTreeIdForTesting(useId());
    return <div id={id}>{children}</div>;
  }

  it('basic example', async () => {
    function App() {
      return (
        <div>
          <div>
            <DivWithId />
            <DivWithId />
          </div>
          <DivWithId />
        </div>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    await clientAct(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <div>
          <div>
            <div
              id="101"
            />
            <div
              id="1001"
            />
          </div>
          <div
            id="10"
          />
        </div>
      </div>
    `);
  });

  it('indirections', async () => {
    function App() {
      // There are no forks in this tree, but the parent and the child should
      // have different ids.
      return (
        <DivWithId>
          <div>
            <div>
              <div>
                <DivWithId />
              </div>
            </div>
          </div>
        </DivWithId>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    await clientAct(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <div
          id="0"
        >
          <div>
            <div>
              <div>
                <div
                  id="1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  it('StrictMode double rendering', async () => {
    const {StrictMode} = React;

    function App() {
      return (
        <StrictMode>
          <DivWithId />
        </StrictMode>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    await clientAct(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <div
          id="0"
        />
      </div>
    `);
  });

  it('empty (null) children', async () => {
    // We don't treat empty children different from non-empty ones, which means
    // they get allocated a slot when generating ids. There's no inherent reason
    // to do this; Fiber happens to allocate a fiber for null children that
    // appear in a list, which is not ideal for performance. For the purposes
    // of id generation, though, what matters is that Fizz and Fiber
    // are consistent.
    function App() {
      return (
        <>
          {null}
          <DivWithId />
          {null}
          <DivWithId />
        </>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    await clientAct(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <div
          id="10"
        />
        <div
          id="100"
        />
      </div>
    `);
  });

  it('large ids', async () => {
    // The component in this test outputs a recursive tree of nodes with ids,
    // where the underlying binary representation is an alternating series of 1s
    // and 0s. In other words, they are all of the form 101010101.
    //
    // Because we use base 32 encoding, the resulting id should consist of
    // alternating 'a' (01010) and 'l' (10101) characters, except for the the
    // 'R:' prefix, and the first character after that, which may not correspond
    // to a complete set of 5 bits.
    //
    // Example: «Rclalalalalalalala...:
    //
    // We can use this pattern to test large ids that exceed the bitwise
    // safe range (32 bits). The algorithm should theoretically support ids
    // of any size.

    function Child({children}) {
      const id = useId();
      return <div id={id}>{children}</div>;
    }

    function App() {
      let tree = <Child />;
      for (let i = 0; i < 50; i++) {
        tree = (
          <>
            <Child />
            {tree}
          </>
        );
      }
      return tree;
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    await clientAct(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    const divs = container.querySelectorAll('div');

    // Confirm that every id matches the expected pattern
    for (let i = 0; i < divs.length; i++) {
      // Example: «Rclalalalalalalala...:
      expect(divs[i].id).toMatch(/^\u00ABR.(((al)*a?)((la)*l?))*\u00BB$/);
    }
  });

  it('multiple ids in a single component', async () => {
    function App() {
      const id1 = useId();
      const id2 = useId();
      const id3 = useId();
      return `${id1}, ${id2}, ${id3}`;
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    await clientAct(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    // We append a suffix to the end of the id to distinguish them
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        «R0», «R0H1», «R0H2»
      </div>
    `);
  });

  it('local render phase updates', async () => {
    function App({swap}) {
      const [count, setCount] = useState(0);
      if (count < 3) {
        setCount(count + 1);
      }
      return useId();
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    await clientAct(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        «R0»
      </div>
    `);
  });

  it('basic incremental hydration', async () => {
    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <DivWithId label="A" />
            <DivWithId label="B" />
          </Suspense>
          <DivWithId label="C" />
        </div>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    await clientAct(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <div>
          <!--$-->
          <div
            id="101"
          />
          <div
            id="1001"
          />
          <!--/$-->
          <div
            id="10"
          />
        </div>
      </div>
    `);
  });

  it('inserting/deleting siblings outside a dehydrated Suspense boundary', async () => {
    const span = React.createRef(null);
    function App({swap}) {
      // Note: Using a dynamic array so these are treated as insertions and
      // deletions instead of updates, because Fiber currently allocates a node
      // even for empty children.
      const children = [
        <DivWithId key="A" />,
        swap ? <DivWithId key="C" /> : <DivWithId key="B" />,
        <DivWithId key="D" />,
      ];
      return (
        <>
          {children}
          <Suspense key="boundary" fallback="Loading...">
            <DivWithId />
            <span ref={span} />
          </Suspense>
        </>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    const dehydratedSpan = container.getElementsByTagName('span')[0];
    await clientAct(async () => {
      const root = ReactDOMClient.hydrateRoot(container, <App />);
      await waitForPaint([]);
      expect(container).toMatchInlineSnapshot(`
        <div
          id="container"
        >
          <div
            id="101"
          />
          <div
            id="1001"
          />
          <div
            id="1101"
          />
          <!--$-->
          <div
            id="110"
          />
          <span />
          <!--/$-->
        </div>
      `);

      // The inner boundary hasn't hydrated yet
      expect(span.current).toBe(null);

      // Swap B for C
      root.render(<App swap={true} />);
    });
    // The swap should not have caused a mismatch.
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <div
          id="101"
        />
        <div
          id="CLIENT_GENERATED_ID"
        />
        <div
          id="1101"
        />
        <!--$-->
        <div
          id="110"
        />
        <span />
        <!--/$-->
      </div>
    `);
    // Should have hydrated successfully
    expect(span.current).toBe(dehydratedSpan);
  });

  it('inserting/deleting siblings inside a dehydrated Suspense boundary', async () => {
    const span = React.createRef(null);
    function App({swap}) {
      // Note: Using a dynamic array so these are treated as insertions and
      // deletions instead of updates, because Fiber currently allocates a node
      // even for empty children.
      const children = [
        <DivWithId key="A" />,
        swap ? <DivWithId key="C" /> : <DivWithId key="B" />,
        <DivWithId key="D" />,
      ];
      return (
        <Suspense key="boundary" fallback="Loading...">
          {children}
          <span ref={span} />
        </Suspense>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    const dehydratedSpan = container.getElementsByTagName('span')[0];
    await clientAct(async () => {
      const root = ReactDOMClient.hydrateRoot(container, <App />);
      await waitForPaint([]);
      expect(container).toMatchInlineSnapshot(`
        <div
          id="container"
        >
          <!--$-->
          <div
            id="101"
          />
          <div
            id="1001"
          />
          <div
            id="1101"
          />
          <span />
          <!--/$-->
        </div>
      `);

      // The inner boundary hasn't hydrated yet
      expect(span.current).toBe(null);

      // Swap B for C
      root.render(<App swap={true} />);
    });
    // The swap should not have caused a mismatch.
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <!--$-->
        <div
          id="101"
        />
        <div
          id="CLIENT_GENERATED_ID"
        />
        <div
          id="1101"
        />
        <span />
        <!--/$-->
      </div>
    `);
    // Should have hydrated successfully
    expect(span.current).toBe(dehydratedSpan);
  });

  it('identifierPrefix option', async () => {
    function Child() {
      const id = useId();
      return <div>{id}</div>;
    }

    function App({showMore}) {
      return (
        <>
          <Child />
          <Child />
          {showMore && <Child />}
        </>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />, {
        identifierPrefix: 'custom-prefix-',
      });
      pipe(writable);
    });
    let root;
    await clientAct(async () => {
      root = ReactDOMClient.hydrateRoot(container, <App />, {
        identifierPrefix: 'custom-prefix-',
      });
    });
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <div>
          «custom-prefix-R1»
        </div>
        <div>
          «custom-prefix-R2»
        </div>
      </div>
    `);

    // Mount a new, client-only id
    await clientAct(async () => {
      root.render(<App showMore={true} />);
    });
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <div>
          «custom-prefix-R1»
        </div>
        <div>
          «custom-prefix-R2»
        </div>
        <div>
          «custom-prefix-r0»
        </div>
      </div>
    `);
  });

  // https://github.com/vercel/next.js/issues/43033
  // re-rendering in strict mode caused the localIdCounter to be reset but it the rerender hook does not
  // increment it again. This only shows up as a problem for subsequent useId's because it affects child
  // and sibling counters not the initial one
  it('does not forget it mounted an id when re-rendering in dev', async () => {
    function Parent() {
      const id = useId();
      return (
        <div>
          {id} <Child />
        </div>
      );
    }
    function Child() {
      const id = useId();
      return <div>{id}</div>;
    }

    function App({showMore}) {
      return (
        <React.StrictMode>
          <Parent />
        </React.StrictMode>
      );
    }

    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <div>
          «R0»
          <!-- -->
           
          <div>
            «R7»
          </div>
        </div>
      </div>
    `);

    await clientAct(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    expect(container).toMatchInlineSnapshot(`
      <div
        id="container"
      >
        <div>
          «R0»
          <!-- -->
           
          <div>
            «R7»
          </div>
        </div>
      </div>
    `);
  });
});
