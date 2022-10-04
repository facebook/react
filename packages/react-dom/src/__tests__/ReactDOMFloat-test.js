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
let ReactDOM;
let ReactDOMClient;
let ReactDOMFizzServer;
let Suspense;
let textCache;
let document;
let writable;
const CSPnonce = null;
let container;
let buffer = '';
let hasErrored = false;
let fatalError = undefined;

describe('ReactDOMFloat', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    Scheduler = require('scheduler');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactDOMFizzServer = require('react-dom/server');
    Stream = require('stream');
    Suspense = React.Suspense;

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

  function normalizeCodeLocInfo(str) {
    return (
      typeof str === 'string' &&
      str.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function(m, name) {
        return '\n    in ' + name + ' (at **)';
      })
    );
  }

  function componentStack(components) {
    return components
      .map(component => `\n    in ${component} (at **)`)
      .join('');
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
    const parent =
      container.nodeName === '#document' ? container.body : container;
    while (fakeBody.firstChild) {
      const node = fakeBody.firstChild;
      if (
        node.nodeName === 'SCRIPT' &&
        (CSPnonce === null || node.getAttribute('nonce') === CSPnonce)
      ) {
        const script = document.createElement('script');
        script.textContent = node.textContent;
        fakeBody.removeChild(node);
        parent.appendChild(script);
      } else {
        parent.appendChild(node);
      }
    }
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

  function AsyncText({text}) {
    return readText(text);
  }

  // @gate enableFloat
  it('errors if the document does not contain a head when inserting a resource', async () => {
    document.head.parentNode.removeChild(document.head);
    const root = ReactDOMClient.createRoot(document);
    root.render(
      <html>
        <body>
          <link rel="stylesheet" href="foo" precedence="default" />
          foo
        </body>
      </html>,
    );
    expect(() => {
      expect(Scheduler).toFlushWithoutYielding();
    }).toThrow(
      'While attempting to insert a Resource, React expected the Document to contain a head element but it was not found.',
    );
  });

  describe('HostResource', () => {
    // @gate enableFloat
    it('warns when you update props to an invalid type', async () => {
      const root = ReactDOMClient.createRoot(container);
      root.render(
        <div>
          <link rel="stylesheet" href="foo" precedence="foo" />
        </div>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      root.render(
        <div>
          <link rel="author" href="bar" />
        </div>,
      );
      expect(() => {
        expect(Scheduler).toFlushWithoutYielding();
      }).toErrorDev(
        'Warning: A <link> previously rendered as a Resource with href "foo" but was updated with a rel type that is not' +
          ' valid for a Resource type. Generally Resources are not expected to ever have updated' +
          ' props however in some limited circumstances it can be valid when changing the href.' +
          ' When React encounters props that invalidate the Resource it is the same as not rendering' +
          ' a Resource at all. valid rel types for Resources are "font" and "style". The previous' +
          ' rel for this instance was "stylesheet". The updated rel is "author" and the updated href is "bar".',
      );
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-rprec="foo" />
            <link rel="preload" as="style" href="foo" />
          </head>
          <body>
            <div id="container">
              <div />
            </div>
          </body>
        </html>,
      );
    });
  });

  describe('ReactDOM.preload', () => {
    // @gate enableFloat
    it('inserts a preload resource into the stream when called during server rendering', async () => {
      function Component() {
        ReactDOM.preload('foo', {as: 'style'});
        return 'foo';
      }
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <Component />
            </body>
          </html>,
        );
        pipe(writable);
      });
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="foo" />
          </head>
          <body>foo</body>
        </html>,
      );
    });

    // @gate enableFloat
    it('inserts a preload resource into the document during render when called during client rendering', async () => {
      function Component() {
        ReactDOM.preload('foo', {as: 'style'});
        return 'foo';
      }
      const root = ReactDOMClient.createRoot(container);
      root.render(<Component />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="foo" />
          </head>
          <body>
            <div id="container">foo</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('inserts a preload resource when called in a layout effect', async () => {
      function App() {
        React.useLayoutEffect(() => {
          ReactDOM.preload('foo', {as: 'style'});
        }, []);
        return 'foobar';
      }
      const root = ReactDOMClient.createRoot(container);
      root.render(<App />);
      expect(Scheduler).toFlushWithoutYielding();

      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="foo" />
          </head>
          <body>
            <div id="container">foobar</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('inserts a preload resource when called in a passive effect', async () => {
      function App() {
        React.useEffect(() => {
          ReactDOM.preload('foo', {as: 'style'});
        }, []);
        return 'foobar';
      }
      const root = ReactDOMClient.createRoot(container);
      root.render(<App />);
      expect(Scheduler).toFlushWithoutYielding();

      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="foo" />
          </head>
          <body>
            <div id="container">foobar</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('inserts a preload resource when called in module scope if a root has already been created', async () => {
      // The requirement that a root be created has to do with bootstrapping the dispatcher.
      // We are intentionally avoiding setting it to the default via import due to cycles and
      // we are trying to avoid doing a mutable initailation in module scope.
      ReactDOM.preload('foo', {as: 'style'});
      ReactDOMClient.createRoot(container);
      ReactDOM.preload('bar', {as: 'style'});
      // We need to use global.document because preload falls back
      // to the window.document global when no other documents have been used
      // The way the JSDOM runtim is created for these tests the local document
      // global does not point to the global.document
      expect(getVisibleChildren(global.document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="bar" />
          </head>
          <body />
        </html>,
      );
    });
  });

  describe('ReactDOM.preinit as style', () => {
    // @gate enableFloat
    it('creates a style Resource when called during server rendering before first flush', async () => {
      function Component() {
        ReactDOM.preinit('foo', {as: 'style', precedence: 'foo'});
        return 'foo';
      }
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <Component />
            </body>
          </html>,
        );
        pipe(writable);
      });
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-rprec="foo" />
          </head>
          <body>foo</body>
        </html>,
      );
    });

    // @gate enableFloat
    it('creates a preload Resource when called during server rendering after first flush', async () => {
      function BlockedOn({text, children}) {
        readText(text);
        return children;
      }
      function Component() {
        ReactDOM.preinit('foo', {as: 'style', precedence: 'foo'});
        return 'foo';
      }
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <Suspense fallback="loading...">
                <BlockedOn text="unblock">
                  <Component />
                </BlockedOn>
              </Suspense>
            </body>
          </html>,
        );
        pipe(writable);
      });
      await act(() => {
        resolveText('unblock');
      });
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head />
          <body>
            foo
            <link rel="preload" as="style" href="foo" />
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('inserts a style Resource into the document during render when called during client rendering', async () => {
      function Component() {
        ReactDOM.preinit('foo', {as: 'style', precedence: 'foo'});
        return 'foo';
      }
      const root = ReactDOMClient.createRoot(container);
      root.render(<Component />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-rprec="foo" />
          </head>
          <body>
            <div id="container">foo</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('inserts a preload resource into the document when called in an insertion effect, layout effect, or passive effect', async () => {
      function App() {
        React.useEffect(() => {
          ReactDOM.preinit('passive', {as: 'style', precedence: 'default'});
        }, []);
        React.useLayoutEffect(() => {
          ReactDOM.preinit('layout', {as: 'style', precedence: 'default'});
        });
        React.useInsertionEffect(() => {
          ReactDOM.preinit('insertion', {as: 'style', precedence: 'default'});
        });
        return 'foobar';
      }
      const root = ReactDOMClient.createRoot(container);
      root.render(<App />);
      expect(Scheduler).toFlushWithoutYielding();

      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="insertion" />
            <link rel="preload" as="style" href="layout" />
            <link rel="preload" as="style" href="passive" />
          </head>
          <body>
            <div id="container">foobar</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('inserts a preload resource when called in module scope', async () => {
      // The requirement that a root be created has to do with bootstrapping the dispatcher.
      // We are intentionally avoiding setting it to the default via import due to cycles and
      // we are trying to avoid doing a mutable initailation in module scope.
      ReactDOM.preinit('foo', {as: 'style'});
      ReactDOMClient.hydrateRoot(container, null);
      ReactDOM.preinit('bar', {as: 'style'});
      // We need to use global.document because preload falls back
      // to the window.document global when no other documents have been used
      // The way the JSDOM runtim is created for these tests the local document
      // global does not point to the global.document
      expect(getVisibleChildren(global.document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="bar" />
          </head>
          <body />
        </html>,
      );
    });
  });

  describe('document encapsulation', () => {
    // @gate enableFloat
    it('can support styles inside portals to a shadowRoot', async () => {
      const shadow = document.body.attachShadow({mode: 'open'});
      const root = ReactDOMClient.createRoot(container);
      root.render(
        <>
          <link rel="stylesheet" href="foo" precedence="default" />
          {ReactDOM.createPortal(
            <div>
              <link
                rel="stylesheet"
                href="foo"
                data-extra-prop="foo"
                precedence="different"
              />
              shadow
            </div>,
            shadow,
          )}
          container
        </>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-rprec="default" />
            <link rel="preload" href="foo" as="style" />
          </head>
          <body>
            <div id="container">container</div>
          </body>
        </html>,
      );
      expect(getVisibleChildren(shadow)).toEqual([
        <link
          rel="stylesheet"
          href="foo"
          data-rprec="different"
          data-extra-prop="foo"
        />,
        <div>shadow</div>,
      ]);
    });
    // @gate enableFloat
    it('can support styles inside portals to an element in shadowRoots', async () => {
      const template = document.createElement('template');
      template.innerHTML =
        "<div><div id='shadowcontainer1'></div><div id='shadowcontainer2'></div></div>";
      const shadow = document.body.attachShadow({mode: 'open'});
      shadow.appendChild(template.content);

      const shadowContainer1 = shadow.getElementById('shadowcontainer1');
      const shadowContainer2 = shadow.getElementById('shadowcontainer2');
      const root = ReactDOMClient.createRoot(container);
      root.render(
        <>
          <link rel="stylesheet" href="foo" precedence="default" />
          {ReactDOM.createPortal(
            <div>
              <link rel="stylesheet" href="foo" precedence="one" />
              <link rel="stylesheet" href="bar" precedence="two" />1
            </div>,
            shadow,
          )}
          {ReactDOM.createPortal(
            <div>
              <link rel="stylesheet" href="foo" precedence="one" />
              <link rel="stylesheet" href="baz" precedence="one" />2
            </div>,
            shadowContainer1,
          )}
          {ReactDOM.createPortal(
            <div>
              <link rel="stylesheet" href="bar" precedence="two" />
              <link rel="stylesheet" href="qux" precedence="three" />3
            </div>,
            shadowContainer2,
          )}
          container
        </>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-rprec="default" />
            <link rel="preload" href="foo" as="style" />
            <link rel="preload" href="bar" as="style" />
            <link rel="preload" href="baz" as="style" />
            <link rel="preload" href="qux" as="style" />
          </head>
          <body>
            <div id="container">container</div>
          </body>
        </html>,
      );
      expect(getVisibleChildren(shadow)).toEqual([
        <link rel="stylesheet" href="foo" data-rprec="one" />,
        <link rel="stylesheet" href="baz" data-rprec="one" />,
        <link rel="stylesheet" href="bar" data-rprec="two" />,
        <link rel="stylesheet" href="qux" data-rprec="three" />,
        <div>
          <div id="shadowcontainer1">
            <div>2</div>
          </div>
          <div id="shadowcontainer2">
            <div>3</div>
          </div>
        </div>,
        <div>1</div>,
      ]);
    });
  });

  describe('style resources', () => {
    // @gate enableFloat
    it('treats link rel stylesheet elements as a style resource when it includes a precedence when server rendering', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <link rel="stylesheet" href="aresource" precedence="foo" />
              <div>hello world</div>
            </body>
          </html>,
        );
        pipe(writable);
      });

      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="aresource" data-rprec="foo" />
          </head>
          <body>
            <div>hello world</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('treats link rel stylesheet elements as a style resource when it includes a precedence when client rendering', async () => {
      const root = ReactDOMClient.createRoot(document);
      root.render(
        <html>
          <head />
          <body>
            <link rel="stylesheet" href="aresource" precedence="foo" />
            <div>hello world</div>
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();

      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="aresource" data-rprec="foo" />
          </head>
          <body>
            <div>hello world</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('treats link rel stylesheet elements as a style resource when it includes a precedence when hydrating', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <link rel="stylesheet" href="aresource" precedence="foo" />
              <div>hello world</div>
            </body>
          </html>,
        );
        pipe(writable);
      });
      ReactDOMClient.hydrateRoot(
        document,
        <html>
          <head />
          <body>
            <link rel="stylesheet" href="aresource" precedence="foo" />
            <div>hello world</div>
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();

      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="aresource" data-rprec="foo" />
          </head>
          <body>
            <div>hello world</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('preloads stylesheets without a precedence prop when server rendering', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <link rel="stylesheet" href="notaresource" />
              <div>hello world</div>
            </body>
          </html>,
        );
        pipe(writable);
      });

      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="notaresource" />
          </head>
          <body>
            <link rel="stylesheet" href="notaresource" />
            <div>hello world</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('hoists style resources to the correct precedence', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <link rel="stylesheet" href="foo1" precedence="foo" />
              <link rel="stylesheet" href="default1" precedence="default" />
              <link rel="stylesheet" href="foo2" precedence="foo" />
              <div>hello world</div>
            </body>
          </html>,
        );
        pipe(writable);
      });
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo1" data-rprec="foo" />
            <link rel="stylesheet" href="foo2" data-rprec="foo" />
            <link rel="stylesheet" href="default1" data-rprec="default" />
          </head>
          <body>
            <div>hello world</div>
          </body>
        </html>,
      );

      ReactDOMClient.hydrateRoot(
        document,
        <html>
          <head />
          <body>
            <link rel="stylesheet" href="bar1" precedence="bar" />
            <link rel="stylesheet" href="foo3" precedence="foo" />
            <link rel="stylesheet" href="default2" precedence="default" />
            <div>hello world</div>
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo1" data-rprec="foo" />
            <link rel="stylesheet" href="foo2" data-rprec="foo" />
            <link rel="stylesheet" href="foo3" data-rprec="foo" />
            <link rel="stylesheet" href="default1" data-rprec="default" />
            <link rel="stylesheet" href="default2" data-rprec="default" />
            <link rel="stylesheet" href="bar1" data-rprec="bar" />
            <link rel="preload" as="style" href="bar1" />
            <link rel="preload" as="style" href="foo3" />
            <link rel="preload" as="style" href="default2" />
          </head>
          <body>
            <div>hello world</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('retains styles even after the last referring Resource unmounts', async () => {
      // This test is true until a future update where there is some form of garbage collection.
      const root = ReactDOMClient.createRoot(document);

      root.render(
        <html>
          <head />
          <body>
            hello world
            <link rel="stylesheet" href="foo" precedence="foo" />
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();

      root.render(
        <html>
          <head />
          <body>hello world</body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-rprec="foo" />
          </head>
          <body>hello world</body>
        </html>,
      );
    });

    // @gate enableFloat
    it('retains styles even when a new html, head, and/body mount', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <link rel="stylesheet" href="foo" precedence="foo" />
              <link rel="stylesheet" href="bar" precedence="bar" />
              server
            </body>
          </html>,
        );
        pipe(writable);
      });
      const errors = [];
      ReactDOMClient.hydrateRoot(
        document,
        <html>
          <head>
            <link rel="stylesheet" href="qux" precedence="qux" />
            <link rel="stylesheet" href="foo" precedence="foo" />
          </head>
          <body>client</body>
        </html>,
        {
          onRecoverableError(error) {
            errors.push(error.message);
          },
        },
      );
      expect(() => {
        expect(Scheduler).toFlushWithoutYielding();
      }).toErrorDev(
        [
          'Warning: Text content did not match. Server: "server" Client: "client"',
          'Warning: An error occurred during hydration. The server HTML was replaced with client content in <#document>.',
        ],
        {withoutStack: 1},
      );
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="qux" data-rprec="qux" />
            <link rel="stylesheet" href="foo" data-rprec="foo" />
          </head>
          <body>client</body>
        </html>,
      );
    });

    // Disabling for now since we are going to live with not having a restore step while we consider
    // HostSingletons or other solutions
    // @gate enableFloat
    xit('retains styles in head through head remounts', async () => {
      const root = ReactDOMClient.createRoot(document);
      root.render(
        <html>
          <head key={1} />
          <body>
            <link rel="stylesheet" href="foo" precedence="foo" />
            <link rel="stylesheet" href="bar" precedence="bar" />
            hello
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-rprec="foo" />
            <link rel="stylesheet" href="bar" data-rprec="bar" />
          </head>
          <body>hello</body>
        </html>,
      );

      root.render(
        <html>
          <head key={2} />
          <body>
            <link rel="stylesheet" href="foo" precedence="foo" />
            <link rel="stylesheet" href="bar" precedence="bar" />
            hello
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-rprec="foo" />
            <link rel="stylesheet" href="bar" data-rprec="bar" />
          </head>
          <body>hello</body>
        </html>,
      );
    });
  });

  // @gate enableFloat
  it('client renders a boundary if a style Resource dependency fails to load', async () => {
    function BlockedOn({text, children}) {
      readText(text);
      return children;
    }
    function App() {
      return (
        <html>
          <head />
          <body>
            <Suspense fallback="loading...">
              <BlockedOn text="unblock">
                <link rel="stylesheet" href="foo" precedence="arbitrary" />
                <link rel="stylesheet" href="bar" precedence="arbitrary" />
                Hello
              </BlockedOn>
            </Suspense>
          </body>
        </html>
      );
    }
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    await act(() => {
      resolveText('unblock');
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="arbitrary" />
          <link rel="stylesheet" href="bar" data-rprec="arbitrary" />
        </head>
        <body>
          loading...
          <link rel="preload" href="foo" as="style" />
          <link rel="preload" href="bar" as="style" />
        </body>
      </html>,
    );

    await act(() => {
      const barLink = document.querySelector(
        'link[rel="stylesheet"][href="bar"]',
      );
      const event = document.createEvent('Events');
      event.initEvent('error', true, true);
      barLink.dispatchEvent(event);
    });

    const boundaryTemplateInstance = document.getElementById('B:0');
    const suspenseInstance = boundaryTemplateInstance.previousSibling;

    expect(suspenseInstance.data).toEqual('$!');
    expect(boundaryTemplateInstance.dataset.dgst).toBe(
      'Resource failed to load',
    );

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="arbitrary" />
          <link rel="stylesheet" href="bar" data-rprec="arbitrary" />
        </head>
        <body>
          loading...
          <link rel="preload" href="foo" as="style" />
          <link rel="preload" href="bar" as="style" />
        </body>
      </html>,
    );

    const errors = [];
    ReactDOMClient.hydrateRoot(document, <App />, {
      onRecoverableError(err, errInfo) {
        errors.push(err.message);
        errors.push(err.digest);
      },
    });
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="arbitrary" />
          <link rel="stylesheet" href="bar" data-rprec="arbitrary" />
        </head>
        <body>
          <link rel="preload" href="foo" as="style" />
          <link rel="preload" href="bar" as="style" />
          Hello
        </body>
      </html>,
    );
    expect(errors).toEqual([
      'The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.',
      'Resource failed to load',
    ]);
  });

  // @gate enableFloat
  it('treats stylesheet links with a precedence as a resource', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            <link rel="stylesheet" href="foo" precedence="arbitrary" />
            Hello
          </body>
        </html>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="arbitrary" />
        </head>
        <body>Hello</body>
      </html>,
    );

    ReactDOMClient.hydrateRoot(
      document,
      <html>
        <head />
        <body>Hello</body>
      </html>,
    );
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="arbitrary" />
        </head>
        <body>Hello</body>
      </html>,
    );
  });

  // @gate enableFloat
  it('inserts text separators following text when followed by an element that is converted to a resource and thus removed from the html inline', async () => {
    // If you render many of these as siblings the values get emitted as a single text with no separator sometimes
    // because the link gets elided as a resource
    function AsyncTextWithResource({text, href, precedence}) {
      const value = readText(text);
      return (
        <>
          {value}
          <link rel="stylesheet" href={href} precedence={precedence} />
        </>
      );
    }

    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            <AsyncTextWithResource text="foo" href="foo" precedence="one" />
            <AsyncTextWithResource text="bar" href="bar" precedence="two" />
            <AsyncTextWithResource text="baz" href="baz" precedence="three" />
          </body>
        </html>,
      );
      pipe(writable);
      resolveText('foo');
      resolveText('bar');
      resolveText('baz');
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link rel="stylesheet" href="bar" data-rprec="two" />
          <link rel="stylesheet" href="baz" data-rprec="three" />
        </head>
        <body>
          {'foo'}
          {'bar'}
          {'baz'}
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('hoists late stylesheets the correct precedence', async () => {
    function AsyncListItemWithResource({text, href, precedence, ...rest}) {
      const value = readText(text);
      return (
        <li>
          <link
            rel="stylesheet"
            href={href}
            precedence={precedence}
            {...rest}
          />
          {value}
        </li>
      );
    }
    function BlockingChildren({text, children}) {
      readText(text);
      return children;
    }
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            <link rel="stylesheet" href="initial" precedence="one" />
            <div>
              <Suspense fallback="loading foo bar...">
                <link rel="stylesheet" href="foo" precedence="one" />
                <ul>
                  <li>
                    <AsyncText text="foo" />
                  </li>
                  <AsyncListItemWithResource
                    text="bar"
                    href="bar"
                    precedence="default"
                    data-foo="foo"
                    crossOrigin="anonymous"
                  />
                </ul>
              </Suspense>
            </div>
            <div>
              <Suspense fallback="loading bar baz qux...">
                <ul>
                  <AsyncListItemWithResource
                    text="bar"
                    href="bar"
                    precedence="default"
                  />
                  <AsyncListItemWithResource
                    text="baz"
                    href="baz"
                    precedence="two"
                  />
                  <AsyncListItemWithResource
                    text="qux"
                    href="qux"
                    precedence="one"
                  />
                </ul>
              </Suspense>
            </div>
            <div>
              <Suspense fallback="loading bar baz qux...">
                <BlockingChildren text="unblock">
                  <ul>
                    <AsyncListItemWithResource
                      text="bar"
                      href="bar"
                      precedence="default"
                    />
                    <AsyncListItemWithResource
                      text="baz"
                      href="baz"
                      precedence="two"
                    />
                    <AsyncListItemWithResource
                      text="qux"
                      href="qux"
                      precedence="one"
                    />
                  </ul>
                </BlockingChildren>
              </Suspense>
            </div>
          </body>
        </html>,
      );
      pipe(writable);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-rprec="one" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>loading foo bar...</div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
        </body>
      </html>,
    );

    await act(() => {
      resolveText('foo');
      resolveText('bar');
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-rprec="one" />
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link
            rel="stylesheet"
            href="bar"
            data-rprec="default"
            data-foo="foo"
            crossorigin="anonymous"
          />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>loading foo bar...</div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
          <link rel="preload" href="bar" as="style" crossorigin="anonymous" />
        </body>
      </html>,
    );

    await act(() => {
      const link = document.querySelector('link[rel="stylesheet"][href="foo"]');
      const event = document.createEvent('Events');
      event.initEvent('load', true, true);
      link.dispatchEvent(event);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-rprec="one" />
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link
            rel="stylesheet"
            href="bar"
            data-rprec="default"
            data-foo="foo"
            crossorigin="anonymous"
          />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>loading foo bar...</div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
          <link rel="preload" href="bar" as="style" crossorigin="anonymous" />
        </body>
      </html>,
    );

    await act(() => {
      const link = document.querySelector('link[rel="stylesheet"][href="bar"]');
      const event = document.createEvent('Events');
      event.initEvent('load', true, true);
      link.dispatchEvent(event);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-rprec="one" />
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link
            rel="stylesheet"
            href="bar"
            data-rprec="default"
            data-foo="foo"
            crossorigin="anonymous"
          />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>
            <ul>
              <li>foo</li>
              <li>bar</li>
            </ul>
          </div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
          <link rel="preload" href="bar" as="style" crossorigin="anonymous" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('baz');
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-rprec="one" />
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link
            rel="stylesheet"
            href="bar"
            data-rprec="default"
            data-foo="foo"
            crossorigin="anonymous"
          />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>
            <ul>
              <li>foo</li>
              <li>bar</li>
            </ul>
          </div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
          <link rel="preload" as="style" href="bar" crossorigin="anonymous" />
          <link rel="preload" as="style" href="baz" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('qux');
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-rprec="one" />
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link rel="stylesheet" href="qux" data-rprec="one" />
          <link
            rel="stylesheet"
            href="bar"
            data-rprec="default"
            data-foo="foo"
            crossorigin="anonymous"
          />
          <link rel="stylesheet" href="baz" data-rprec="two" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>
            <ul>
              <li>foo</li>
              <li>bar</li>
            </ul>
          </div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
          <link rel="preload" as="style" href="bar" crossorigin="anonymous" />
          <link rel="preload" as="style" href="baz" />
          <link rel="preload" as="style" href="qux" />
        </body>
      </html>,
    );

    await act(() => {
      const bazlink = document.querySelector(
        'link[rel="stylesheet"][href="baz"]',
      );
      const quxlink = document.querySelector(
        'link[rel="stylesheet"][href="qux"]',
      );
      const event = document.createEvent('Events');
      event.initEvent('load', true, true);
      bazlink.dispatchEvent(event);
      quxlink.dispatchEvent(event);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-rprec="one" />
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link rel="stylesheet" href="qux" data-rprec="one" />
          <link
            rel="stylesheet"
            href="bar"
            data-rprec="default"
            data-foo="foo"
            crossorigin="anonymous"
          />
          <link rel="stylesheet" href="baz" data-rprec="two" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>
            <ul>
              <li>foo</li>
              <li>bar</li>
            </ul>
          </div>
          <div>
            <ul>
              <li>bar</li>
              <li>baz</li>
              <li>qux</li>
            </ul>
          </div>
          <div>loading bar baz qux...</div>
          <link rel="preload" as="style" href="bar" crossorigin="anonymous" />
          <link rel="preload" as="style" href="baz" />
          <link rel="preload" as="style" href="qux" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('unblock');
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-rprec="one" />
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link rel="stylesheet" href="qux" data-rprec="one" />
          <link
            rel="stylesheet"
            href="bar"
            data-rprec="default"
            data-foo="foo"
            crossorigin="anonymous"
          />
          <link rel="stylesheet" href="baz" data-rprec="two" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>
            <ul>
              <li>foo</li>
              <li>bar</li>
            </ul>
          </div>
          <div>
            <ul>
              <li>bar</li>
              <li>baz</li>
              <li>qux</li>
            </ul>
          </div>
          <div>
            <ul>
              <li>bar</li>
              <li>baz</li>
              <li>qux</li>
            </ul>
          </div>
          <link rel="preload" as="style" href="bar" crossorigin="anonymous" />
          <link rel="preload" as="style" href="baz" />
          <link rel="preload" as="style" href="qux" />
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('normalizes style resource precedence for all boundaries inlined as part of the shell flush', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            <div>
              outer
              <link rel="stylesheet" href="1one" precedence="one" />
              <link rel="stylesheet" href="1two" precedence="two" />
              <link rel="stylesheet" href="1three" precedence="three" />
              <link rel="stylesheet" href="1four" precedence="four" />
              <Suspense fallback={null}>
                <div>
                  middle
                  <link rel="stylesheet" href="2one" precedence="one" />
                  <link rel="stylesheet" href="2two" precedence="two" />
                  <link rel="stylesheet" href="2three" precedence="three" />
                  <link rel="stylesheet" href="2four" precedence="four" />
                  <Suspense fallback={null}>
                    <div>
                      inner
                      <link rel="stylesheet" href="3five" precedence="five" />
                      <link rel="stylesheet" href="3one" precedence="one" />
                      <link rel="stylesheet" href="3two" precedence="two" />
                      <link rel="stylesheet" href="3three" precedence="three" />
                      <link rel="stylesheet" href="3four" precedence="four" />
                    </div>
                  </Suspense>
                </div>
              </Suspense>
              <Suspense fallback={null}>
                <div>middle</div>
                <link rel="stylesheet" href="4one" precedence="one" />
                <link rel="stylesheet" href="4two" precedence="two" />
                <link rel="stylesheet" href="4three" precedence="three" />
                <link rel="stylesheet" href="4four" precedence="four" />
              </Suspense>
            </div>
          </body>
        </html>,
      );
      pipe(writable);
    });

    // The reason the href's aren't ordered linearly is that when boundaries complete their resources
    // get hoisted to the shell directly so they can flush in the head. If a boundary doesn't suspend then
    // child boundaries will complete before the parent boundary and thus have their resources hoist
    // early. The reason precedences are still ordered correctly between child and parent is because
    // the precedence ordering is determined upon first discovernig a resource rather than on hoist and
    // so it follows render order
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="1one" data-rprec="one" />
          <link rel="stylesheet" href="3one" data-rprec="one" />
          <link rel="stylesheet" href="2one" data-rprec="one" />
          <link rel="stylesheet" href="4one" data-rprec="one" />

          <link rel="stylesheet" href="1two" data-rprec="two" />
          <link rel="stylesheet" href="3two" data-rprec="two" />
          <link rel="stylesheet" href="2two" data-rprec="two" />
          <link rel="stylesheet" href="4two" data-rprec="two" />

          <link rel="stylesheet" href="1three" data-rprec="three" />
          <link rel="stylesheet" href="3three" data-rprec="three" />
          <link rel="stylesheet" href="2three" data-rprec="three" />
          <link rel="stylesheet" href="4three" data-rprec="three" />

          <link rel="stylesheet" href="1four" data-rprec="four" />
          <link rel="stylesheet" href="3four" data-rprec="four" />
          <link rel="stylesheet" href="2four" data-rprec="four" />
          <link rel="stylesheet" href="4four" data-rprec="four" />

          <link rel="stylesheet" href="3five" data-rprec="five" />
        </head>
        <body>
          <div>
            outer
            <div>
              middle<div>inner</div>
            </div>
            <div>middle</div>
          </div>
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('style resources are inserted according to precedence order on the client', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            <div>
              <link rel="stylesheet" href="foo" precedence="one" />
              <link rel="stylesheet" href="bar" precedence="two" />
              Hello
            </div>
          </body>
        </html>,
      );
      pipe(writable);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link rel="stylesheet" href="bar" data-rprec="two" />
        </head>
        <body>
          <div>Hello</div>
        </body>
      </html>,
    );

    const root = ReactDOMClient.hydrateRoot(
      document,
      <html>
        <head />
        <body>
          <div>
            <link rel="stylesheet" href="foo" precedence="one" />
            <link rel="stylesheet" href="bar" precedence="two" />
            Hello
          </div>
        </body>
      </html>,
    );
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link rel="stylesheet" href="bar" data-rprec="two" />
        </head>
        <body>
          <div>Hello</div>
        </body>
      </html>,
    );

    root.render(
      <html>
        <head />
        <body>
          <div>Hello</div>
          <link rel="stylesheet" href="baz" precedence="one" />
        </body>
      </html>,
    );
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link rel="stylesheet" href="baz" data-rprec="one" />
          <link rel="stylesheet" href="bar" data-rprec="two" />
          <link rel="preload" as="style" href="baz" />
        </head>
        <body>
          <div>Hello</div>
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('inserts preloads in render phase eagerly', async () => {
    function Throw() {
      throw new Error('Uh oh!');
    }
    class ErrorBoundary extends React.Component {
      state = {hasError: false, error: null};
      static getDerivedStateFromError(error) {
        return {
          hasError: true,
          error,
        };
      }
      render() {
        if (this.state.hasError) {
          return this.state.error.message;
        }
        return this.props.children;
      }
    }

    const root = ReactDOMClient.createRoot(container);
    root.render(
      <ErrorBoundary>
        <link rel="stylesheet" href="foo" precedence="default" />
        <div>foo</div>
        <Throw />
      </ErrorBoundary>,
    );
    expect(Scheduler).toFlushWithoutYielding();
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div id="container">Uh oh!</div>
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('does not emit preinit stylesheets if they are invoked after the shell flushes', async () => {
    function PreinitsBlockedOn({text}) {
      readText(text);
      ReactDOM.preinit('one', {precedence: 'one', as: 'style'});
      ReactDOM.preinit('two', {precedence: 'two', as: 'style'});
      return null;
    }
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            <div>
              <link rel="stylesheet" href="foo" precedence="one" />
              <link rel="stylesheet" href="bar" precedence="two" />
              Hello
            </div>
            <div>
              <Suspense fallback={'loading...'}>
                <PreinitsBlockedOn text="foo" />
                <AsyncText text="bar" />
              </Suspense>
            </div>
          </body>
        </html>,
      );
      pipe(writable);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link rel="stylesheet" href="bar" data-rprec="two" />
        </head>
        <body>
          <div>Hello</div>
          <div>loading...</div>
        </body>
      </html>,
    );

    await act(() => {
      resolveText('foo');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link rel="stylesheet" href="bar" data-rprec="two" />
        </head>
        <body>
          <div>Hello</div>
          <div>loading...</div>
          <link rel="preload" href="one" as="style" />
          <link rel="preload" href="two" as="style" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('bar');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="one" />
          <link rel="stylesheet" href="bar" data-rprec="two" />
        </head>
        <body>
          <div>Hello</div>
          <div>bar</div>
          <link rel="preload" href="one" as="style" />
          <link rel="preload" href="two" as="style" />
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('will include child boundary style resources in the boundary reveal instruction', async () => {
    function BlockedOn({text, children}) {
      readText(text);
      return children;
    }
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            <div>
              <Suspense fallback="loading foo...">
                <BlockedOn text="foo">
                  <div>foo</div>
                  <link rel="stylesheet" href="foo" precedence="default" />
                  <Suspense fallback="loading bar...">
                    <BlockedOn text="bar">
                      <div>bar</div>
                      <link rel="stylesheet" href="bar" precedence="default" />
                      <Suspense fallback="loading baz...">
                        <BlockedOn text="baz">
                          <div>baz</div>
                          <link
                            rel="stylesheet"
                            href="baz"
                            precedence="default"
                          />
                        </BlockedOn>
                      </Suspense>
                    </BlockedOn>
                  </Suspense>
                </BlockedOn>
              </Suspense>
            </div>
          </body>
        </html>,
      );
      pipe(writable);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading foo...</div>
        </body>
      </html>,
    );

    await act(() => {
      resolveText('bar');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading foo...</div>
        </body>
      </html>,
    );

    await act(() => {
      resolveText('baz');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading foo...</div>
        </body>
      </html>,
    );

    await act(() => {
      resolveText('foo');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="default" />
          <link rel="stylesheet" href="bar" data-rprec="default" />
          <link rel="stylesheet" href="baz" data-rprec="default" />
        </head>
        <body>
          <div>loading foo...</div>
          <link rel="preload" href="foo" as="style" />
          <link rel="preload" href="bar" as="style" />
          <link rel="preload" href="baz" as="style" />
        </body>
      </html>,
    );

    await act(() => {
      const event = document.createEvent('Events');
      event.initEvent('load', true, true);
      Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach(
        el => {
          el.dispatchEvent(event);
        },
      );
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="default" />
          <link rel="stylesheet" href="bar" data-rprec="default" />
          <link rel="stylesheet" href="baz" data-rprec="default" />
        </head>
        <body>
          <div>
            <div>foo</div>
            <div>bar</div>
            <div>baz</div>
          </div>
          <link rel="preload" href="foo" as="style" />
          <link rel="preload" href="bar" as="style" />
          <link rel="preload" href="baz" as="style" />
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('will hoist resources of child boundaries emitted as part of a partial boundary to the parent boundary', async () => {
    function BlockedOn({text, children}) {
      readText(text);
      return children;
    }
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            <div>
              <Suspense fallback="loading...">
                <div>
                  <BlockedOn text="foo">
                    <div>foo</div>
                    <link rel="stylesheet" href="foo" precedence="default" />
                    <Suspense fallback="loading bar...">
                      <BlockedOn text="bar">
                        <div>bar</div>
                        <link
                          rel="stylesheet"
                          href="bar"
                          precedence="default"
                        />
                        <Suspense fallback="loading baz...">
                          <div>
                            <BlockedOn text="baz">
                              <div>baz</div>
                              <link
                                rel="stylesheet"
                                href="baz"
                                precedence="default"
                              />
                            </BlockedOn>
                          </div>
                        </Suspense>
                      </BlockedOn>
                    </Suspense>
                  </BlockedOn>
                  <BlockedOn text="qux">
                    <div>qux</div>
                    <link rel="stylesheet" href="qux" precedence="default" />
                  </BlockedOn>
                </div>
              </Suspense>
            </div>
          </body>
        </html>,
      );
      pipe(writable);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading...</div>
        </body>
      </html>,
    );

    // This will enqueue a style resource in a deep blocked boundary (loading baz...).
    await act(() => {
      resolveText('baz');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading...</div>
        </body>
      </html>,
    );

    // This will enqueue a style resource in the intermediate blocked boundary (loading bar...).
    await act(() => {
      resolveText('bar');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading...</div>
        </body>
      </html>,
    );

    // This will complete a segment in the top level boundary that is still blocked on another segment.
    // It will flush the completed segment however the inner boundaries should not emit their style dependencies
    // because they are not going to be revealed yet. instead their dependencies are hoisted to the blocked
    // boundary (top level).
    await act(() => {
      resolveText('foo');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading...</div>
          <link rel="preload" href="foo" as="style" />
          <link rel="preload" href="bar" as="style" />
          <link rel="preload" href="baz" as="style" />
        </body>
      </html>,
    );

    // This resolves the last blocked segment on the top level boundary so we see all dependencies of the
    // nested boundaries emitted at this level
    await act(() => {
      resolveText('qux');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="default" />
          <link rel="stylesheet" href="bar" data-rprec="default" />
          <link rel="stylesheet" href="baz" data-rprec="default" />
          <link rel="stylesheet" href="qux" data-rprec="default" />
        </head>
        <body>
          <div>loading...</div>
          <link rel="preload" href="foo" as="style" />
          <link rel="preload" href="bar" as="style" />
          <link rel="preload" href="baz" as="style" />
          <link rel="preload" href="qux" as="style" />
        </body>
      </html>,
    );

    // We load all stylesheets and confirm the content is revealed
    await act(() => {
      const event = document.createEvent('Events');
      event.initEvent('load', true, true);
      Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach(
        el => {
          el.dispatchEvent(event);
        },
      );
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-rprec="default" />
          <link rel="stylesheet" href="bar" data-rprec="default" />
          <link rel="stylesheet" href="baz" data-rprec="default" />
          <link rel="stylesheet" href="qux" data-rprec="default" />
        </head>
        <body>
          <div>
            <div>
              <div>foo</div>
              <div>bar</div>
              <div>
                <div>baz</div>
              </div>
              <div>qux</div>
            </div>
          </div>
          <link rel="preload" href="foo" as="style" />
          <link rel="preload" href="bar" as="style" />
          <link rel="preload" href="baz" as="style" />
          <link rel="preload" href="qux" as="style" />
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('encodes attributes consistently whether resources are flushed in shell or in late boundaries', async () => {
    const originalConsoleError = console.error;
    const mockError = jest.fn();
    console.error = (...args) => {
      mockError(...args.map(normalizeCodeLocInfo));
    };
    function BlockedOn({text, children}) {
      readText(text);
      return children;
    }
    function App() {
      return (
        <html>
          <head />
          <body>
            <div>
              <link
                // This preload is explicit so it can flush with a lot of potential attrs
                // We will duplicate this as a style that flushes after the shell
                rel="preload"
                as="style"
                href="foo"
                // precedence is not a special attribute for preloads so this will just flush as is
                precedence="default"
                // Some standard link props
                crossOrigin="anonymous"
                media="all"
                integrity="somehash"
                referrerPolicy="origin"
                // data and non starndard attributes that should flush
                data-foo={'"quoted"'}
                nonStandardAttr="attr"
                properlyformattednonstandardattr="attr"
                // attributes that should be filtered out for violating certain rules
                onSomething="this should be removed b/c event handler"
                shouldnotincludefunctions={() => {}}
                norsymbols={Symbol('foo')}
              />
              <Suspense fallback={'loading...'}>
                <BlockedOn text="unblock">
                  <link
                    // This preload is explicit so it can flush with a lot of potential attrs
                    // We will duplicate this as a style that flushes after the shell
                    rel="stylesheet"
                    href="foo"
                    // opt-in property to get this treated as a resource
                    precedence="default"
                    // Some standard link props
                    crossOrigin="anonymous"
                    media="all"
                    integrity="somehash"
                    referrerPolicy="origin"
                    // data and non starndard attributes that should flush
                    data-foo={'"quoted"'}
                    nonStandardAttr="attr"
                    properlyformattednonstandardattr="attr"
                    // attributes that should be filtered out for violating certain rules
                    onSomething="this should be removed b/c event handler"
                    shouldnotincludefunctions={() => {}}
                    norsymbols={Symbol('foo')}
                  />
                </BlockedOn>
              </Suspense>
            </div>
          </body>
        </html>
      );
    }
    try {
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link
              rel="preload"
              as="style"
              href="foo"
              precedence="default"
              crossorigin="anonymous"
              media="all"
              integrity="somehash"
              referrerpolicy="origin"
              data-foo={'"quoted"'}
              nonstandardattr="attr"
              properlyformattednonstandardattr="attr"
            />
          </head>
          <body>
            <div>loading...</div>
          </body>
        </html>,
      );
      if (__DEV__) {
        expect(mockError).toHaveBeenCalledTimes(2);
        expect(mockError).toHaveBeenCalledWith(
          'Warning: React does not recognize the `%s` prop on a DOM element.' +
            ' If you intentionally want it to appear in the DOM as a custom attribute,' +
            ' spell it as lowercase `%s` instead. If you accidentally passed it from a' +
            ' parent component, remove it from the DOM element.%s',
          'nonStandardAttr',
          'nonstandardattr',
          componentStack(['link', 'div', 'body', 'html', 'App']),
        );
        expect(mockError).toHaveBeenCalledWith(
          'Warning: Invalid values for props %s on <%s> tag. Either remove them from' +
            ' the element, or pass a string or number value to keep them in the DOM. For' +
            ' details, see https://reactjs.org/link/attribute-behavior %s',
          '`shouldnotincludefunctions`, `norsymbols`',
          'link',
          componentStack(['link', 'div', 'body', 'html', 'App']),
        );
        mockError.mockClear();
      } else {
        expect(mockError).not.toHaveBeenCalled();
      }

      // Now we flush the stylesheet with the boundary
      await act(() => {
        resolveText('unblock');
      });

      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link
              rel="stylesheet"
              href="foo"
              data-rprec="default"
              crossorigin="anonymous"
              media="all"
              integrity="somehash"
              referrerpolicy="origin"
              data-foo={'"quoted"'}
              nonstandardattr="attr"
              properlyformattednonstandardattr="attr"
            />
            <link
              rel="preload"
              as="style"
              href="foo"
              precedence="default"
              crossorigin="anonymous"
              media="all"
              integrity="somehash"
              referrerpolicy="origin"
              data-foo={'"quoted"'}
              nonstandardattr="attr"
              properlyformattednonstandardattr="attr"
            />
          </head>
          <body>
            <div>loading...</div>
          </body>
        </html>,
      );
      if (__DEV__) {
        // The way the test is currently set up the props that would warn have already warned
        // so no new warnings appear. This is really testing the same code pathway so
        // exercising that more here isn't all that useful
        expect(mockError).toHaveBeenCalledTimes(0);
      } else {
        expect(mockError).not.toHaveBeenCalled();
      }
    } finally {
      console.error = originalConsoleError;
    }
  });

  // @gate enableFloat
  it('boundary style resource dependencies hoist to a parent boundary when flushed inline', async () => {
    function BlockedOn({text, children}) {
      readText(text);
      return children;
    }
    await actIntoEmptyDocument(() => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        <html>
          <head />
          <body>
            <div>
              <Suspense fallback="loading A...">
                <BlockedOn text="unblock">
                  <AsyncText text="A" />
                  <link rel="stylesheet" href="A" precedence="A" />
                  <Suspense fallback="loading AA...">
                    <AsyncText text="AA" />
                    <link rel="stylesheet" href="AA" precedence="AA" />
                    <Suspense fallback="loading AAA...">
                      <AsyncText text="AAA" />
                      <link rel="stylesheet" href="AAA" precedence="AAA" />
                      <Suspense fallback="loading AAAA...">
                        <AsyncText text="AAAA" />
                        <link rel="stylesheet" href="AAAA" precedence="AAAA" />
                      </Suspense>
                    </Suspense>
                  </Suspense>
                </BlockedOn>
              </Suspense>
            </div>
          </body>
        </html>,
      );
      pipe(writable);
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading A...</div>
        </body>
      </html>,
    );

    await act(() => {
      resolveText('unblock');
      resolveText('AAAA');
      resolveText('AA');
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading A...</div>
          <link rel="preload" as="style" href="A" />
          <link rel="preload" as="style" href="AA" />
          <link rel="preload" as="style" href="AAA" />
          <link rel="preload" as="style" href="AAAA" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('A');
    });
    await act(() => {
      document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
        const event = document.createEvent('Events');
        event.initEvent('load', true, true);
        l.dispatchEvent(event);
      });
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="A" data-rprec="A" />
          <link rel="stylesheet" href="AA" data-rprec="AA" />
        </head>
        <body>
          <div>
            {'A'}
            {'AA'}
            {'loading AAA...'}
          </div>
          <link rel="preload" as="style" href="A" />
          <link rel="preload" as="style" href="AA" />
          <link rel="preload" as="style" href="AAA" />
          <link rel="preload" as="style" href="AAAA" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('AAA');
    });
    await act(() => {
      document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
        const event = document.createEvent('Events');
        event.initEvent('load', true, true);
        l.dispatchEvent(event);
      });
    });
    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="A" data-rprec="A" />
          <link rel="stylesheet" href="AA" data-rprec="AA" />
          <link rel="stylesheet" href="AAA" data-rprec="AAA" />
          <link rel="stylesheet" href="AAAA" data-rprec="AAAA" />
        </head>
        <body>
          <div>
            {'A'}
            {'AA'}
            {'AAA'}
            {'AAAA'}
          </div>
          <link rel="preload" as="style" href="A" />
          <link rel="preload" as="style" href="AA" />
          <link rel="preload" as="style" href="AAA" />
          <link rel="preload" as="style" href="AAAA" />
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('always enforces crossOrigin "anonymous" for font preloads', async () => {
    const originalConsoleError = console.error;
    const mockError = jest.fn();
    console.error = (...args) => {
      mockError(...args.map(normalizeCodeLocInfo));
    };
    try {
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <link rel="preload" as="font" href="foo" />
              <link rel="preload" as="font" href="bar" crossOrigin="foo" />
              <link
                rel="preload"
                as="font"
                href="baz"
                crossOrigin="use-credentials"
              />
              <link
                rel="preload"
                as="font"
                href="qux"
                crossOrigin="anonymous"
              />
            </body>
          </html>,
        );
        pipe(writable);
      });
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="font" href="foo" crossorigin="" />
            <link rel="preload" as="font" href="bar" crossorigin="" />
            <link rel="preload" as="font" href="baz" crossorigin="" />
            <link rel="preload" as="font" href="qux" crossorigin="" />
          </head>
          <body />
        </html>,
      );

      if (__DEV__) {
        expect(mockError).toHaveBeenCalledTimes(2);
        expect(mockError).toHaveBeenCalledWith(
          'Warning: A %s with href "%s" did not specify the crossOrigin prop. Font preloads must always use' +
            ' anonymouse CORS mode. To fix add an empty string, "anonymous", or any other string' +
            ' value except "use-credentials" for the crossOrigin prop of all font preloads.%s',
          'preload Resource (as "font")',
          'foo',
          componentStack(['link', 'body', 'html']),
        );
        expect(mockError).toHaveBeenCalledWith(
          'Warning: A %s with href "%s" specified a crossOrigin value of "use-credentials". Font preloads must always use' +
            ' anonymouse CORS mode. To fix use an empty string, "anonymous", or any other string' +
            ' value except "use-credentials" for the crossOrigin prop of all font preloads.%s',
          'preload Resource (as "font")',
          'baz',
          componentStack(['link', 'body', 'html']),
        );
      } else {
        expect(mockError).not.toHaveBeenCalled();
      }
    } finally {
      console.error = originalConsoleError;
    }
  });

  describe('ReactDOM.pre* function validation', () => {
    function Preloads({scenarios}) {
      for (let i = 0; i < scenarios.length; i++) {
        const href = scenarios[i][0];
        const options = scenarios[i][1];
        ReactDOM.preload(href, options);
      }
    }
    function Preinits({scenarios}) {
      for (let i = 0; i < scenarios.length; i++) {
        const href = scenarios[i][0];
        const options = scenarios[i][1];
        ReactDOM.preinit(href, options);
      }
    }
    async function renderOnServer(Component, scenarios) {
      const originalConsoleError = console.error;
      const mockError = jest.fn();
      console.error = (...args) => {
        mockError(...args.map(normalizeCodeLocInfo));
      };
      try {
        await actIntoEmptyDocument(() => {
          const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
            <html>
              <head>
                <Component scenarios={scenarios} />
              </head>
            </html>,
          );
          pipe(writable);
        });
        for (let i = 0; i < scenarios.length; i++) {
          const assertion = scenarios[i][2];
          assertion(mockError, i);
        }
      } finally {
        console.error = originalConsoleError;
      }
    }
    async function renderOnClient(Component, scenarios) {
      const originalConsoleError = console.error;
      const mockError = jest.fn();
      console.error = (...args) => {
        mockError(...args.map(normalizeCodeLocInfo));
      };
      try {
        const root = ReactDOMClient.createRoot(document);
        root.render(
          <html>
            <head>
              <Component scenarios={scenarios} />
            </head>
          </html>,
        );
        expect(Scheduler).toFlushWithoutYielding();
        for (let i = 0; i < scenarios.length; i++) {
          const assertion = scenarios[i][2];
          assertion(mockError, i);
        }
      } finally {
        console.error = originalConsoleError;
      }
    }

    [
      ['server', renderOnServer],
      ['client', renderOnClient],
    ].forEach(([environment, render]) => {
      // @gate enableFloat
      it(
        'warns when an invalid href argument is provided to ReactDOM.preload on the ' +
          environment,
        async () => {
          const expectedMessage =
            'Warning: ReactDOM.preload() expected the first argument to be a string representing an href but found %s instead.%s';
          const expectedStack = componentStack(['Preloads', 'head', 'html']);
          function makeArgs(...substitutions) {
            return [expectedMessage, ...substitutions, expectedStack];
          }
          await render(Preloads, [
            [
              '',
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('an empty string'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              undefined,
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('undefined'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              null,
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('null'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              232132,
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('something with type "number"'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              {},
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('something with type "object"'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
          ]);
        },
      );

      // @gate enableFloat
      it(
        'warns when an invalid href argument is provided to ReactDOM.preinit on the ' +
          environment,
        async () => {
          const expectedMessage =
            'Warning: ReactDOM.preinit() expected the first argument to be a string representing an href but found %s instead.%s';
          const expectedStack = componentStack(['Preinits', 'head', 'html']);
          function makeArgs(...substitutions) {
            return [expectedMessage, ...substitutions, expectedStack];
          }
          await render(Preinits, [
            [
              '',
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('an empty string'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              undefined,
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('undefined'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              null,
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('null'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              232132,
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('something with type "number"'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              {},
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('something with type "object"'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
          ]);
        },
      );

      // @gate enableFloat
      it(
        'warns when an invalid options argument is provided to ReactDOM.preload on the ' +
          environment,
        async () => {
          const expectedMessage =
            'Warning: ReactDOM.preload() expected the second argument to be an options argument containing at least an "as" property' +
            ' specifying the Resource type. It found %s instead. The href for the preload call where this warning originated is "%s".%s';
          const expectedStack = componentStack(['Preloads', 'head', 'html']);
          function makeArgs(...substitutions) {
            return [expectedMessage, ...substitutions, expectedStack];
          }
          await render(Preloads, [
            [
              'foo',
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('undefined', 'foo'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'foo',
              null,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('null', 'foo'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'foo',
              'bar',
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('something with type "string"', 'foo'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'foo',
              123,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('something with type "number"', 'foo'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
          ]);
        },
      );

      // @gate enableFloat
      it(
        'warns when an invalid options argument is provided to ReactDOM.preinit on the ' +
          environment,
        async () => {
          const expectedMessage =
            'Warning: ReactDOM.preinit() expected the second argument to be an options argument containing at least an "as" property' +
            ' specifying the Resource type. It found %s instead. The href for the preload call where this warning originated is "%s".%s';
          const expectedStack = componentStack(['Preinits', 'head', 'html']);
          function makeArgs(...substitutions) {
            return [expectedMessage, ...substitutions, expectedStack];
          }
          await render(Preinits, [
            [
              'foo',
              undefined,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('undefined', 'foo'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'foo',
              null,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('null', 'foo'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'foo',
              'bar',
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('something with type "string"', 'foo'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'foo',
              123,
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('something with type "number"', 'foo'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
          ]);
        },
      );

      // @gate enableFloat
      it(
        'warns when an invalid "as" option is provided to ReactDOM.preload on the ' +
          environment,
        async () => {
          const expectedMessage =
            'Warning: ReactDOM.preload() expected a valid "as" type in the options (second) argument but found %s instead.' +
            ' Please use one of the following valid values instead: %s. The href for the preload call where this' +
            ' warning originated is "%s".%s';
          const expectedStack = componentStack(['Preloads', 'head', 'html']);
          function makeArgs(...substitutions) {
            return [expectedMessage, ...substitutions, expectedStack];
          }
          await render(Preloads, [
            [
              'foo',
              {},
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('undefined', '"style" and "font"', 'foo'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'bar',
              {as: null},
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('null', '"style" and "font"', 'bar'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'baz',
              {as: 123},
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs(
                      'something with type "number"',
                      '"style" and "font"',
                      'baz',
                    ),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'qux',
              {as: {}},
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs(
                      'something with type "object"',
                      '"style" and "font"',
                      'qux',
                    ),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'quux',
              {as: 'bar'},
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('"bar"', '"style" and "font"', 'quux'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
          ]);
        },
      );

      // @gate enableFloat
      it(
        'warns when an invalid "as" option is provided to ReactDOM.preinit on the ' +
          environment,
        async () => {
          const expectedMessage =
            'Warning: ReactDOM.preinit() expected the second argument to be an options argument containing at least an "as" property' +
            ' specifying the Resource type. It found %s instead. Currently, the only valid resource type for preinit is "style".' +
            ' The href for the preinit call where this warning originated is "%s".%s';
          const expectedStack = componentStack(['Preinits', 'head', 'html']);
          function makeArgs(...substitutions) {
            return [expectedMessage, ...substitutions, expectedStack];
          }
          await render(Preinits, [
            [
              'foo',
              {},
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('undefined', 'foo'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'bar',
              {as: null},
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('null', 'bar'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'baz',
              {as: 123},
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('something with type "number"', 'baz'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'qux',
              {as: {}},
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('something with type "object"', 'qux'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
            [
              'quux',
              {as: 'bar'},
              (mockError, scenarioNumber) => {
                if (__DEV__) {
                  expect(mockError.mock.calls[scenarioNumber]).toEqual(
                    makeArgs('"bar"', 'quux'),
                  );
                } else {
                  expect(mockError).not.toHaveBeenCalled();
                }
              },
            ],
          ]);
        },
      );
    });
  });

  describe('prop validation', () => {
    // @gate enableFloat
    it('warns when you change props on a resource unless you also change the href', async () => {
      const root = ReactDOMClient.createRoot(container);
      root.render(
        <div>
          <link
            rel="stylesheet"
            href="foo"
            precedence="foo"
            data-something-extra="extra"
          />
          <link
            rel="stylesheet"
            href="bar"
            precedence="bar"
            data-something-extra="extra"
          />
          hello
        </div>,
      );
      expect(Scheduler).toFlushWithoutYielding();

      root.render(
        <div>
          <link
            rel="stylesheet"
            href="foo"
            precedence="fu"
            data-something-new="new"
          />
          <link
            rel="stylesheet"
            href="baz"
            precedence="baz"
            data-something-new="new"
          />
          hello
        </div>,
      );
      expect(() => {
        expect(Scheduler).toFlushWithoutYielding();
      }).toErrorDev(
        'Warning: A style Resource with href "foo" recieved new props with different values from the props used' +
          ' when this Resource was first rendered. React will only use the props provided when' +
          ' this resource was first rendered until a new href is provided. Unlike conventional' +
          ' DOM elements, Resources instances do not have a one to one correspondence with Elements' +
          ' in the DOM and as such, every instance of a Resource for a single Resource identifier' +
          ' (href) must have props that agree with each other. The differences are described below.' +
          '\n  data-something-extra: missing or null in latest props, "extra" in original props' +
          '\n  data-something-new: "new" in latest props, missing or null in original props' +
          '\n  precedence: "fu" in latest props, "foo" in original props',
      );
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link
              rel="stylesheet"
              href="foo"
              data-rprec="foo"
              data-something-extra="extra"
            />
            <link
              rel="stylesheet"
              href="bar"
              data-rprec="bar"
              data-something-extra="extra"
            />
            <link
              rel="stylesheet"
              href="baz"
              data-rprec="baz"
              data-something-new="new"
            />
            <link rel="preload" as="style" href="foo" />
            <link rel="preload" as="style" href="bar" />
            <link rel="preload" as="style" href="baz" />
          </head>
          <body>
            <div id="container">
              <div>hello</div>
            </div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('warns when style Resource have different values for media for the same href', async () => {
      const originalConsoleError = console.error;
      const mockError = jest.fn();
      console.error = (...args) => {
        mockError(...args.map(normalizeCodeLocInfo));
      };
      try {
        await actIntoEmptyDocument(() => {
          const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
            <html>
              <head>
                <link
                  rel="stylesheet"
                  href="foo"
                  precedence="foo"
                  media="all"
                />
                <link rel="stylesheet" href="foo" precedence="foo" />

                <link rel="stylesheet" href="bar" precedence="bar" />
                <link
                  rel="stylesheet"
                  href="bar"
                  precedence="bar"
                  media="all"
                />

                <link
                  rel="stylesheet"
                  href="baz"
                  precedence="baz"
                  media="some"
                />
                <link
                  rel="stylesheet"
                  href="baz"
                  precedence="baz"
                  media="all"
                />
              </head>
            </html>,
          );
          pipe(writable);
        });
        expect(getVisibleChildren(document)).toEqual(
          <html>
            <head>
              <link rel="stylesheet" href="foo" data-rprec="foo" media="all" />
              <link rel="stylesheet" href="bar" data-rprec="bar" />

              <link rel="stylesheet" href="baz" data-rprec="baz" media="some" />
            </head>
            <body />
          </html>,
        );

        if (__DEV__) {
          expect(mockError).toHaveBeenCalledTimes(3);
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A %s with href "%s" has props that disagree with those found on %s. Resources always use the props' +
              ' that were provided the first time they are encountered so any differences will be ignored. Please' +
              ' update Resources that share an href to have props that agree. The differences are described below.%s%s',
            'style Resource',
            'foo',
            'an earlier instance of this Resource',
            '\n  media: missing or null in latest props, "all" in original props',
            componentStack(['link', 'head', 'html']),
          );
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A %s with href "%s" has props that disagree with those found on %s. Resources always use the props' +
              ' that were provided the first time they are encountered so any differences will be ignored. Please' +
              ' update Resources that share an href to have props that agree. The differences are described below.%s%s',
            'style Resource',
            'bar',
            'an earlier instance of this Resource',
            '\n  media: "all" in latest props, missing or null in original props',
            componentStack(['link', 'head', 'html']),
          );
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A %s with href "%s" has props that disagree with those found on %s. Resources always use the props' +
              ' that were provided the first time they are encountered so any differences will be ignored. Please' +
              ' update Resources that share an href to have props that agree. The differences are described below.%s%s',
            'style Resource',
            'baz',
            'an earlier instance of this Resource',
            '\n  media: "all" in latest props, "some" in original props',
            componentStack(['link', 'head', 'html']),
          );
        } else {
          expect(mockError).not.toHaveBeenCalled();
        }
      } finally {
        console.error = originalConsoleError;
      }
    });

    // @gate enableFloat
    it('warns when style Resource props differ or are added for the same href', async () => {
      const originalConsoleError = console.error;
      const mockError = jest.fn();
      console.error = (...args) => {
        mockError(...args.map(normalizeCodeLocInfo));
      };
      try {
        await actIntoEmptyDocument(() => {
          const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
            <html>
              <head>
                <link
                  rel="stylesheet"
                  href="foo"
                  precedence="foo"
                  data-foo="an original value"
                />
                <link rel="stylesheet" href="foo" precedence="foo" />
                <link rel="stylesheet" href="foo" precedence="foonew" />

                <link rel="stylesheet" href="bar" precedence="bar" />
                <link
                  rel="stylesheet"
                  href="bar"
                  precedence="bar"
                  data-foo="a new value"
                />

                <link
                  rel="stylesheet"
                  href="baz"
                  precedence="baz"
                  data-foo="an original value"
                />
                <link
                  rel="stylesheet"
                  href="baz"
                  precedence="baz"
                  data-foo="a new value"
                />
              </head>
            </html>,
          );
          pipe(writable);
        });
        expect(getVisibleChildren(document)).toEqual(
          <html>
            <head>
              <link
                rel="stylesheet"
                href="foo"
                data-rprec="foo"
                data-foo="an original value"
              />
              <link rel="stylesheet" href="bar" data-rprec="bar" />
              <link
                rel="stylesheet"
                href="baz"
                data-rprec="baz"
                data-foo="an original value"
              />
            </head>
            <body />
          </html>,
        );

        if (__DEV__) {
          expect(mockError).toHaveBeenCalledTimes(3);
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A %s with href "%s" has props that disagree with those found on %s. Resources always use the props' +
              ' that were provided the first time they are encountered so any differences will be ignored. Please' +
              ' update Resources that share an href to have props that agree. The differences are described below.%s%s',
            'style Resource',
            'foo',
            'an earlier instance of this Resource',
            '\n  precedence: "foonew" in latest props, "foo" in original props',
            componentStack(['link', 'head', 'html']),
          );
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A %s with href "%s" has props that disagree with those found on %s. Resources always use the props' +
              ' that were provided the first time they are encountered so any differences will be ignored. Please' +
              ' update Resources that share an href to have props that agree. The differences are described below.%s%s',
            'style Resource',
            'bar',
            'an earlier instance of this Resource',
            '\n  data-foo: "a new value" in latest props, missing or null in original props',
            componentStack(['link', 'head', 'html']),
          );
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A %s with href "%s" has props that disagree with those found on %s. Resources always use the props' +
              ' that were provided the first time they are encountered so any differences will be ignored. Please' +
              ' update Resources that share an href to have props that agree. The differences are described below.%s%s',
            'style Resource',
            'baz',
            'an earlier instance of this Resource',
            '\n  data-foo: "a new value" in latest props, "an original value" in original props',
            componentStack(['link', 'head', 'html']),
          );
        } else {
          expect(mockError).not.toHaveBeenCalled();
        }
      } finally {
        console.error = originalConsoleError;
      }
    });

    // @gate enableFloat
    it('warns when style Resource includes any combination of onLoad, onError, or disabled props', async () => {
      const originalConsoleError = console.error;
      const mockError = jest.fn();
      console.error = (...args) => {
        mockError(...args.map(normalizeCodeLocInfo));
      };
      try {
        await actIntoEmptyDocument(() => {
          const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
            <html>
              <head>
                <link
                  rel="stylesheet"
                  href="foo"
                  precedence="foo"
                  onLoad={() => {}}
                  onError={() => {}}
                />
                <link
                  rel="stylesheet"
                  href="bar"
                  precedence="bar"
                  onLoad={() => {}}
                />
                <link
                  rel="stylesheet"
                  href="baz"
                  precedence="baz"
                  onError={() => {}}
                />
                <link
                  rel="stylesheet"
                  href="qux"
                  precedence="qux"
                  disabled={true}
                />
              </head>
              <body />
            </html>,
          );
          pipe(writable);
        });
        // precedence is removed from the stylesheets because it is considered a reserved prop for
        // stylesheets to opt into resource semantics.
        expect(getVisibleChildren(document)).toEqual(
          <html>
            <head>
              <link rel="preload" as="style" href="foo" />
              <link rel="preload" as="style" href="bar" />
              <link rel="preload" as="style" href="baz" />
              <link rel="preload" as="style" href="qux" />
              <link rel="stylesheet" href="foo" />
              <link rel="stylesheet" href="bar" />
              <link rel="stylesheet" href="baz" />
              <link rel="stylesheet" href="qux" disabled="" />
            </head>
            <body />
          </html>,
        );

        if (__DEV__) {
          expect(mockError).toHaveBeenCalledTimes(4);
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A link (rel="stylesheet") element with href "%s" has the precedence prop but also included the %s.' +
              ' When using %s React will opt out of Resource behavior. If you meant for this' +
              ' element to be treated as a Resource remove the %s. Otherwise remove the precedence prop.%s',
            'foo',
            'onLoad and onError props',
            'onLoad, onError, or disabled',
            'onLoad and onError props',
            componentStack(['link', 'head', 'html']),
          );
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A link (rel="stylesheet") element with href "%s" has the precedence prop but also included the %s.' +
              ' When using %s React will opt out of Resource behavior. If you meant for this' +
              ' element to be treated as a Resource remove the %s. Otherwise remove the precedence prop.%s',
            'bar',
            'onLoad prop',
            'onLoad, onError, or disabled',
            'onLoad prop',
            componentStack(['link', 'head', 'html']),
          );
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A link (rel="stylesheet") element with href "%s" has the precedence prop but also included the %s.' +
              ' When using %s React will opt out of Resource behavior. If you meant for this' +
              ' element to be treated as a Resource remove the %s. Otherwise remove the precedence prop.%s',
            'baz',
            'onError prop',
            'onLoad, onError, or disabled',
            'onError prop',
            componentStack(['link', 'head', 'html']),
          );
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A link (rel="stylesheet") element with href "%s" has the precedence prop but also included the %s.' +
              ' When using %s React will opt out of Resource behavior. If you meant for this' +
              ' element to be treated as a Resource remove the %s. Otherwise remove the precedence prop.%s',
            'qux',
            'disabled prop',
            'onLoad, onError, or disabled',
            'disabled prop',
            componentStack(['link', 'head', 'html']),
          );
        } else {
          expect(mockError).not.toHaveBeenCalled();
        }
      } finally {
        console.error = originalConsoleError;
      }
    });

    // @gate enableFloat
    it('warns when preload Resources have new or different values for props', async () => {
      const originalConsoleError = console.error;
      const mockError = jest.fn();
      console.error = (...args) => {
        mockError(...args.map(normalizeCodeLocInfo));
      };
      try {
        await actIntoEmptyDocument(() => {
          const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
            <html>
              <head>
                <link
                  rel="preload"
                  as="style"
                  href="foo"
                  data-foo="a current value"
                />
                <link
                  rel="preload"
                  as="style"
                  href="foo"
                  data-foo="a new value"
                />

                <link
                  rel="preload"
                  as="style"
                  href="bar"
                  data-bar="a current value"
                />
                <link
                  rel="preload"
                  as="font"
                  href="bar"
                  data-bar="a current value"
                  crossOrigin=""
                />
              </head>
            </html>,
          );
          pipe(writable);
        });
        expect(getVisibleChildren(document)).toEqual(
          <html>
            <head>
              <link
                rel="preload"
                as="style"
                href="foo"
                data-foo="a current value"
              />
              <link
                rel="preload"
                as="style"
                href="bar"
                data-bar="a current value"
              />
            </head>
            <body />
          </html>,
        );

        if (__DEV__) {
          expect(mockError).toHaveBeenCalledTimes(2);
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A %s with href "%s" has props that disagree with those found on %s. Resources always use the props' +
              ' that were provided the first time they are encountered so any differences will be ignored. Please' +
              ' update Resources that share an href to have props that agree. The differences are described below.%s%s',
            'preload Resource (as "style")',
            'foo',
            'an earlier instance of this Resource',
            '\n  data-foo: "a new value" in latest props, "a current value" in original props',
            componentStack(['link', 'head', 'html']),
          );
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A %s is using the same href "%s" as a %s. This is always an error and React will only keep the first preload' +
              ' for any given href, discarding subsequent instances. To fix, find where you are using this href in link' +
              ' tags or in calls to ReactDOM.preload() or ReactDOM.preinit() and either make the Resource types agree or' +
              ' update the hrefs to be distinct for different Resource types.%s',
            'preload Resource (as "font")',
            'bar',
            'preload Resource (as "style")',
            componentStack(['link', 'head', 'html']),
          );
        } else {
          expect(mockError).not.toHaveBeenCalled();
        }
      } finally {
        console.error = originalConsoleError;
      }
    });

    // @gate enableFloat
    it('warns when an existing preload Resource has certain specific different props from a style Resource of the same href', async () => {
      const originalConsoleError = console.error;
      const mockError = jest.fn();
      console.error = (...args) => {
        mockError(...args.map(normalizeCodeLocInfo));
      };
      try {
        await actIntoEmptyDocument(() => {
          const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
            <html>
              <head>
                <link
                  rel="preload"
                  as="style"
                  href="foo"
                  crossOrigin="preload value"
                />
                <link
                  rel="stylesheet"
                  href="foo"
                  precedence="foo"
                  crossOrigin="style value"
                />
              </head>
            </html>,
          );
          pipe(writable);
        });
        expect(getVisibleChildren(document)).toEqual(
          <html>
            <head>
              <link
                rel="stylesheet"
                href="foo"
                data-rprec="foo"
                crossorigin="style value"
              />
            </head>
            <body />
          </html>,
        );

        if (__DEV__) {
          expect(mockError).toHaveBeenCalledTimes(1);
          expect(mockError).toHaveBeenCalledWith(
            'Warning: A %s with href "%s" has props that disagree with those found on %s. Resources always use the props' +
              ' that were provided the first time they are encountered so any differences will be ignored. Please' +
              ' update Resources that share an href to have props that agree. The differences are described below.%s%s',
            'style Resource',
            'foo',
            'a preload Resource (as "style") with the same href',
            '\n  crossOrigin: "style value" in latest props, "preload value" in original props',
            componentStack(['link', 'head', 'html']),
          );
        } else {
          expect(mockError).not.toHaveBeenCalled();
        }
      } finally {
        console.error = originalConsoleError;
      }
    });
  });

  describe('escaping', () => {
    // @gate enableFloat
    it('escapes hrefs when selecting matching elements in the document when rendering Resources', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <link rel="preload" href="preload" as="style" />
              <link rel="stylesheet" href="style" precedence="style" />
              <link rel="stylesheet" href="with\slashes" precedence="style" />
              <link rel="preload" href={'with\nnewline'} as="style" />
              <div id="container" />
            </body>
          </html>,
        );
        pipe(writable);
      });

      container = document.getElementById('container');
      const root = ReactDOMClient.createRoot(container);
      root.render(
        <div>
          <link rel="preload" href={'preload"][rel="preload'} as="style" />
          <link
            rel="stylesheet"
            href={'style"][rel="stylesheet'}
            precedence="style"
          />
          <link rel="stylesheet" href={'with\\slashes'} precedence="style" />
          <link rel="preload" href={'with\nnewline'} as="style" />
          foo
        </div>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="preload" />
            <link rel="preload" href={'with\nnewline'} as="style" />
            <link rel="stylesheet" href="style" data-rprec="style" />
            <link rel="stylesheet" href="with\slashes" data-rprec="style" />
            <link
              rel="stylesheet"
              href={'style"][rel="stylesheet'}
              data-rprec="style"
            />
            <link rel="preload" href={'preload"][rel="preload'} as="style" />
            <link rel="preload" href={'style"][rel="stylesheet'} as="style" />
          </head>
          <body>
            <div id="container">
              <div>foo</div>
            </div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('escapes hrefs when selecting matching elements in the document when using preload and preinit', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
          <html>
            <head />
            <body>
              <link rel="preload" href="preload" as="style" />
              <link rel="stylesheet" href="style" precedence="style" />
              <link rel="stylesheet" href="with\slashes" precedence="style" />
              <link rel="preload" href={'with\nnewline'} as="style" />
              <div id="container" />
            </body>
          </html>,
        );
        pipe(writable);
      });

      function App() {
        ReactDOM.preload('preload"][rel="preload', {as: 'style'});
        ReactDOM.preinit('style"][rel="stylesheet', {
          as: 'style',
          precedence: 'style',
        });
        ReactDOM.preinit('with\\slashes', {
          as: 'style',
          precedence: 'style',
        });
        ReactDOM.preload('with\nnewline', {as: 'style'});
        return <div>foo</div>;
      }

      container = document.getElementById('container');
      const root = ReactDOMClient.createRoot(container);
      root.render(<App />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getVisibleChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="preload" />
            <link rel="preload" href={'with\nnewline'} as="style" />
            <link rel="stylesheet" href="style" data-rprec="style" />
            <link rel="stylesheet" href="with\slashes" data-rprec="style" />
            <link
              rel="stylesheet"
              href={'style"][rel="stylesheet'}
              data-rprec="style"
            />
            <link rel="preload" href={'preload"][rel="preload'} as="style" />
          </head>
          <body>
            <div id="container">
              <div>foo</div>
            </div>
          </body>
        </html>,
      );
    });
  });
});
