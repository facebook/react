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
let SuspenseList;
let useSyncExternalStore;
let useSyncExternalStoreWithSelector;
let PropTypes;
let textCache;
let window;
let document;
let writable;
let CSPnonce = null;
let container;
let buffer = '';
let hasErrored = false;
let fatalError = undefined;

describe('ReactDOMServerPreload', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    Scheduler = require('scheduler');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzServer = require('react-dom/server');
    }
    Stream = require('stream');
    Suspense = React.Suspense;
    if (gate(flags => flags.enableSuspenseList)) {
      SuspenseList = React.SuspenseList;
    }

    PropTypes = require('prop-types');

    if (gate(flags => flags.source)) {
      // The `with-selector` module composes the main `use-sync-external-store`
      // entrypoint. In the compiled artifacts, this is resolved to the `shim`
      // implementation by our build config, but when running the tests against
      // the source files, we need to tell Jest how to resolve it. Because this
      // is a source module, this mock has no affect on the build tests.
      jest.mock('use-sync-external-store/src/useSyncExternalStore', () =>
        jest.requireActual('react'),
      );
    }
    useSyncExternalStore = React.useSyncExternalStore;
    useSyncExternalStoreWithSelector = require('use-sync-external-store/with-selector')
      .useSyncExternalStoreWithSelector;

    textCache = new Map();

    // Test Environment
    const jsdom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body><div id="container">',
      {
        runScripts: 'dangerously',
      },
    );
    window = jsdom.window;
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

  function expectLinks(toBeLinks) {
    let allLinksInDoc = Array.from(document.getElementsByTagName('link'));
    let mappedLinks = allLinksInDoc.map(docLink => {
      return [
        docLink.rel,
        docLink.getAttribute('href'),
        docLink.getAttribute('as'),
      ];
    });
    expect(mappedLinks).toEqual(toBeLinks);
  }

  function expectScript(href, toBeScript) {
    let script = document.querySelector(`script[data-src="${href}"]`);
    let expected = [
      script.tagName.toLowerCase(),
      script.getAttribute('data-src'),
    ];
    expect(expected).toEqual(toBeScript);
  }

  function expectErrors(errorsArr, toBeDevArr, toBeProdArr) {
    const mappedErrows = errorsArr.map(({error, errorInfo}) => {
      const stack = errorInfo && errorInfo.componentStack;
      const digest = errorInfo && errorInfo.digest;
      if (stack) {
        return [error.message, digest, normalizeCodeLocInfo(stack)];
      } else if (digest) {
        return [error.message, digest];
      }
      return error.message;
    });
    if (__DEV__) {
      expect(mappedErrows).toEqual(toBeDevArr);
    } else {
      expect(mappedErrows).toEqual(toBeProdArr);
    }
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
    while (fakeBody.firstChild) {
      const node = fakeBody.firstChild;
      if (
        node.nodeName === 'SCRIPT' &&
        (CSPnonce === null || node.getAttribute('nonce') === CSPnonce)
      ) {
        const script = document.createElement('script');
        let originalSrc = node.getAttribute('src');
        if (originalSrc) {
          script.dataset.src = originalSrc;
        }
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

  function rejectText(text, error) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'rejected',
        value: error,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'rejected';
      record.value = error;
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

  function Text({text}) {
    return text;
  }

  function AsyncText({text}) {
    return readText(text);
  }

  function AsyncTextWrapped({as, text}) {
    const As = as;
    return <As>{readText(text)}</As>;
  }

  it('can flush a preload link for a stylesheet', async () => {
    function App() {
      ReactDOM.preload('foo', {as: 'style'});
      return <div>hi</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([['preload', 'foo', 'style']]);
  });

  it('only emits 1 preload even if preload is called more than once for the same resource', async () => {
    function App() {
      ReactDOM.preload('foo', {as: 'style'});
      return (
        <>
          <Component1 />
          <Component2 />
        </>
      );
    }

    function Component1() {
      ReactDOM.preload('bar', {as: 'style'});
      return <div>one</div>;
    }

    function Component2() {
      ReactDOM.preload('foo', {as: 'style'});
      return <div>two</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([
      ['preload', 'foo', 'style'],
      ['preload', 'bar', 'style'],
    ]);
  });

  it('only emits resources once per priority', async () => {
    function App() {
      ReactDOM.preload('foo', {as: 'style'});
      return (
        <Suspense fallback={'loading...'}>
          <Resource href={'foo'} />
          <Resource href={'bar'} />
          <Resource href={'baz'} />
        </Suspense>
      );
    }

    function Resource({href}) {
      let text = readText(href);
      ReactDOM.preload(text, {as: 'style'});
      return <div>{text}</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      await resolveText('foo');
      pipe(writable);
    });
    expectLinks([['preload', 'foo', 'style']]);

    await act(async () => {
      resolveText('bar');
    });
    expectLinks([
      ['preload', 'foo', 'style'],
      ['preload', 'bar', 'style'],
    ]);

    await act(async () => {
      await resolveText('baz');
    });
    expectLinks([
      ['preload', 'foo', 'style'],
      ['preload', 'bar', 'style'],
      ['preload', 'baz', 'style'],
    ]);
  });

  it('does not emit a preload if a resource has already been initialized', async () => {
    function App() {
      ReactDOM.preload('foo', {as: 'style'});
      return (
        <Suspense fallback={'loading...'}>
          <PreloadResource href={'foo'} />
          <PreloadResource href={'bar'} />
        </Suspense>
      );
    }

    function PreloadResource({href}) {
      ReactDOM.preload(href, {as: 'style'});
      let text = readText(href);
      ReactDOM.preinit(text, {as: 'style'});
      return <div>{text}</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      await resolveText('foo');
      pipe(writable);
    });
    expectLinks([
      ['stylesheet', 'foo', null],
      ['preload', 'bar', 'style'],
    ]);

    await act(async () => {
      resolveText('bar');
    });
    expectLinks([
      ['stylesheet', 'foo', null],
      ['preload', 'bar', 'style'],
      ['stylesheet', 'bar', null],
    ]);
  });

  it('does not emit lower priority resource loaders when a higher priority loader is already known', async () => {
    function App() {
      ReactDOM.preload('foo', {as: 'style'});
      return (
        <Suspense fallback={'loading...'}>
          <PreloadResource href={'foo'} />
        </Suspense>
      );
    }

    function PreloadResource({href}) {
      ReactDOM.preinit(href, {as: 'style'});
      let text = readText(href);
      ReactDOM.preload(text, {as: 'style'});
      return <div>{text}</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    expectLinks([['stylesheet', 'foo', null]]);

    await act(async () => {
      resolveText('foo');
    });
    expectLinks([['stylesheet', 'foo', null]]);
  });

  it('supports prefetching DNS', async () => {
    function App() {
      ReactDOM.prefetchDNS('foo');
      return <div>hi</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([['dns-prefetch', 'foo', null]]);
  });

  it('supports preconnecting', async () => {
    function App() {
      ReactDOM.preconnect('foo');
      return <div>hi</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([['preconnect', 'foo', null]]);
  });

  it('supports prefetching', async () => {
    function App() {
      ReactDOM.prefetch('foo', {as: 'font'});
      ReactDOM.prefetch('bar', {as: 'style'});
      ReactDOM.prefetch('baz', {as: 'script'});
      return <div>hi</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([
      ['prefetch', 'foo', 'font'],
      ['prefetch', 'bar', 'style'],
      ['prefetch', 'baz', 'script'],
    ]);
  });

  it('supports preloading', async () => {
    function App() {
      ReactDOM.preload('foo', {as: 'font'});
      ReactDOM.preload('bar', {as: 'style'});
      ReactDOM.preload('baz', {as: 'script'});
      return <div>hi</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([
      ['preload', 'foo', 'font'],
      ['preload', 'bar', 'style'],
      ['preload', 'baz', 'script'],
    ]);
  });

  it('supports initializing stylesheets and scripts', async () => {
    function App() {
      ReactDOM.preinit('foo', {as: 'style'});
      ReactDOM.preinit('bar', {as: 'script'});
      return <div>hi</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([['stylesheet', 'foo', null]]);
    expectScript('bar', ['script', 'bar']);
  });

  it('converts links for preloading into resources for preloading', async () => {
    function App() {
      return (
        <div>
          <link rel="foo" href="this link is not a resource" />
          <link rel="dns-prefetch" href="dns-prefetch" />
          <link rel="preconnect" href="preconnect" />
          <link rel="prefetch" href="prefetchstyle" as="style" />
          <link rel="prefetch" href="prefetchscript" as="script" />
          <link rel="prefetch" href="prefetchfont" as="font" />
          <link rel="preload" href="preloadstyle" as="style" />
          <link rel="preload" href="preloadscript" as="script" />
          <link rel="preload" href="preloadfont" as="font" />
          <link rel="stylesheet" href="stylesheet" />
          <link rel="font" href="font" />
        </div>
      );
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([
      // We don't start with the rel foo because it is not a resource and is emitted withe content
      // We start with a list of resources in order that they were discovered
      ['dns-prefetch', 'dns-prefetch', null],
      ['preconnect', 'preconnect', null],
      ['prefetch', 'prefetchstyle', 'style'],
      ['prefetch', 'prefetchscript', 'script'],
      ['prefetch', 'prefetchfont', 'font'],
      ['preload', 'preloadstyle', 'style'],
      ['preload', 'preloadscript', 'script'],
      ['preload', 'preloadfont', 'font'],
      // We Also get resources that were identified when we referred to an external resource directly
      ['preload', 'stylesheet', 'style'],
      ['preload', 'font', 'font'],
      // Finally we get links that were emitted as part of the content. Notice that for hint links
      // like preconnect or preload we omit them here because they are fully represented by the resource
      // emitted above. For direct resource references like stylesheets and fonts we emitted a preload but
      // we still also need the resource as well
      ['foo', 'this link is not a resource', null],
      ['stylesheet', 'stylesheet', null],
      ['font', 'font', null],
    ]);
  });

  it('captures resources for preloading when rendering a script', async () => {
    function App() {
      return (
        <div>
          <link rel="next" href="foo" />
          <script src="bar"></script>
        </div>
      );
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([
      // The preload link appearas first because it was emitted before content
      ['preload', 'bar', 'script'],
      ['next', 'foo', null],
    ]);
  });
});
