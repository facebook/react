/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;

let act;
let container;
let React;
let ReactDOMServer;
let ReactDOMClient;

describe('ReactDOMFizzForm', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMServer = require('react-dom/server.browser');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function submit(submitter) {
    const form = submitter.form || submitter;
    if (!submitter.form) {
      submitter = undefined;
    }
    const submitEvent = new Event('submit', {bubbles: true, cancelable: true});
    submitEvent.submitter = submitter;
    const returnValue = form.dispatchEvent(submitEvent);
    if (!returnValue) {
      return;
    }
    const action =
      (submitter && submitter.getAttribute('formaction')) || form.action;
    if (!/\s*javascript:/i.test(action)) {
      throw new Error('Navigate to: ' + action);
    }
  }

  async function readIntoContainer(stream) {
    const reader = stream.getReader();
    let result = '';
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }
      result += Buffer.from(value).toString('utf8');
    }
    container.innerHTML = result;
  }

  // @gate enableFormActions
  it('should allow passing a function to form action during SSR', async () => {
    const ref = React.createRef();
    let foo;

    function action(formData) {
      foo = formData.get('foo');
    }
    function App() {
      return (
        <form action={action} ref={ref}>
          <input type="text" name="foo" defaultValue="bar" />
        </form>
      );
    }

    const stream = await ReactDOMServer.renderToReadableStream(<App />);
    await readIntoContainer(stream);
    await act(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });

    submit(ref.current);

    expect(foo).toBe('bar');
  });

  // @gate enableFormActions
  it('should allow passing a function to an input/button formAction', async () => {
    const inputRef = React.createRef();
    const buttonRef = React.createRef();
    let rootActionCalled = false;
    let savedTitle = null;
    let deletedTitle = null;

    function action(formData) {
      rootActionCalled = true;
    }

    function saveItem(formData) {
      savedTitle = formData.get('title');
    }

    function deleteItem(formData) {
      deletedTitle = formData.get('title');
    }

    function App() {
      return (
        <form action={action}>
          <input type="text" name="title" defaultValue="Hello" />
          <input
            type="submit"
            formAction={saveItem}
            value="Save"
            ref={inputRef}
          />
          <button formAction={deleteItem} ref={buttonRef}>
            Delete
          </button>
        </form>
      );
    }

    const stream = await ReactDOMServer.renderToReadableStream(<App />);
    await readIntoContainer(stream);
    await act(async () => {
      ReactDOMClient.hydrateRoot(container, <App />);
    });

    expect(savedTitle).toBe(null);
    expect(deletedTitle).toBe(null);

    submit(inputRef.current);
    expect(savedTitle).toBe('Hello');
    expect(deletedTitle).toBe(null);
    savedTitle = null;

    submit(buttonRef.current);
    expect(savedTitle).toBe(null);
    expect(deletedTitle).toBe('Hello');
    deletedTitle = null;

    expect(rootActionCalled).toBe(false);
  });

  // @gate enableFormActions || !__DEV__
  it('should warn when passing a function action during SSR and string during hydration', async () => {
    function action(formData) {}
    function App({isClient}) {
      return (
        <form action={isClient ? 'action' : action}>
          <input type="text" name="foo" defaultValue="bar" />
        </form>
      );
    }

    const stream = await ReactDOMServer.renderToReadableStream(<App />);
    await readIntoContainer(stream);
    await expect(async () => {
      await act(async () => {
        ReactDOMClient.hydrateRoot(container, <App isClient={true} />);
      });
    }).toErrorDev(
      'Prop `action` did not match. Server: "function" Client: "action"',
    );
  });

  // @gate enableFormActions || !__DEV__
  it('should warn when passing a string during SSR and function during hydration', async () => {
    function action(formData) {}
    function App({isClient}) {
      return (
        <form action={isClient ? action : 'action'}>
          <input type="text" name="foo" defaultValue="bar" />
        </form>
      );
    }

    const stream = await ReactDOMServer.renderToReadableStream(<App />);
    await readIntoContainer(stream);
    await expect(async () => {
      await act(async () => {
        ReactDOMClient.hydrateRoot(container, <App isClient={true} />);
      });
    }).toErrorDev(
      'Prop `action` did not match. Server: "action" Client: "function action(formData) {}"',
    );
  });
});
