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
// let Scheduler;
let React;
let ReactDOM;
// let ReactDOMClient;
let ReactDOMFizzServer;
let Suspense;
// let TextDecoder;
let textCache;
// let window;
let document;
let writable;
let container;
let buffer = '';
let hasErrored = false;
let fatalError = undefined;
const CSPnonce = null;

describe('ReactDOMServerPreload', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;
    // Scheduler = require('scheduler');
    React = require('react');
    ReactDOM = require('react-dom');
    // ReactDOMClient = require('react-dom/client');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzServer = require('react-dom/server');
    }
    Stream = require('stream');
    Suspense = React.Suspense;
    // TextDecoder = require('util').TextDecoder;

    textCache = new Map();

    // Test Environment
    const jsdom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body><div id="container">',
      {
        runScripts: 'dangerously',
      },
    );
    // window = jsdom.window;
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

  function expectLinks(beforeLinks, separator, afterLinks) {
    let selector = 'link';
    if (separator) {
      selector += ', ' + separator;
    }
    const els = Array.from(document.querySelectorAll(selector));
    let index = 0;
    const [foundBeforeLinks, foundAfterLinks] = els.reduce(
      (linkGroups, nextEl) => {
        switch (nextEl.tagName) {
          case (separator && separator.toUpperCase()) || '': {
            index = 1;
            break;
          }
          case 'LINK': {
            const descriptor = [nextEl.rel, nextEl.getAttribute('href')];
            if (nextEl.hasAttribute('as')) {
              descriptor.push(nextEl.getAttribute('as'));
            }
            if (nextEl.hasAttribute('crossorigin')) {
              descriptor.push(
                nextEl.getAttribute('crossorigin') === 'use-credentials'
                  ? 'use-credentials'
                  : 'anonymous',
              );
            }
            linkGroups[index].push(descriptor);
            break;
          }
        }
        return linkGroups;
      },
      [[], []],
    );
    expect(foundBeforeLinks).toEqual(beforeLinks);
    if (separator) {
      expect(foundAfterLinks).toEqual(afterLinks);
    }
  }

  function expectBodyLinks(bodyLinks) {
    return expectLinks([], 'body', bodyLinks);
  }

  function expectScript(href, toBeScript) {
    const script = document.querySelector(`script[data-src="${href}"]`);
    const expected = [
      script.tagName.toLowerCase(),
      script.getAttribute('data-src'),
    ];
    if (script.hasAttribute('crossorigin')) {
      expected.push(
        script.getAttribute('crossorigin') === 'use-credentials'
          ? 'use-credentials'
          : 'anonymous',
      );
    }
    expect(expected).toEqual(toBeScript);
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
    const appender = container === document ? document.body : container;
    while (fakeBody.firstChild) {
      const node = fakeBody.firstChild;
      if (
        node.nodeName === 'SCRIPT' &&
        (CSPnonce === null || node.getAttribute('nonce') === CSPnonce)
      ) {
        const script = document.createElement('script');
        if (node.hasAttribute('src')) {
          script.setAttribute('data-src', node.getAttribute('src'));
        }
        if (node.hasAttribute('crossorigin')) {
          script.setAttribute('crossorigin', node.getAttribute('crossorigin'));
        }
        if (node.hasAttribute('async')) {
          script.setAttribute('async', node.getAttribute('async'));
        }
        script.textContent = node.textContent;
        fakeBody.removeChild(node);
        appender.appendChild(script);
      } else {
        appender.appendChild(node);
      }
    }
    const scripts = Array.from(document.getElementsByTagName('script'));
    scripts.forEach(script => {
      const srcAttr = script.getAttribute('src');
      if (srcAttr != null) {
        script.dataset.src = srcAttr;
      }
    });
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
    // window = jsdom.window;
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

  // function rejectText(text, error) {
  //   const record = textCache.get(text);
  //   if (record === undefined) {
  //     const newRecord = {
  //       status: 'rejected',
  //       value: error,
  //     };
  //     textCache.set(text, newRecord);
  //   } else if (record.status === 'pending') {
  //     const thenable = record.value;
  //     record.status = 'rejected';
  //     record.value = error;
  //     thenable.pings.forEach(t => t());
  //   }
  // }

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

  xit('can flush a preload link for a stylesheet', async () => {
    function App() {
      ReactDOM.preload('foo', {as: 'style'});
      return <div>hi</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectBodyLinks([['preload', 'foo', 'style']]);
  });

  xit('only emits 1 preload even if preload is called more than once for the same resource', async () => {
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

    expectBodyLinks([
      ['preload', 'foo', 'style'],
      ['preload', 'bar', 'style'],
    ]);
  });

  xit('only emits resources once per priority', async () => {
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
      const text = readText(href);
      ReactDOM.preload(text, {as: 'style'});
      return <div>{text}</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      await resolveText('foo');
      pipe(writable);
    });
    expectBodyLinks([['preload', 'foo', 'style']]);

    await act(async () => {
      resolveText('bar');
    });
    expectBodyLinks([
      ['preload', 'foo', 'style'],
      ['preload', 'bar', 'style'],
    ]);

    await act(async () => {
      await resolveText('baz');
    });
    expectBodyLinks([
      ['preload', 'foo', 'style'],
      ['preload', 'bar', 'style'],
      ['preload', 'baz', 'style'],
    ]);
  });

  xit('does not emit a preload if a resource has already been initialized', async () => {
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
      const text = readText(href);
      ReactDOM.preinit(text, {as: 'style'});
      return <div>{text}</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      await resolveText('foo');
      pipe(writable);
    });
    expectBodyLinks([
      ['stylesheet', 'foo'],
      ['preload', 'bar', 'style'],
    ]);

    await act(async () => {
      resolveText('bar');
    });
    expectBodyLinks([
      ['stylesheet', 'foo'],
      ['preload', 'bar', 'style'],
      ['stylesheet', 'bar'],
    ]);
  });

  xit('does not emit lower priority resource loaders when a higher priority loader is already known', async () => {
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
      const text = readText(href);
      ReactDOM.preload(text, {as: 'style'});
      return <div>{text}</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });
    expectBodyLinks([['stylesheet', 'foo']]);

    await act(async () => {
      resolveText('foo');
    });
    expectBodyLinks([['stylesheet', 'foo']]);
  });

  xit('supports prefetching DNS', async () => {
    function App() {
      ReactDOM.prefetchDNS('foo');
      return <div>hi</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectBodyLinks([['dns-prefetch', 'foo']]);
  });

  xit('supports preconnecting', async () => {
    function App() {
      ReactDOM.preconnect('foo');
      return <div>hi</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectBodyLinks([['preconnect', 'foo']]);
  });

  xit('supports prefetching', async () => {
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

    expectBodyLinks([
      ['prefetch', 'foo', 'font', 'anonymous'],
      ['prefetch', 'bar', 'style'],
      ['prefetch', 'baz', 'script'],
    ]);
  });

  xit('supports preloading', async () => {
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

    expectBodyLinks([
      ['preload', 'foo', 'font', 'anonymous'],
      ['preload', 'bar', 'style'],
      ['preload', 'baz', 'script'],
    ]);
  });

  xit('supports initializing stylesheets and scripts', async () => {
    function App() {
      ReactDOM.preinit('foo', {as: 'style'});
      ReactDOM.preinit('bar', {as: 'script'});
      return <div>hi</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectBodyLinks([['stylesheet', 'foo']]);
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

    expectBodyLinks([
      // the stylesheet link is hoisted as a resource while the other links are left in place
      ['stylesheet', 'stylesheet'],

      ['foo', 'this link is not a resource'],
      ['dns-prefetch', 'dns-prefetch'],
      ['preconnect', 'preconnect'],
      ['prefetch', 'prefetchstyle', 'style'],
      ['prefetch', 'prefetchscript', 'script'],
      ['prefetch', 'prefetchfont', 'font'],
      ['preload', 'preloadstyle', 'style'],
      ['preload', 'preloadscript', 'script'],
      ['preload', 'preloadfont', 'font'],
      ['font', 'font'],
    ]);
  });

  // @TODO restore this test once we support scripts
  xit('captures resources for preloading when rendering a script', async () => {
    function App() {
      return (
        <div>
          <link rel="next" href="foo" />
          <script src="bar" />
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
      ['next', 'foo'],
    ]);
  });

  ['dns-prefetch', 'preconnect', 'prefetch', 'preload'].forEach(mode => {
    const needsAs = mode === 'prefetch' || mode === 'preload';
    if (needsAs) {
      ['style', 'script', 'font'].forEach(as => {
        xit(`supports crossorigin on ${mode} links as ${as}`, async () => {
          function App() {
            return (
              <div>
                <br />
                <link rel={mode} as={as} href="foo0" />
                <link rel={mode} as={as} href="foo1" crossOrigin="" />
                <link rel={mode} as={as} href="foo2" crossOrigin="false" />
                <link
                  rel={mode}
                  as={as}
                  href="foo3"
                  crossOrigin="some-random-value"
                />
                <link rel={mode} as={as} href="foo4" crossOrigin="anonymous" />
                <link
                  rel={mode}
                  as={as}
                  href="foo5"
                  crossOrigin="use-credentials"
                />
              </div>
            );
          }

          await act(async () => {
            const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
            pipe(writable);
          });

          if (as === 'font') {
            expectLinks([], 'br', [
              [mode, 'foo0', as, 'anonymous'],
              [mode, 'foo1', as, 'anonymous'],
              [mode, 'foo2', as, 'anonymous'],
              [mode, 'foo3', as, 'anonymous'],
              [mode, 'foo4', as, 'anonymous'],
              [mode, 'foo5', as, 'anonymous'],
            ]);
          } else {
            expectLinks([], 'br', [
              [mode, 'foo0', as],
              [mode, 'foo1', as, 'anonymous'],
              [mode, 'foo2', as, 'anonymous'],
              [mode, 'foo3', as, 'anonymous'],
              [mode, 'foo4', as, 'anonymous'],
              [mode, 'foo5', as, 'use-credentials'],
            ]);
          }
        });
      });
    } else {
      xit(`supports crossorigin on ${mode} links`, async () => {
        function App() {
          return (
            <div>
              <link rel={mode} href="foo0" />
              <link rel={mode} href="foo1" crossOrigin="" />
              <link rel={mode} href="foo2" crossOrigin="false" />
              <link rel={mode} href="foo3" crossOrigin="some-random-value" />
              <link rel={mode} href="foo4" crossOrigin="anonymous" />
              <link rel={mode} href="foo5" crossOrigin="use-credentials" />
            </div>
          );
        }

        await act(async () => {
          const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
          pipe(writable);
        });

        expectLinks([
          [mode, 'foo0'],
          [mode, 'foo1', 'anonymous'],
          [mode, 'foo2', 'anonymous'],
          [mode, 'foo3', 'anonymous'],
          [mode, 'foo4', 'anonymous'],
          [mode, 'foo5', 'use-credentials'],
        ]);
      });
    }

    if (needsAs) {
      ['style', 'script', 'font'].forEach(as => {
        const method = mode === 'dns-prefetch' ? 'prefetchDNS' : mode;
        xit(`supports crossorigin with ReactDOM.${method} as ${as}`, async () => {
          function App() {
            ReactDOM[method]('foo0', {as});
            ReactDOM[method]('foo1', {as, crossOrigin: undefined});
            ReactDOM[method]('foo2', {as, crossOrigin: null});
            ReactDOM[method]('foo3', {as, crossOrigin: false});
            ReactDOM[method]('foo4', {as, crossOrigin: true});
            ReactDOM[method]('foo5', {as, crossOrigin: ''});
            ReactDOM[method]('foo6', {as, crossOrigin: 'somevalue'});
            ReactDOM[method]('foo7', {as, crossOrigin: 'anonymous'});
            ReactDOM[method]('foo8', {
              as,
              crossOrigin: 'use-credentials',
            });
            return <div>hello</div>;
          }

          await act(async () => {
            const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
            pipe(writable);
          });

          if (as === 'font') {
            expectLinks([
              [mode, 'foo0', as, 'anonymous'],
              [mode, 'foo1', as, 'anonymous'],
              [mode, 'foo2', as, 'anonymous'],
              [mode, 'foo3', as, 'anonymous'],
              [mode, 'foo4', as, 'anonymous'],
              [mode, 'foo5', as, 'anonymous'],
              [mode, 'foo6', as, 'anonymous'],
              [mode, 'foo7', as, 'anonymous'],
              [mode, 'foo8', as, 'anonymous'],
            ]);
          } else {
            expectLinks([
              [mode, 'foo0', as],
              [mode, 'foo1', as],
              [mode, 'foo2', as],
              [mode, 'foo3', as],
              [mode, 'foo4', as, 'anonymous'],
              [mode, 'foo5', as, 'anonymous'],
              [mode, 'foo6', as, 'anonymous'],
              [mode, 'foo7', as, 'anonymous'],
              [mode, 'foo8', as, 'use-credentials'],
            ]);
          }
        });
      });
    } else {
      const method = mode === 'dns-prefetch' ? 'prefetchDNS' : mode;
      xit(`supports crossorigin with ReactDOM.${method}`, async () => {
        function App() {
          ReactDOM[method]('foo0');
          ReactDOM[method]('foo1', {});
          ReactDOM[method]('foo2', {crossOrigin: undefined});
          ReactDOM[method]('foo3', {crossOrigin: null});
          ReactDOM[method]('foo4', {crossOrigin: false});
          ReactDOM[method]('foo5', {crossOrigin: true});
          ReactDOM[method]('foo6', {crossOrigin: ''});
          ReactDOM[method]('foo7', {crossOrigin: 'somevalue'});
          ReactDOM[method]('foo8', {crossOrigin: 'anonymous'});
          ReactDOM[method]('foo9', {
            crossOrigin: 'use-credentials',
          });
          return <div>hello</div>;
        }

        await act(async () => {
          const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
          pipe(writable);
        });

        expectLinks([
          [mode, 'foo0'],
          [mode, 'foo1'],
          [mode, 'foo2'],
          [mode, 'foo3'],
          [mode, 'foo4'],
          [mode, 'foo5', 'anonymous'],
          [mode, 'foo6', 'anonymous'],
          [mode, 'foo7', 'anonymous'],
          [mode, 'foo8', 'anonymous'],
          [mode, 'foo9', 'use-credentials'],
        ]);
      });
    }
  });

  [('stylesheet', 'font')].forEach(relType => {
    // @TODO restore this test when we construct resources from links
    xit(`supports crossorigin on ${relType} links`, async () => {
      const as = relType === 'stylesheet' ? 'style' : relType;
      function App() {
        return (
          <div>
            <link rel={relType} href="foo0" />
            <link rel={relType} href="foo1" crossOrigin="" />
            <link rel={relType} href="foo2" crossOrigin="false" />
            <link rel={relType} href="foo3" crossOrigin="some-random-value" />
            <link rel={relType} href="foo4" crossOrigin="anonymous" />
            <link rel={relType} href="foo5" crossOrigin="use-credentials" />
          </div>
        );
      }

      await act(async () => {
        const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
        pipe(writable);
      });

      if (relType === 'font') {
        expectLinks([
          ['preload', 'foo0', as, 'anonymous'],
          ['preload', 'foo1', as, 'anonymous'],
          ['preload', 'foo2', as, 'anonymous'],
          ['preload', 'foo3', as, 'anonymous'],
          ['preload', 'foo4', as, 'anonymous'],
          ['preload', 'foo5', as, 'anonymous'],
          [relType, 'foo0'],
          [relType, 'foo1', 'anonymous'],
          [relType, 'foo2', 'anonymous'],
          [relType, 'foo3', 'anonymous'],
          [relType, 'foo4', 'anonymous'],
          [relType, 'foo5', 'use-credentials'],
        ]);
      } else {
        expectLinks([
          ['preload', 'foo0', as],
          ['preload', 'foo1', as, 'anonymous'],
          ['preload', 'foo2', as, 'anonymous'],
          ['preload', 'foo3', as, 'anonymous'],
          ['preload', 'foo4', as, 'anonymous'],
          ['preload', 'foo5', as, 'use-credentials'],
          [relType, 'foo0'],
          [relType, 'foo1', 'anonymous'],
          [relType, 'foo2', 'anonymous'],
          [relType, 'foo3', 'anonymous'],
          [relType, 'foo4', 'anonymous'],
          [relType, 'foo5', 'use-credentials'],
        ]);
      }
    });
  });

  // @TODO add back in when we start to extract resources from scripts
  xit(`supports crossorigin on scripts`, async () => {
    const as = 'script';
    function App() {
      return (
        <div>
          <script src="foo0" />
          <script src="foo1" crossOrigin="" />
          <script src="foo2" crossOrigin="false" />
          <script src="foo3" crossOrigin="some-random-value" />
          <script src="foo4" crossOrigin="anonymous" />
          <script src="foo5" crossOrigin="use-credentials" />
        </div>
      );
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([
      ['preload', 'foo0', as],
      ['preload', 'foo1', as, 'anonymous'],
      ['preload', 'foo2', as, 'anonymous'],
      ['preload', 'foo3', as, 'anonymous'],
      ['preload', 'foo4', as, 'anonymous'],
      ['preload', 'foo5', as, 'use-credentials'],
    ]);
  });

  xit('supports crossorigin on ReactDOM.preinit for style', async () => {
    function App() {
      ReactDOM.preinit('foo0', {as: 'style'});
      ReactDOM.preinit('foo1', {as: 'style', crossOrigin: undefined});
      ReactDOM.preinit('foo2', {as: 'style', crossOrigin: null});
      ReactDOM.preinit('foo3', {as: 'style', crossOrigin: false});
      ReactDOM.preinit('foo4', {as: 'style', crossOrigin: true});
      ReactDOM.preinit('foo5', {as: 'style', crossOrigin: ''});
      ReactDOM.preinit('foo6', {as: 'style', crossOrigin: 'somevalue'});
      ReactDOM.preinit('foo7', {as: 'style', crossOrigin: 'anonymous'});
      ReactDOM.preinit('foo8', {as: 'style', crossOrigin: 'use-credentials'});
      return <div>hello</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectLinks([
      ['stylesheet', 'foo0'],
      ['stylesheet', 'foo1'],
      ['stylesheet', 'foo2'],
      ['stylesheet', 'foo3'],
      ['stylesheet', 'foo4', 'anonymous'],
      ['stylesheet', 'foo5', 'anonymous'],
      ['stylesheet', 'foo6', 'anonymous'],
      ['stylesheet', 'foo7', 'anonymous'],
      ['stylesheet', 'foo8', 'use-credentials'],
    ]);
  });

  xit('supports crossorigin on ReactDOM.preinit for script', async () => {
    function App() {
      ReactDOM.preinit('foo0', {as: 'script'});
      ReactDOM.preinit('foo1', {as: 'script', crossOrigin: undefined});
      ReactDOM.preinit('foo2', {as: 'script', crossOrigin: null});
      ReactDOM.preinit('foo3', {as: 'script', crossOrigin: false});
      ReactDOM.preinit('foo4', {as: 'script', crossOrigin: true});
      ReactDOM.preinit('foo5', {as: 'script', crossOrigin: ''});
      ReactDOM.preinit('foo6', {as: 'script', crossOrigin: 'somevalue'});
      ReactDOM.preinit('foo7', {as: 'script', crossOrigin: 'anonymous'});
      ReactDOM.preinit('foo8', {as: 'script', crossOrigin: 'use-credentials'});
      return <div>hello</div>;
    }

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />);
      pipe(writable);
    });

    expectScript('foo0', ['script', 'foo0']);
    expectScript('foo1', ['script', 'foo1']);
    expectScript('foo2', ['script', 'foo2']);
    expectScript('foo3', ['script', 'foo3']);
    expectScript('foo4', ['script', 'foo4', 'anonymous']);
    expectScript('foo5', ['script', 'foo5', 'anonymous']);
    expectScript('foo6', ['script', 'foo6', 'anonymous']);
    expectScript('foo7', ['script', 'foo7', 'anonymous']);
    expectScript('foo8', ['script', 'foo8', 'use-credentials']);
  });

  it('emits resources at the top of the head', async () => {
    function AsyncTextWithResource({text}) {
      const asyncText = readText(text);
      return (
        <>
          <link rel="stylesheet" href="baz" />
          {asyncText}
        </>
      );
    }

    function App() {
      return (
        <html>
          <head>
            <title>a title</title>
            <link rel="external" href="mcguffin" />
          </head>
          <body>
            <link rel="stylesheet" href="foo" />
            hello
            <Suspense fallback="waiting...">
              <link rel="stylesheet" href="bar" />
              <AsyncTextWithResource text="world" />
            </Suspense>
          </body>
        </html>
      );
    }

    await actIntoEmptyDocument(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />, {});
      pipe(writable);
    });

    await act(async () => {
      await resolveText('world');
    });

    expectLinks(
      [
        ['stylesheet', 'foo'],
        ['stylesheet', 'bar'],
      ],
      'title',
      [
        ['external', 'mcguffin'],
        ['stylesheet', 'baz'],
      ],
    );
  });

  it('emits resources even when the head suspends', async () => {
    function Html({children}) {
      readText('html');
      return <html>{children}</html>;
    }

    function Head({children}) {
      readText('head');
      return <head>{children}</head>;
    }

    function Body({children}) {
      readText('body');
      return <body>{children}</body>;
    }

    function HeadResource({text}) {
      readText(text);
      return <link rel="stylesheet" href={text} />;
    }

    function BodyResource({text}) {
      readText(text);
      return (
        <>
          <link rel="stylesheet" href={text} />
          <div>{text}</div>
        </>
      );
    }

    function App() {
      return (
        <Html>
          <Head>
            <title>a title</title>
            <HeadResource text="headfoo" />
          </Head>
          <Body>
            <BodyResource text="bodyfoo" />
            <BodyResource text="bodybar" />
          </Body>
        </Html>
      );
    }

    await actIntoEmptyDocument(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />, {});
      await new Promise(resolve => {
        setImmediate(resolve);
      });
      resolveText('html');
      resolveText('head');
      resolveText('body');
      resolveText('headfoo');
      resolveText('bodyfoo');
      resolveText('bodybar');
      pipe(writable);
    });

    expectLinks(
      [
        ['stylesheet', 'headfoo'],
        ['stylesheet', 'bodyfoo'],
        ['stylesheet', 'bodybar'],
      ],
      'title',
      [],
    );

    expect(getVisibleChildren(container)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="headfoo" />
          <link rel="stylesheet" href="bodyfoo" />
          <link rel="stylesheet" href="bodybar" />
          <title>a title</title>
        </head>
        <body>
          <div>bodyfoo</div>
          <div>bodybar</div>
        </body>
      </html>,
    );
  });
});
