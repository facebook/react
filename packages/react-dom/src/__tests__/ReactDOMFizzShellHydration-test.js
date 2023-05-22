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
let startTransition;
let ReactDOMClient;
let Scheduler;
let clientAct;
let ReactDOMFizzServer;
let Stream;
let document;
let writable;
let container;
let buffer = '';
let hasErrored = false;
let fatalError = undefined;
let textCache;
let assertLog;

describe('ReactDOMFizzShellHydration', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
    clientAct = require('internal-test-utils').act;
    ReactDOMFizzServer = require('react-dom/server');
    Stream = require('stream');

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;

    startTransition = React.startTransition;

    textCache = new Map();

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

  afterEach(() => {
    jest.restoreAllMocks();
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

  function resolveText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'resolved',
        value: text,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'resolved';
      record.value = text;
      thenable.pings.forEach(t => t());
    }
  }

  function readText(text) {
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      Scheduler.log(`Suspend! [${text}]`);

      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };

      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.set(text, newRecord);

      throw thenable;
    }
  }

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  function AsyncText({text}) {
    readText(text);
    Scheduler.log(text);
    return text;
  }

  function resetTextCache() {
    textCache = new Map();
  }

  test('suspending in the shell during hydration', async () => {
    const div = React.createRef(null);

    function App() {
      return (
        <div ref={div}>
          <AsyncText text="Shell" />
        </div>
      );
    }

    // Server render
    await resolveText('Shell');
    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    assertLog(['Shell']);
    const dehydratedDiv = container.getElementsByTagName('div')[0];

    // Clear the cache and start rendering on the client
    resetTextCache();

    // Hydration suspends because the data for the shell hasn't loaded yet
    await clientAct(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });
    assertLog(['Suspend! [Shell]']);
    expect(div.current).toBe(null);
    expect(container.textContent).toBe('Shell');

    // The shell loads and hydration finishes
    await clientAct(async () => {
      await resolveText('Shell');
    });
    assertLog(['Shell']);
    expect(div.current).toBe(dehydratedDiv);
    expect(container.textContent).toBe('Shell');
  });

  test('suspending in the shell during a normal client render', async () => {
    // Same as previous test but during a normal client render, no hydration
    function App() {
      return <AsyncText text="Shell" />;
    }

    const root = ReactDOMClient.createRoot(container);
    await clientAct(async () => {
      root.render(<App />);
    });
    assertLog(['Suspend! [Shell]']);

    await clientAct(async () => {
      await resolveText('Shell');
    });
    assertLog(['Shell']);
    expect(container.textContent).toBe('Shell');
  });

  test(
    'updating the root at lower priority than initial hydration does not ' +
      'force a client render',
    async () => {
      function App() {
        return <Text text="Initial" />;
      }

      // Server render
      await resolveText('Initial');
      await serverAct(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });
      assertLog(['Initial']);

      await clientAct(async () => {
        const root = ReactDOMClient.hydrateRoot(container, <App />);
        // This has lower priority than the initial hydration, so the update
        // won't be processed until after hydration finishes.
        startTransition(() => {
          root.render(<Text text="Updated" />);
        });
      });
      assertLog(['Initial', 'Updated']);
      expect(container.textContent).toBe('Updated');
    },
  );

  test('updating the root while the shell is suspended forces a client render', async () => {
    function App() {
      return <AsyncText text="Shell" />;
    }

    // Server render
    await resolveText('Shell');
    await serverAct(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    assertLog(['Shell']);

    // Clear the cache and start rendering on the client
    resetTextCache();

    // Hydration suspends because the data for the shell hasn't loaded yet
    const root = await clientAct(async () => {
      return ReactDOMClient.hydrateRoot(container, <App />, {
        onRecoverableError(error) {
          Scheduler.log(error.message);
        },
      });
    });
    assertLog(['Suspend! [Shell]']);
    expect(container.textContent).toBe('Shell');

    await clientAct(async () => {
      root.render(<Text text="New screen" />);
    });
    assertLog([
      'New screen',
      'This root received an early update, before anything was able ' +
        'hydrate. Switched the entire root to client rendering.',
    ]);
    expect(container.textContent).toBe('New screen');
  });

  test('TODO: A large component stack causes SSR to stack overflow', async () => {
    spyOnDevAndProd(console, 'error').mockImplementation(() => {});

    function NestedComponent({depth}: {depth: number}) {
      if (depth <= 0) {
        return <AsyncText text="Shell" />;
      }
      return <NestedComponent depth={depth - 1} />;
    }

    // Server render
    await serverAct(async () => {
      ReactDOMFizzServer.renderToPipeableStream(
        <NestedComponent depth={3000} />,
      );
    });
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error.mock.calls[0][0].toString()).toBe(
      'RangeError: Maximum call stack size exceeded',
    );
  });
});
