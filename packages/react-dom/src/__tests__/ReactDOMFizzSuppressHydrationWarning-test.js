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
let React;
let ReactDOMClient;
let ReactDOMFizzServer;
let document;
let writable;
let container;
let buffer = '';
let hasErrored = false;
let fatalError = undefined;

describe('ReactDOMFizzServer', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    Scheduler = require('scheduler');
    React = require('react');
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
          <span
            suppressHydrationWarning={true}
            data-attr={isClient ? 'client-attr' : 'server-attr'}>
            {isClient ? 'Client Text' : 'Server Text'}
          </span>
          <span suppressHydrationWarning={true}>{isClient ? 2 : 1}</span>
          <span suppressHydrationWarning={true}>
            hello,{isClient ? 'client' : 'server'}
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
        <span data-attr="server-attr">Server Text</span>
        <span>1</span>
        <span>
          {'hello,'}
          {'server'}
        </span>
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
    // The attribute mismatch should be ignored and not fixed.
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <span data-attr="server-attr">Client Text</span>
        <span>2</span>
        <span>
          {'hello,'}
          {'client'}
        </span>
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
  it('does not suppress insertions with suppressHydrationWarning', async () => {
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
        'An error occurred during hydration. The server HTML was replaced with client content in <div>.',
      ],
      {withoutStack: true},
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>Client and server</p>
        <p>Client only</p>
      </div>,
    );
  });

  // @gate experimental
  it('does not suppress deletions with suppressHydrationWarning', async () => {
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
        'An error occurred during hydration. The server HTML was replaced with client content in <div>.',
      ],
      {withoutStack: true},
    );
    expect(getVisibleChildren(container)).toEqual(
      <div>
        <p>Client and server</p>
      </div>,
    );
  });
});
