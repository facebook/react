/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

let JSDOM;
let Scheduler;
let React;
let ReactDOMClient;
let ReactDOMFizzServer;
let container;
let document;
let writable;
let buffer;
let hasErrored;
let Stream;
let fatalError;

describe('ReactDOMResources', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    Scheduler = require('scheduler');
    Stream = require('stream');
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ReactDOMFizzServer = require('react-dom/server');

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

  async function actIntoEmptyDocument(callback) {
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
    // Test Environment
    const jsdom = new JSDOM(bufferedContent, {
      runScripts: 'dangerously',
    });
    document = jsdom.window.document;
    container = document;
    buffer = '';
  }

  async function actInto(callback, prelude, getContainer) {
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
    // Test Environment
    const jsdom = new JSDOM(prelude + bufferedContent, {
      runScripts: 'dangerously',
    });
    document = jsdom.window.document;
    container = getContainer(document);
    buffer = '';
  }

  // async function act(callback) {
  //   await callback();
  //   // Await one turn around the event loop.
  //   // This assumes that we'll flush everything we have so far.
  //   await new Promise(resolve => {
  //     setImmediate(resolve);
  //   });
  //   if (hasErrored) {
  //     throw fatalError;
  //   }
  //   // JSDOM doesn't support stream HTML parser so we need to give it a proper fragment.
  //   // We also want to execute any scripts that are embedded.
  //   // We assume that we have now received a proper fragment of HTML.
  //   const bufferedContent = buffer;
  //   buffer = '';
  //   const fakeBody = document.createElement('body');
  //   fakeBody.innerHTML = bufferedContent;
  //   while (fakeBody.firstChild) {
  //     const node = fakeBody.firstChild;
  //     if (
  //       node.nodeName === 'SCRIPT' &&
  //       (CSPnonce === null || node.getAttribute('nonce') === CSPnonce)
  //     ) {
  //       const script = document.createElement('script');
  //       script.textContent = node.textContent;
  //       fakeBody.removeChild(node);
  //       container.appendChild(script);
  //     } else {
  //       container.appendChild(node);
  //     }
  //   }
  // }

  // @gate enableFloat
  it('hoists resources to the head if the container is a Document without hydration', async () => {
    function App() {
      return (
        <>
          <html>
            <head />
            <body>
              <link rel="stylesheet" href="foo" />
              <div>hello world</div>
            </body>
            <link rel="stylesheet" href="bar" />
          </html>
        </>
      );
    }

    await actInto(
      async () => {},
      '<!DOCTYPE html><html><head></head><body>this will be replaced on root.render</body></html>',
      doc => doc,
    );

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>this will be replaced on root.render</body>
      </html>,
    );

    const root = ReactDOMClient.createRoot(container);
    root.render(<App />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" />
          <link rel="stylesheet" href="bar" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('hoists resources to the head if the container is a Document with hydration', async () => {
    function App() {
      return (
        <>
          <html>
            <head />
            <body>
              <link rel="stylesheet" href="foo" />
              <div>hello world</div>
            </body>
            <link rel="stylesheet" href="bar" />
          </html>
        </>
      );
    }

    await actIntoEmptyDocument(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" />
          <link rel="stylesheet" href="bar" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );

    ReactDOMClient.hydrateRoot(container, <App />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" />
          <link rel="stylesheet" href="bar" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('hoists resources to the head if the container is the documentElement without hydration', async () => {
    function App() {
      return (
        <>
          <link rel="stylesheet" href="foo" />
          <head />
          <body>
            <link rel="stylesheet" href="bar" />
            <div>hello world</div>
          </body>
        </>
      );
    }

    await actInto(
      async () => {},
      '<!DOCTYPE html><html><head></head><body>this will be replaced on root.render</body></html>',
      doc => doc.documentElement,
    );

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>this will be replaced on root.render</body>
      </html>,
    );

    const root = ReactDOMClient.createRoot(container);
    root.render(<App />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" />
          <link rel="stylesheet" href="bar" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('hoists resources to the head if the container is the documentElement with hydration', async () => {
    function App() {
      return (
        <>
          <link rel="stylesheet" href="foo" />
          <head />
          <body>
            <link rel="stylesheet" href="bar" />
            <div>hello world</div>
          </body>
        </>
      );
    }

    await actInto(
      async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      },
      '<!DOCTYPE html><html>',
      doc => doc.documentElement,
    );

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" />
          <link rel="stylesheet" href="bar" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );

    ReactDOMClient.hydrateRoot(container, <App />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" />
          <link rel="stylesheet" href="bar" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('hoists resources to the head when the container is an Element (other than the documentElement) without hydration', async () => {
    function App() {
      return (
        <>
          <link rel="stylesheet" href="foo" />
          <div>hello world</div>
          <link rel="stylesheet" href="bar" />
        </>
      );
    }

    await actInto(
      async () => {},
      '<!DOCTYPE html><html><head></head><body><div id="container"><link rel="stylesheet" href="willbereplaced"></div></body></html>',
      doc => doc.getElementById('container'),
    );
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div id="container">
            <link rel="stylesheet" href="willbereplaced" />
          </div>
        </body>
      </html>,
    );

    const root = ReactDOMClient.createRoot(container);
    root.render(<App />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" />
          <link rel="stylesheet" href="bar" />
        </head>
        <body>
          <div id="container">
            <div>hello world</div>
          </div>
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('hoists resources to the container when it is an Element (other than the documentElement) with hydration', async () => {
    function App() {
      return (
        <>
          <link rel="stylesheet" href="foo" />
          <div>hello world</div>
          <link rel="stylesheet" href="bar" />
        </>
      );
    }

    await actInto(
      async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      },
      '<!DOCTYPE html><html><head><link rel="stylesheet" href="willberetained"></head><body><div id="container">',
      doc => doc.getElementById('container'),
    );
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="willberetained" />
        </head>
        <body>
          <div id="container">
            <link rel="stylesheet" href="foo" />
            <link rel="stylesheet" href="bar" />
            <div>hello world</div>
          </div>
        </body>
      </html>,
    );

    ReactDOMClient.hydrateRoot(container, <App />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="willberetained" />
        </head>
        <body>
          <div id="container">
            <div>hello world</div>
            <link rel="stylesheet" href="foo" />
            <link rel="stylesheet" href="bar" />
          </div>
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('removes resources that no longer have any referrers', async () => {
    if (gate(flags => !flags.enableFloat)) {
      throw new Error(
        'This test fails to fail properly when the flag is false. It errors but for some reason jest still thinks it did not fail properly',
      );
    }
    function App({exclude, isClient, multiple}) {
      return (
        <>
          {!isClient ? <link rel="stylesheet" href="serveronly" /> : null}
          <link rel="stylesheet" href="serverandclient" />
          <html>
            <head />
            <body>
              {exclude ? null : <link rel="stylesheet" href="clientonly" />}
              <div>hello world</div>
              {new Array(multiple || 0).fill(0).map((_, i) => (
                <link key={i} rel="stylesheet" href="multiple" />
              ))}
            </body>
          </html>
        </>
      );
    }

    await actIntoEmptyDocument(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="serveronly" />
          <link rel="stylesheet" href="serverandclient" />
          <link rel="stylesheet" href="clientonly" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );

    const root = ReactDOMClient.hydrateRoot(container, <App isClient={true} />);
    expect(Scheduler).toFlushWithoutYielding();
    // "serveronly" is removed because it is not referred to by any HostResource
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="serverandclient" />
          <link rel="stylesheet" href="clientonly" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );

    root.render(<App exclude={true} isClient={true} />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="serverandclient" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );

    root.render(<App exclude={true} isClient={true} multiple={3} />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="serverandclient" />
          <link rel="stylesheet" href="multiple" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );

    root.render(<App exclude={true} isClient={true} multiple={1} />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="serverandclient" />
          <link rel="stylesheet" href="multiple" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );

    root.render(<App exclude={true} isClient={true} multiple={0} />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="serverandclient" />
        </head>
        <body>
          <div>hello world</div>
        </body>
      </html>,
    );
  });
});
