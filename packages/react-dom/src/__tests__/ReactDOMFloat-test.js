/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment ./scripts/jest/ReactDOMServerIntegrationEnvironment
 */

'use strict';
import {
  replaceScriptsAndMove,
  mergeOptions,
  withLoadingReadyState,
} from '../test-utils/FizzTestUtils';

let JSDOM;
let Stream;
let Scheduler;
let React;
let ReactDOM;
let ReactDOMClient;
let ReactDOMFizzServer;
let Suspense;
let textCache;
let window;
let document;
let writable;
const CSPnonce = null;
let container;
let buffer = '';
let hasErrored = false;
let fatalError = undefined;
let renderOptions;

function resetJSDOM(markup) {
  // Test Environment
  const jsdom = new JSDOM(markup, {
    runScripts: 'dangerously',
  });
  // We mock matchMedia. for simplicity it only matches 'all' or '' and misses everything else
  Object.defineProperty(jsdom.window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: query === 'all' || query === '',
      media: query,
    })),
  });
  window = jsdom.window;
  document = jsdom.window.document;
}

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

    resetJSDOM('<!DOCTYPE html><html><head></head><body><div id="container">');
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

    renderOptions = {};
    if (gate(flags => flags.enableFizzExternalRuntime)) {
      renderOptions.unstable_externalRuntimeSrc =
        'react-dom-bindings/src/server/ReactDOMServerExternalRuntime.js';
    }
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
    const parent =
      container.nodeName === '#document' ? container.body : container;
    await withLoadingReadyState(async () => {
      while (fakeBody.firstChild) {
        const node = fakeBody.firstChild;
        await replaceScriptsAndMove(
          document.defaultView,
          CSPnonce,
          node,
          parent,
        );
      }
    }, document);
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
    resetJSDOM(bufferedContent);
    container = document;
    buffer = '';
    await withLoadingReadyState(async () => {
      await replaceScriptsAndMove(window, null, document.documentElement);
    }, document);
  }

  function getMeaningfulChildren(element) {
    const children = [];
    let node = element.firstChild;
    while (node) {
      if (node.nodeType === 1) {
        if (
          // some tags are ambiguous and might be hidden because they look like non-meaningful children
          // so we have a global override where if this data attribute is included we also include the node
          node.hasAttribute('data-meaningful') ||
          (node.tagName === 'SCRIPT' &&
            node.hasAttribute('src') &&
            node.getAttribute('src') !==
              renderOptions.unstable_externalRuntimeSrc &&
            node.hasAttribute('async')) ||
          (node.tagName !== 'SCRIPT' &&
            node.tagName !== 'TEMPLATE' &&
            node.tagName !== 'template' &&
            !node.hasAttribute('hidden') &&
            !node.hasAttribute('aria-hidden'))
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
          props.children = getMeaningfulChildren(node);
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

  function BlockedOn({value, children}) {
    readText(value);
    return children;
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

  function renderToPipeableStream(jsx, options) {
    // Merge options with renderOptions, which may contain featureFlag specific behavior
    return ReactDOMFizzServer.renderToPipeableStream(
      jsx,
      mergeOptions(options, renderOptions),
    );
  }

  function renderSafelyAndExpect(root, children) {
    root.render(children);
    return expect(() => {
      try {
        expect(Scheduler).toFlushWithoutYielding();
      } catch (e) {
        try {
          expect(Scheduler).toFlushWithoutYielding();
        } catch (f) {}
      }
    });
  }

  // @gate enableFloat
  it('can render resources before singletons', async () => {
    const root = ReactDOMClient.createRoot(document);
    root.render(
      <>
        <title>foo</title>
        <html>
          <head>
            <link rel="foo" href="foo" />
          </head>
          <body>hello world</body>
        </html>
      </>,
    );
    try {
      expect(Scheduler).toFlushWithoutYielding();
    } catch (e) {
      // for DOMExceptions that happen when expecting this test to fail we need
      // to clear the scheduler first otherwise the expected failure will fail
      expect(Scheduler).toFlushWithoutYielding();
      throw e;
    }
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <title>foo</title>
          <link rel="foo" href="foo" />
        </head>
        <body>hello world</body>
      </html>,
    );
  });

  // @gate enableFloat
  it('can hydrate non Resources in head when Resources are also inserted there', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = renderToPipeableStream(
        <html>
          <head>
            <meta property="foo" content="bar" />
            <link rel="foo" href="bar" onLoad={() => {}} />
            <title>foo</title>
            <noscript>
              <link rel="icon" href="icon" />
            </noscript>
            <base target="foo" href="bar" />
            <script async={true} src="foo" onLoad={() => {}} />
          </head>
          <body>foo</body>
        </html>,
      );
      pipe(writable);
    });
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="preload" href="foo" as="script" />
          <meta property="foo" content="bar" />
          <title>foo</title>
          <link rel="foo" href="bar" />
          <noscript>&lt;link rel="icon" href="icon"/&gt;</noscript>
          <base target="foo" href="bar" />
        </head>
        <body>foo</body>
      </html>,
    );

    ReactDOMClient.hydrateRoot(
      document,
      <html>
        <head>
          <meta property="foo" content="bar" />
          <link rel="foo" href="bar" onLoad={() => {}} />
          <title>foo</title>
          <noscript>
            <link rel="icon" href="icon" />
          </noscript>
          <base target="foo" href="bar" />
          <script async={true} src="foo" onLoad={() => {}} />
        </head>
        <body>foo</body>
      </html>,
    );
    expect(Scheduler).toFlushWithoutYielding();
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="preload" href="foo" as="script" />
          <meta property="foo" content="bar" />
          <title>foo</title>
          <link rel="foo" href="bar" />
          <link rel="foo" href="bar" />
          <noscript>&lt;link rel="icon" href="icon"/&gt;</noscript>
          <base target="foo" href="bar" />
          <script async="" src="foo" />
        </head>
        <body>foo</body>
      </html>,
    );
  });

  // @gate enableFloat || !__DEV__
  it('warns if you render resource-like elements above <head> or <body>', async () => {
    const root = ReactDOMClient.createRoot(document);

    renderSafelyAndExpect(
      root,
      <>
        <noscript>foo</noscript>
        <html>
          <body>foo</body>
        </html>
      </>,
    ).toErrorDev(
      [
        'Cannot render <noscript> outside the main document. Try moving it into the root <head> tag.',
        'Warning: validateDOMNesting(...): <noscript> cannot appear as a child of <#document>.',
      ],
      {withoutStack: 1},
    );

    renderSafelyAndExpect(
      root,
      <html>
        <template>foo</template>
        <body>foo</body>
      </html>,
    ).toErrorDev([
      'Cannot render <template> outside the main document. Try moving it into the root <head> tag.',
      'Warning: validateDOMNesting(...): <template> cannot appear as a child of <html>.',
    ]);

    renderSafelyAndExpect(
      root,
      <html>
        <body>foo</body>
        <style>foo</style>
      </html>,
    ).toErrorDev([
      'Cannot render a <style> outside the main document without knowing its precedence and a unique href key. React can hoist and deduplicate <style> tags if you provide a `precedence` prop along with an `href` prop that does not conflic with the `href` values used in any other hoisted <style> or <link rel="stylesheet" ...> tags.  Note that hoisting <style> tags is considered an advanced feature that most will not use directly. Consider moving the <style> tag to the <head> or consider adding a `precedence="default"` and `href="some unique resource identifier"`, or move the <style> to the <style> tag.',
      'Warning: validateDOMNesting(...): <style> cannot appear as a child of <html>.',
    ]);

    renderSafelyAndExpect(
      root,
      <>
        <html>
          <body>foo</body>
        </html>
        <link rel="stylesheet" href="foo" />
      </>,
    ).toErrorDev(
      [
        'Cannot render a <link rel="stylesheet" /> outside the main document without knowing its precedence. Consider adding precedence="default" or moving it into the root <head> tag.',
        'Warning: validateDOMNesting(...): <link> cannot appear as a child of <#document>.',
      ],
      {withoutStack: 1},
    );

    renderSafelyAndExpect(
      root,
      <>
        <html>
          <body>foo</body>
          <script href="foo" />
        </html>
      </>,
    ).toErrorDev([
      'Cannot render a sync or defer <script> outside the main document without knowing its order. Try adding async="" or moving it into the root <head> tag.',
      'Warning: validateDOMNesting(...): <script> cannot appear as a child of <html>.',
    ]);

    renderSafelyAndExpect(
      root,
      <>
        <html>
          <script async={true} onLoad={() => {}} href="bar" />
          <body>foo</body>
        </html>
      </>,
    ).toErrorDev([
      'Cannot render a <script> with onLoad or onError listeners outside the main document. Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or somewhere in the <body>.',
    ]);

    renderSafelyAndExpect(
      root,
      <>
        <link rel="foo" onLoad={() => {}} href="bar" />
        <html>
          <body>foo</body>
        </html>
      </>,
    ).toErrorDev(
      [
        'Cannot render a <link> with onLoad or onError listeners outside the main document. Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or somewhere in the <body>.',
      ],
      {withoutStack: 1},
    );
  });

  // @gate enableFloat
  it('can acquire a resource after releasing it in the same commit', async () => {
    const root = ReactDOMClient.createRoot(container);
    root.render(
      <>
        <script async={true} src="foo" />
      </>,
    );
    expect(Scheduler).toFlushWithoutYielding();
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <script async="" src="foo" />
        </head>
        <body>
          <div id="container" />
        </body>
      </html>,
    );

    root.render(
      <>
        {null}
        <script data-new="new" async={true} src="foo" />
      </>,
    );
    expect(Scheduler).toFlushWithoutYielding();
    // we don't see the attribute because the resource is the same and was not reconstructed
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <script async="" src="foo" />
        </head>
        <body>
          <div id="container" />
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('emits resources before everything else when rendering with no head', async () => {
    function App() {
      return (
        <>
          <title>foo</title>
          <link rel="preload" href="foo" as="style" />
        </>
      );
    }

    await actIntoEmptyDocument(() => {
      buffer = `<!DOCTYPE html><html><head>${ReactDOMFizzServer.renderToString(
        <App />,
      )}</head><body>foo</body></html>`;
    });
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="preload" href="foo" as="style" />
          <title>foo</title>
        </head>
        <body>foo</body>
      </html>,
    );
  });

  // @gate enableFloat
  it('emits resources before everything else when rendering with just a head', async () => {
    function App() {
      return (
        <head>
          <title>foo</title>
          <link rel="preload" href="foo" as="style" />
        </head>
      );
    }

    await actIntoEmptyDocument(() => {
      buffer = `<!DOCTYPE html><html>${ReactDOMFizzServer.renderToString(
        <App />,
      )}<body>foo</body></html>`;
    });
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="preload" href="foo" as="style" />
          <title>foo</title>
        </head>
        <body>foo</body>
      </html>,
    );
  });

  // @gate enableFloat
  it('emits an implicit <head> element to hold resources when none is rendered but an <html> is rendered', async () => {
    const chunks = [];

    writable.on('data', chunk => {
      chunks.push(chunk);
    });

    await actIntoEmptyDocument(() => {
      const {pipe} = renderToPipeableStream(
        <>
          <title>foo</title>
          <html>
            <body>bar</body>
          </html>
          <script async={true} src="foo" />
        </>,
      );
      pipe(writable);
    });
    expect(chunks).toEqual([
      '<!DOCTYPE html><html><head><script async="" src="foo"></script><title>foo</title></head><body>bar',
      '</body></html>',
    ]);
  });

  // @gate enableFloat
  it('dedupes if the external runtime is explicitly loaded using preinit', async () => {
    const unstable_externalRuntimeSrc = 'src-of-external-runtime';
    function App() {
      ReactDOM.preinit(unstable_externalRuntimeSrc, {as: 'script'});
      return (
        <div>
          <Suspense fallback={<h1>Loading...</h1>}>
            <AsyncText text="Hello" />
          </Suspense>
        </div>
      );
    }

    await actIntoEmptyDocument(() => {
      const {pipe} = renderToPipeableStream(
        <html>
          <head />
          <body>
            <App />
          </body>
        </html>,
        {
          unstable_externalRuntimeSrc,
        },
      );
      pipe(writable);
    });

    expect(
      Array.from(document.getElementsByTagName('script')).map(n => n.outerHTML),
    ).toEqual(['<script src="src-of-external-runtime" async=""></script>']);
  });

  // @gate enableFloat
  it('can avoid inserting a late stylesheet if it already rendered on the client', async () => {
    await actIntoEmptyDocument(() => {
      renderToPipeableStream(
        <html>
          <body>
            <Suspense fallback="loading foo...">
              <BlockedOn value="foo">
                <link rel="stylesheet" href="foo" precedence="foo" />
                foo
              </BlockedOn>
            </Suspense>
            <Suspense fallback="loading bar...">
              <BlockedOn value="bar">
                <link rel="stylesheet" href="bar" precedence="bar" />
                bar
              </BlockedOn>
            </Suspense>
          </body>
        </html>,
      ).pipe(writable);
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head />
        <body>
          {'loading foo...'}
          {'loading bar...'}
        </body>
      </html>,
    );

    ReactDOMClient.hydrateRoot(
      document,
      <html>
        <body>
          <link rel="stylesheet" href="foo" precedence="foo" />
          <Suspense fallback="loading foo...">
            <link rel="stylesheet" href="foo" precedence="foo" />
            foo
          </Suspense>
          <Suspense fallback="loading bar...">
            <link rel="stylesheet" href="bar" precedence="bar" />
            bar
          </Suspense>
        </body>
      </html>,
    );
    expect(Scheduler).toFlushWithoutYielding();
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="foo" />
          <link as="style" href="foo" rel="preload" />
        </head>
        <body>
          {'loading foo...'}
          {'loading bar...'}
        </body>
      </html>,
    );

    await act(() => {
      resolveText('bar');
    });
    await act(() => {
      const sheets = document.querySelectorAll(
        'link[rel="stylesheet"][data-precedence]',
      );
      const event = document.createEvent('Event');
      event.initEvent('load', true, true);
      for (let i = 0; i < sheets.length; i++) {
        sheets[i].dispatchEvent(event);
      }
    });
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="foo" />
          <link rel="stylesheet" href="bar" data-precedence="bar" />
          <link as="style" href="foo" rel="preload" />
        </head>
        <body>
          {'loading foo...'}
          {'bar'}
          <link as="style" href="bar" rel="preload" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('foo');
    });
    await act(() => {
      const sheets = document.querySelectorAll(
        'link[rel="stylesheet"][data-precedence]',
      );
      const event = document.createEvent('Event');
      event.initEvent('load', true, true);
      for (let i = 0; i < sheets.length; i++) {
        sheets[i].dispatchEvent(event);
      }
    });
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="foo" />
          <link rel="stylesheet" href="bar" data-precedence="bar" />
          <link as="style" href="foo" rel="preload" />
        </head>
        <body>
          {'foo'}
          {'bar'}
          <link as="style" href="bar" rel="preload" />
          <link as="style" href="foo" rel="preload" />
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('can hoist <link rel="stylesheet" .../> and <style /> tags together, respecting order of discovery', async () => {
    const css = `
body {
  background-color: red;
}`;

    await actIntoEmptyDocument(() => {
      renderToPipeableStream(
        <html>
          <body>
            <link rel="stylesheet" href="one1" precedence="one" />
            <style href="two1" precedence="two">
              {css}
            </style>
            <link rel="stylesheet" href="three1" precedence="three" />
            <style href="four1" precedence="four">
              {css}
            </style>
            <Suspense>
              <BlockedOn value="block">
                <link rel="stylesheet" href="one2" precedence="one" />
                <link rel="stylesheet" href="two2" precedence="two" />
                <style href="three2" precedence="three">
                  {css}
                </style>
                <style href="four2" precedence="four">
                  {css}
                </style>
                <link rel="stylesheet" href="five1" precedence="five" />
              </BlockedOn>
            </Suspense>
            <Suspense>
              <BlockedOn value="block2">
                <style href="one3" precedence="one">
                  {css}
                </style>
                <style href="two3" precedence="two">
                  {css}
                </style>
                <link rel="stylesheet" href="three3" precedence="three" />
                <link rel="stylesheet" href="four3" precedence="four" />
                <style href="six1" precedence="six">
                  {css}
                </style>
              </BlockedOn>
            </Suspense>
            <Suspense>
              <BlockedOn value="block again">
                <link rel="stylesheet" href="one2" precedence="one" />
                <link rel="stylesheet" href="two2" precedence="two" />
                <style href="three2" precedence="three">
                  {css}
                </style>
                <style href="four2" precedence="four">
                  {css}
                </style>
                <link rel="stylesheet" href="five1" precedence="five" />
              </BlockedOn>
            </Suspense>
          </body>
        </html>,
      ).pipe(writable);
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="one1" data-precedence="one" />
          <style data-href="two1" data-precedence="two">
            {css}
          </style>
          <link rel="stylesheet" href="three1" data-precedence="three" />
          <style data-href="four1" data-precedence="four">
            {css}
          </style>
        </head>
        <body />
      </html>,
    );

    await act(() => {
      resolveText('block');
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="one1" data-precedence="one" />
          <link rel="stylesheet" href="one2" data-precedence="one" />
          <style data-href="two1" data-precedence="two">
            {css}
          </style>
          <link rel="stylesheet" href="two2" data-precedence="two" />
          <link rel="stylesheet" href="three1" data-precedence="three" />
          <style data-href="three2" data-precedence="three">
            {css}
          </style>
          <style data-href="four1" data-precedence="four">
            {css}
          </style>
          <style data-href="four2" data-precedence="four">
            {css}
          </style>
          <link rel="stylesheet" href="five1" data-precedence="five" />
        </head>
        <body>
          <link rel="preload" href="one2" as="style" />
          <link rel="preload" href="two2" as="style" />
          <link rel="preload" href="five1" as="style" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('block2');
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="one1" data-precedence="one" />
          <link rel="stylesheet" href="one2" data-precedence="one" />
          <style data-href="one3" data-precedence="one">
            {css}
          </style>
          <style data-href="two1" data-precedence="two">
            {css}
          </style>
          <link rel="stylesheet" href="two2" data-precedence="two" />
          <style data-href="two3" data-precedence="two">
            {css}
          </style>
          <link rel="stylesheet" href="three1" data-precedence="three" />
          <style data-href="three2" data-precedence="three">
            {css}
          </style>
          <link rel="stylesheet" href="three3" data-precedence="three" />
          <style data-href="four1" data-precedence="four">
            {css}
          </style>
          <style data-href="four2" data-precedence="four">
            {css}
          </style>
          <link rel="stylesheet" href="four3" data-precedence="four" />
          <link rel="stylesheet" href="five1" data-precedence="five" />
          <style data-href="six1" data-precedence="six">
            {css}
          </style>
        </head>
        <body>
          <link rel="preload" href="one2" as="style" />
          <link rel="preload" href="two2" as="style" />
          <link rel="preload" href="five1" as="style" />
          <link rel="preload" href="three3" as="style" />
          <link rel="preload" href="four3" as="style" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('block again');
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="one1" data-precedence="one" />
          <link rel="stylesheet" href="one2" data-precedence="one" />
          <style data-href="one3" data-precedence="one">
            {css}
          </style>
          <style data-href="two1" data-precedence="two">
            {css}
          </style>
          <link rel="stylesheet" href="two2" data-precedence="two" />
          <style data-href="two3" data-precedence="two">
            {css}
          </style>
          <link rel="stylesheet" href="three1" data-precedence="three" />
          <style data-href="three2" data-precedence="three">
            {css}
          </style>
          <link rel="stylesheet" href="three3" data-precedence="three" />
          <style data-href="four1" data-precedence="four">
            {css}
          </style>
          <style data-href="four2" data-precedence="four">
            {css}
          </style>
          <link rel="stylesheet" href="four3" data-precedence="four" />
          <link rel="stylesheet" href="five1" data-precedence="five" />
          <style data-href="six1" data-precedence="six">
            {css}
          </style>
        </head>
        <body>
          <link rel="preload" href="one2" as="style" />
          <link rel="preload" href="two2" as="style" />
          <link rel="preload" href="five1" as="style" />
          <link rel="preload" href="three3" as="style" />
          <link rel="preload" href="four3" as="style" />
        </body>
      </html>,
    );

    ReactDOMClient.hydrateRoot(
      document,
      <html>
        <body>
          <link rel="stylesheet" href="one4" precedence="one" />
          <style href="two4" precedence="two">
            {css}
          </style>
          <link rel="stylesheet" href="three4" precedence="three" />
          <style href="four4" precedence="four">
            {css}
          </style>
          <link rel="stylesheet" href="seven1" precedence="seven" />
          <style href="eight1" precedence="eight">
            {css}
          </style>
        </body>
      </html>,
    );
    expect(Scheduler).toFlushWithoutYielding();

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="one1" data-precedence="one" />
          <link rel="stylesheet" href="one2" data-precedence="one" />
          <style data-href="one3" data-precedence="one">
            {css}
          </style>
          <link rel="stylesheet" href="one4" data-precedence="one" />
          <style data-href="two1" data-precedence="two">
            {css}
          </style>
          <link rel="stylesheet" href="two2" data-precedence="two" />
          <style data-href="two3" data-precedence="two">
            {css}
          </style>
          <style data-href="two4" data-precedence="two">
            {css}
          </style>
          <link rel="stylesheet" href="three1" data-precedence="three" />
          <style data-href="three2" data-precedence="three">
            {css}
          </style>
          <link rel="stylesheet" href="three3" data-precedence="three" />
          <link rel="stylesheet" href="three4" data-precedence="three" />
          <style data-href="four1" data-precedence="four">
            {css}
          </style>
          <style data-href="four2" data-precedence="four">
            {css}
          </style>
          <link rel="stylesheet" href="four3" data-precedence="four" />
          <style data-href="four4" data-precedence="four">
            {css}
          </style>
          <link rel="stylesheet" href="five1" data-precedence="five" />
          <style data-href="six1" data-precedence="six">
            {css}
          </style>
          <link rel="stylesheet" href="seven1" data-precedence="seven" />
          <style data-href="eight1" data-precedence="eight">
            {css}
          </style>
          <link rel="preload" href="one4" as="style" />
          <link rel="preload" href="three4" as="style" />
          <link rel="preload" href="seven1" as="style" />
        </head>
        <body>
          <link rel="preload" href="one2" as="style" />
          <link rel="preload" href="two2" as="style" />
          <link rel="preload" href="five1" as="style" />
          <link rel="preload" href="three3" as="style" />
          <link rel="preload" href="four3" as="style" />
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('client renders a boundary if a style Resource dependency fails to load', async () => {
    function App() {
      return (
        <html>
          <head />
          <body>
            <Suspense fallback="loading...">
              <BlockedOn value="unblock">
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
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });

    await act(() => {
      resolveText('unblock');
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="arbitrary" />
          <link rel="stylesheet" href="bar" data-precedence="arbitrary" />
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

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="arbitrary" />
          <link rel="stylesheet" href="bar" data-precedence="arbitrary" />
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="arbitrary" />
          <link rel="stylesheet" href="bar" data-precedence="arbitrary" />
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
      const {pipe} = renderToPipeableStream(
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="arbitrary" />
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="arbitrary" />
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
      const {pipe} = renderToPipeableStream(
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

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="bar" data-precedence="two" />
          <link rel="stylesheet" href="baz" data-precedence="three" />
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
    function PresetPrecedence() {
      ReactDOM.preinit('preset', {as: 'style', precedence: 'preset'});
    }
    await actIntoEmptyDocument(() => {
      const {pipe} = renderToPipeableStream(
        <html>
          <head />
          <body>
            <link rel="stylesheet" href="initial" precedence="one" />
            <PresetPrecedence />
            <div>
              <Suspense fallback="loading foo bar...">
                <div>foo</div>
                <link rel="stylesheet" href="foo" precedence="one" />
                <BlockedOn value="bar">
                  <div>bar</div>
                  <link rel="stylesheet" href="bar" precedence="default" />
                </BlockedOn>
              </Suspense>
            </div>
            <div>
              <Suspense fallback="loading bar baz qux...">
                <BlockedOn value="bar">
                  <div>bar</div>
                  <link rel="stylesheet" href="bar" precedence="default" />
                </BlockedOn>
                <BlockedOn value="baz">
                  <div>baz</div>
                  <link rel="stylesheet" href="baz" precedence="two" />
                </BlockedOn>
                <BlockedOn value="qux">
                  <div>qux</div>
                  <link rel="stylesheet" href="qux" precedence="one" />
                </BlockedOn>
              </Suspense>
            </div>
            <div>
              <Suspense fallback="loading bar baz qux...">
                <BlockedOn value="unblock">
                  <BlockedOn value="bar">
                    <div>bar</div>
                    <link rel="stylesheet" href="bar" precedence="default" />
                  </BlockedOn>
                  <BlockedOn value="baz">
                    <div>baz</div>
                    <link rel="stylesheet" href="baz" precedence="two" />
                  </BlockedOn>
                  <BlockedOn value="qux">
                    <div>qux</div>
                    <link rel="stylesheet" href="qux" precedence="one" />
                  </BlockedOn>
                </BlockedOn>
              </Suspense>
            </div>
          </body>
        </html>,
      );
      pipe(writable);
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-precedence="one" />
          <link rel="stylesheet" href="preset" data-precedence="preset" />
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

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-precedence="one" />
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="preset" data-precedence="preset" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>loading foo bar...</div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
          <link rel="preload" href="bar" as="style" />
        </body>
      </html>,
    );

    await act(() => {
      const link = document.querySelector('link[rel="stylesheet"][href="foo"]');
      const event = document.createEvent('Events');
      event.initEvent('load', true, true);
      link.dispatchEvent(event);
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-precedence="one" />
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="preset" data-precedence="preset" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>loading foo bar...</div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
          <link rel="preload" href="bar" as="style" />
        </body>
      </html>,
    );

    await act(() => {
      const link = document.querySelector('link[rel="stylesheet"][href="bar"]');
      const event = document.createEvent('Events');
      event.initEvent('load', true, true);
      link.dispatchEvent(event);
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-precedence="one" />
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="preset" data-precedence="preset" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>
            <div>foo</div>
            <div>bar</div>
          </div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
          <link rel="preload" href="bar" as="style" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('baz');
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-precedence="one" />
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="preset" data-precedence="preset" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>
            <div>foo</div>
            <div>bar</div>
          </div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
          <link rel="preload" as="style" href="bar" />
          <link rel="preload" as="style" href="baz" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('qux');
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-precedence="one" />
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="qux" data-precedence="one" />
          <link rel="stylesheet" href="preset" data-precedence="preset" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="stylesheet" href="baz" data-precedence="two" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>
            <div>foo</div>
            <div>bar</div>
          </div>
          <div>loading bar baz qux...</div>
          <div>loading bar baz qux...</div>
          <link rel="preload" as="style" href="bar" />
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
      const presetLink = document.querySelector(
        'link[rel="stylesheet"][href="preset"]',
      );
      const event = document.createEvent('Events');
      event.initEvent('load', true, true);
      bazlink.dispatchEvent(event);
      quxlink.dispatchEvent(event);
      presetLink.dispatchEvent(event);
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-precedence="one" />
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="qux" data-precedence="one" />
          <link rel="stylesheet" href="preset" data-precedence="preset" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="stylesheet" href="baz" data-precedence="two" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>
            <div>foo</div>
            <div>bar</div>
          </div>
          <div>
            <div>bar</div>
            <div>baz</div>
            <div>qux</div>
          </div>
          <div>loading bar baz qux...</div>
          <link rel="preload" as="style" href="bar" />
          <link rel="preload" as="style" href="baz" />
          <link rel="preload" as="style" href="qux" />
        </body>
      </html>,
    );

    await act(() => {
      resolveText('unblock');
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="initial" data-precedence="one" />
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="qux" data-precedence="one" />
          <link rel="stylesheet" href="preset" data-precedence="preset" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="stylesheet" href="baz" data-precedence="two" />
          <link rel="preload" href="foo" as="style" />
        </head>
        <body>
          <div>
            <div>foo</div>
            <div>bar</div>
          </div>
          <div>
            <div>bar</div>
            <div>baz</div>
            <div>qux</div>
          </div>
          <div>
            <div>bar</div>
            <div>baz</div>
            <div>qux</div>
          </div>
          <link rel="preload" as="style" href="bar" />
          <link rel="preload" as="style" href="baz" />
          <link rel="preload" as="style" href="qux" />
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('normalizes stylesheet resource precedence for all boundaries inlined as part of the shell flush', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = renderToPipeableStream(
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

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="1one" data-precedence="one" />
          <link rel="stylesheet" href="2one" data-precedence="one" />
          <link rel="stylesheet" href="3one" data-precedence="one" />
          <link rel="stylesheet" href="4one" data-precedence="one" />

          <link rel="stylesheet" href="1two" data-precedence="two" />
          <link rel="stylesheet" href="2two" data-precedence="two" />
          <link rel="stylesheet" href="3two" data-precedence="two" />
          <link rel="stylesheet" href="4two" data-precedence="two" />

          <link rel="stylesheet" href="1three" data-precedence="three" />
          <link rel="stylesheet" href="2three" data-precedence="three" />
          <link rel="stylesheet" href="3three" data-precedence="three" />
          <link rel="stylesheet" href="4three" data-precedence="three" />

          <link rel="stylesheet" href="1four" data-precedence="four" />
          <link rel="stylesheet" href="2four" data-precedence="four" />
          <link rel="stylesheet" href="3four" data-precedence="four" />
          <link rel="stylesheet" href="4four" data-precedence="four" />

          <link rel="stylesheet" href="3five" data-precedence="five" />
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
  it('stylesheet resources are inserted according to precedence order on the client', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = renderToPipeableStream(
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

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="bar" data-precedence="two" />
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="bar" data-precedence="two" />
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="one" />
          <link rel="stylesheet" href="baz" data-precedence="one" />
          <link rel="stylesheet" href="bar" data-precedence="two" />
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
    expect(getMeaningfulChildren(document)).toEqual(
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
  it('will include child boundary stylesheet resources in the boundary reveal instruction', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = renderToPipeableStream(
        <html>
          <head />
          <body>
            <div>
              <Suspense fallback="loading foo...">
                <BlockedOn value="foo">
                  <div>foo</div>
                  <link rel="stylesheet" href="foo" precedence="default" />
                  <Suspense fallback="loading bar...">
                    <BlockedOn value="bar">
                      <div>bar</div>
                      <link rel="stylesheet" href="bar" precedence="default" />
                      <Suspense fallback="loading baz...">
                        <BlockedOn value="baz">
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

    expect(getMeaningfulChildren(document)).toEqual(
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
    expect(getMeaningfulChildren(document)).toEqual(
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
    expect(getMeaningfulChildren(document)).toEqual(
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="default" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="stylesheet" href="baz" data-precedence="default" />
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="default" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="stylesheet" href="baz" data-precedence="default" />
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
    await actIntoEmptyDocument(() => {
      const {pipe} = renderToPipeableStream(
        <html>
          <head />
          <body>
            <div>
              <Suspense fallback="loading...">
                <div>
                  <BlockedOn value="foo">
                    <div>foo</div>
                    <link rel="stylesheet" href="foo" precedence="default" />
                    <Suspense fallback="loading bar...">
                      <BlockedOn value="bar">
                        <div>bar</div>
                        <link
                          rel="stylesheet"
                          href="bar"
                          precedence="default"
                        />
                        <Suspense fallback="loading baz...">
                          <div>
                            <BlockedOn value="baz">
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
                  <BlockedOn value="qux">
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

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading...</div>
        </body>
      </html>,
    );

    // This will enqueue a stylesheet resource in a deep blocked boundary (loading baz...).
    await act(() => {
      resolveText('baz');
    });
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head />
        <body>
          <div>loading...</div>
        </body>
      </html>,
    );

    // This will enqueue a stylesheet resource in the intermediate blocked boundary (loading bar...).
    await act(() => {
      resolveText('bar');
    });
    expect(getMeaningfulChildren(document)).toEqual(
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
    expect(getMeaningfulChildren(document)).toEqual(
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="default" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="stylesheet" href="baz" data-precedence="default" />
          <link rel="stylesheet" href="qux" data-precedence="default" />
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="foo" data-precedence="default" />
          <link rel="stylesheet" href="bar" data-precedence="default" />
          <link rel="stylesheet" href="baz" data-precedence="default" />
          <link rel="stylesheet" href="qux" data-precedence="default" />
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
    function App() {
      return (
        <html>
          <head />
          <body>
            <div>
              <link
                // This preload is explicit so it can flush with a lot of potential attrs
                // We will duplicate this as a style that flushes after the shell
                rel="stylesheet"
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
                <BlockedOn value="unblock">
                  <link
                    // This preload is explicit so it can flush with a lot of potential attrs
                    // We will duplicate this as a style that flushes after the shell
                    rel="stylesheet"
                    href="bar"
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
    await expect(async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link
              rel="stylesheet"
              href="foo"
              data-precedence="default"
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
    }).toErrorDev([
      'React does not recognize the `nonStandardAttr` prop on a DOM element.' +
        ' If you intentionally want it to appear in the DOM as a custom attribute,' +
        ' spell it as lowercase `nonstandardattr` instead. If you accidentally passed it from a' +
        ' parent component, remove it from the DOM element.',
      'Invalid values for props `shouldnotincludefunctions`, `norsymbols` on <link> tag. Either remove them from' +
        ' the element, or pass a string or number value to keep them in the DOM. For' +
        ' details, see https://reactjs.org/link/attribute-behavior',
    ]);

    // Now we flush the stylesheet with the boundary
    await act(() => {
      resolveText('unblock');
    });

    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link
            rel="stylesheet"
            href="foo"
            data-precedence="default"
            crossorigin="anonymous"
            media="all"
            integrity="somehash"
            referrerpolicy="origin"
            data-foo={'"quoted"'}
            nonstandardattr="attr"
            properlyformattednonstandardattr="attr"
          />
          <link
            rel="stylesheet"
            href="bar"
            data-precedence="default"
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
          <link
            rel="preload"
            as="style"
            href="bar"
            crossorigin="anonymous"
            media="all"
            integrity="somehash"
            referrerpolicy="origin"
          />
        </body>
      </html>,
    );
  });

  // @gate enableFloat
  it('boundary stylesheet resource dependencies hoist to a parent boundary when flushed inline', async () => {
    await actIntoEmptyDocument(() => {
      const {pipe} = renderToPipeableStream(
        <html>
          <head />
          <body>
            <div>
              <Suspense fallback="loading A...">
                <BlockedOn value="unblock">
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
    expect(getMeaningfulChildren(document)).toEqual(
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
    expect(getMeaningfulChildren(document)).toEqual(
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="A" data-precedence="A" />
          <link rel="stylesheet" href="AA" data-precedence="AA" />
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
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link rel="stylesheet" href="A" data-precedence="A" />
          <link rel="stylesheet" href="AA" data-precedence="AA" />
          <link rel="stylesheet" href="AAA" data-precedence="AAA" />
          <link rel="stylesheet" href="AAAA" data-precedence="AAAA" />
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
    function App() {
      ReactDOM.preload('foo', {as: 'font', type: 'font/woff2'});
      ReactDOM.preload('bar', {as: 'font', crossOrigin: 'foo'});
      ReactDOM.preload('baz', {as: 'font', crossOrigin: 'use-credentials'});
      ReactDOM.preload('qux', {as: 'font', crossOrigin: 'anonymous'});
      return (
        <html>
          <head />
          <body />
        </html>
      );
    }
    await actIntoEmptyDocument(() => {
      const {pipe} = renderToPipeableStream(<App />);
      pipe(writable);
    });
    expect(getMeaningfulChildren(document)).toEqual(
      <html>
        <head>
          <link
            rel="preload"
            as="font"
            href="foo"
            crossorigin=""
            type="font/woff2"
          />
          <link rel="preload" as="font" href="bar" crossorigin="" />
          <link rel="preload" as="font" href="baz" crossorigin="" />
          <link rel="preload" as="font" href="qux" crossorigin="" />
        </head>
        <body />
      </html>,
    );
  });

  describe('ReactDOM.prefetchDNS(href)', () => {
    it('creates a dns-prefetch resource when called', async () => {
      function App({url}) {
        ReactDOM.prefetchDNS(url);
        ReactDOM.prefetchDNS(url);
        ReactDOM.prefetchDNS(url, {});
        ReactDOM.prefetchDNS(url, {crossOrigin: 'use-credentials'});
        return (
          <html>
            <body>hello world</body>
          </html>
        );
      }

      await expect(async () => {
        await actIntoEmptyDocument(() => {
          renderToPipeableStream(<App url="foo" />).pipe(writable);
        });
      }).toErrorDev([
        'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered something with type "object" as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
        'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered something with type "object" as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
      ]);

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="dns-prefetch" href="foo" />
          </head>
          <body>hello world</body>
        </html>,
      );

      const root = ReactDOMClient.hydrateRoot(document, <App url="foo" />);
      expect(() => {
        expect(Scheduler).toFlushWithoutYielding();
      }).toErrorDev([
        'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered something with type "object" as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
        'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered something with type "object" as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
      ]);
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="dns-prefetch" href="foo" />
          </head>
          <body>hello world</body>
        </html>,
      );

      root.render(<App url="bar" />);
      expect(() => {
        expect(Scheduler).toFlushWithoutYielding();
      }).toErrorDev([
        'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered something with type "object" as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
        'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered something with type "object" as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
      ]);
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="dns-prefetch" href="foo" />
            <link rel="dns-prefetch" href="bar" />
          </head>
          <body>hello world</body>
        </html>,
      );
    });
  });

  describe('ReactDOM.preconnect(href, { crossOrigin })', () => {
    it('creates a preconnect resource when called', async () => {
      function App({url}) {
        ReactDOM.preconnect(url);
        ReactDOM.preconnect(url);
        ReactDOM.preconnect(url, {crossOrigin: true});
        ReactDOM.preconnect(url, {crossOrigin: ''});
        ReactDOM.preconnect(url, {crossOrigin: 'anonymous'});
        ReactDOM.preconnect(url, {crossOrigin: 'use-credentials'});
        return (
          <html>
            <body>hello world</body>
          </html>
        );
      }

      await expect(async () => {
        await actIntoEmptyDocument(() => {
          renderToPipeableStream(<App url="foo" />).pipe(writable);
        });
      }).toErrorDev(
        'ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered something with type "boolean" instead. Try removing this option or passing a string value instead.',
      );

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preconnect" href="foo" />
            <link rel="preconnect" href="foo" crossorigin="" />
            <link rel="preconnect" href="foo" crossorigin="use-credentials" />
          </head>
          <body>hello world</body>
        </html>,
      );

      const root = ReactDOMClient.hydrateRoot(document, <App url="foo" />);
      expect(() => {
        expect(Scheduler).toFlushWithoutYielding();
      }).toErrorDev(
        'ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered something with type "boolean" instead. Try removing this option or passing a string value instead.',
      );
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preconnect" href="foo" />
            <link rel="preconnect" href="foo" crossorigin="" />
            <link rel="preconnect" href="foo" crossorigin="use-credentials" />
          </head>
          <body>hello world</body>
        </html>,
      );

      root.render(<App url="bar" />);
      expect(() => {
        expect(Scheduler).toFlushWithoutYielding();
      }).toErrorDev(
        'ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered something with type "boolean" instead. Try removing this option or passing a string value instead.',
      );
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preconnect" href="foo" />
            <link rel="preconnect" href="foo" crossorigin="" />
            <link rel="preconnect" href="foo" crossorigin="use-credentials" />
            <link rel="preconnect" href="bar" />
            <link rel="preconnect" href="bar" crossorigin="" />
            <link rel="preconnect" href="bar" crossorigin="use-credentials" />
          </head>
          <body>hello world</body>
        </html>,
      );
    });
  });

  describe('ReactDOM.preload(href, { as: ... })', () => {
    // @gate enableFloat
    it('creates a preload resource when called', async () => {
      function App() {
        ReactDOM.preload('foo', {as: 'style'});
        return (
          <html>
            <body>
              <Suspense fallback="loading...">
                <BlockedOn value="blocked">
                  <Component />
                </BlockedOn>
              </Suspense>
            </body>
          </html>
        );
      }
      function Component() {
        ReactDOM.preload('bar', {as: 'script'});
        return <div>hello</div>;
      }

      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="foo" />
          </head>
          <body>loading...</body>
        </html>,
      );

      await act(() => {
        resolveText('blocked');
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="foo" />
          </head>
          <body>
            <div>hello</div>
            <link rel="preload" as="script" href="bar" />
          </body>
        </html>,
      );

      function ClientApp() {
        ReactDOM.preload('foo', {as: 'style'});
        ReactDOM.preload('font', {as: 'font', type: 'font/woff2'});
        React.useInsertionEffect(() => ReactDOM.preload('bar', {as: 'script'}));
        React.useLayoutEffect(() => ReactDOM.preload('baz', {as: 'font'}));
        React.useEffect(() => ReactDOM.preload('qux', {as: 'style'}));
        return (
          <html>
            <body>
              <Suspense fallback="loading...">
                <div>hello</div>
              </Suspense>
            </body>
          </html>
        );
      }
      ReactDOMClient.hydrateRoot(document, <ClientApp />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" as="style" href="foo" />
            <link
              rel="preload"
              as="font"
              href="font"
              crossorigin=""
              type="font/woff2"
            />
            <link rel="preload" as="font" href="baz" crossorigin="" />
            <link rel="preload" as="style" href="qux" />
          </head>
          <body>
            <div>hello</div>
            <link rel="preload" as="script" href="bar" />
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('can seed connection props for stylesheet and script resources', async () => {
      function App() {
        ReactDOM.preload('foo', {
          as: 'style',
          crossOrigin: 'use-credentials',
          integrity: 'some hash',
        });
        return (
          <html>
            <body>
              <div>hello</div>
              <link rel="stylesheet" href="foo" precedence="default" />
            </body>
          </html>
        );
      }

      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link
              rel="stylesheet"
              href="foo"
              data-precedence="default"
              crossorigin="use-credentials"
              integrity="some hash"
            />
          </head>
          <body>
            <div>hello</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('warns if you do not pass in a valid href argument or options argument', async () => {
      function App() {
        ReactDOM.preload();
        ReactDOM.preload('');
        ReactDOM.preload('foo', null);
        ReactDOM.preload('foo', {});
        ReactDOM.preload('foo', {as: 'foo'});
        return <div>foo</div>;
      }

      await expect(async () => {
        await act(() => {
          renderToPipeableStream(<App />).pipe(writable);
        });
      }).toErrorDev([
        'ReactDOM.preload(): Expected the `href` argument (first) to be a non-empty string but encountered `undefined` instead.',
        'ReactDOM.preload(): Expected the `href` argument (first) to be a non-empty string but encountered an empty string instead.',
        'ReactDOM.preload(): Expected the `options` argument (second) to be an object with an `as` property describing the type of resource to be preloaded but encountered `null` instead.',
        'ReactDOM.preload(): Expected the `as` property in the `options` argument (second) to contain a string value describing the type of resource to be preloaded but encountered `undefined` instead. Values that are valid in for the `as` attribute of a `<link rel="preload" as="..." />` tag are valid here.',
      ]);
    });

    // @gate enableFloat
    it('warns if you pass incompatible options to two `ReactDOM.preload(...)` with the same href', async () => {
      function Component() {
        ReactDOM.preload('foo', {
          as: 'font',
          crossOrigin: 'use-credentials',
        });
        ReactDOM.preload('foo', {
          as: 'font',
          integrity: 'some hash',
          crossOrigin: 'anonymous',
        });
        ReactDOM.preload('foo', {
          as: 'font',
          extra: 'ignored',
        });
      }

      await expect(async () => {
        await actIntoEmptyDocument(() => {
          renderToPipeableStream(
            <html>
              <body>
                <Component />
              </body>
            </html>,
          );
        });
      }).toErrorDev([
        'Warning: ReactDOM.preload(): The options provided conflict with another call to `ReactDOM.preload("foo", { as: "font", ...})`. React will always use the options it first encounters when preloading a resource for a given `href` and `as` type, and any later options will be ignored if different. Try updating all calls to `ReactDOM.preload()` with the same `href` and `as` type to use the same options, or eliminate one of the calls.\n  "integrity" option value: "some hash", missing from original options\n  "crossOrigin" option value: "anonymous", original option value: "use-credentials"',
        'Warning: ReactDOM.preload(): The options provided conflict with another call to `ReactDOM.preload("foo", { as: "font", ...})`. React will always use the options it first encounters when preloading a resource for a given `href` and `as` type, and any later options will be ignored if different. Try updating all calls to `ReactDOM.preload()` with the same `href` and `as` type to use the same options, or eliminate one of the calls.\n  "crossOrigin" missing from options, original option value: "use-credentials"',
      ]);
    });

    // @gate enableFloat
    it('warns if you pass incompatible options to two `ReactDOM.preload(...)` when an implicit preload already exists with the same href', async () => {
      function Component() {
        ReactDOM.preload('foo', {
          as: 'style',
          crossOrigin: 'use-credentials',
        });
      }

      await expect(async () => {
        await actIntoEmptyDocument(() => {
          renderToPipeableStream(
            <html>
              <body>
                <link
                  rel="stylesheet"
                  href="foo"
                  integrity="some hash"
                  media="print"
                />
                <Component />
              </body>
            </html>,
          );
        });
      }).toErrorDev([
        'ReactDOM.preload(): For `href` "foo", The options provided conflict with props on a matching <link rel="stylesheet" ... /> element. When the preload options disagree with the underlying resource it usually means the browser will not be able to use the preload when the resource is fetched, negating any benefit the preload would provide. React will preload the resource using props derived from the resource instead and ignore the options provided to the `ReactDOM.preload()` call. In general, preloading is useful when you expect to render a resource soon but have not yet done so. In this case since the underlying resource was already rendered the preload call may be extraneous. Try removing the call, otherwise try adjusting both the props on the <link rel="stylesheet" ... /> and the options passed to `ReactDOM.preload()` to agree.\n  "integrity" missing from options, underlying prop value: "some hash"\n  "media" missing from options, underlying prop value: "print"\n  "crossOrigin" option value: "use-credentials", missing from underlying props',
      ]);
    });
  });

  describe('ReactDOM.preinit(href, { as: ... })', () => {
    // @gate enableFloat
    it('creates a stylesheet resource when ReactDOM.preinit(..., {as: "style" }) is called', async () => {
      function App() {
        ReactDOM.preinit('foo', {as: 'style'});
        return (
          <html>
            <body>
              <Suspense fallback="loading...">
                <BlockedOn value="bar">
                  <Component />
                </BlockedOn>
              </Suspense>
            </body>
          </html>
        );
      }

      function Component() {
        ReactDOM.preinit('bar', {as: 'style'});
        return <div>hello</div>;
      }

      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-precedence="default" />
          </head>
          <body>loading...</body>
        </html>,
      );

      await act(() => {
        resolveText('bar');
      });
      // The reason we do not see the "bar" stylesheet here is that ReactDOM.preinit is not about
      // encoding a resource dependency but is a hint that a resource will be used in the near future.
      // If we call preinit on the server after the shell has flushed the best we can do is emit a preload
      // because any flushing suspense boundaries are not actually dependent on that resource and we don't
      // want to delay reveal based on when that resource loads.
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-precedence="default" />
          </head>
          <body>
            <div>hello</div>
            <link rel="preload" href="bar" as="style" />
          </body>
        </html>,
      );

      function ClientApp() {
        ReactDOM.preinit('bar', {as: 'style'});
        return (
          <html>
            <body>
              <Suspense fallback="loading...">
                <div>hello</div>
              </Suspense>
            </body>
          </html>
        );
      }

      ReactDOMClient.hydrateRoot(document, <ClientApp />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-precedence="default" />
            <link rel="stylesheet" href="bar" data-precedence="default" />
          </head>
          <body>
            <div>hello</div>
            <link rel="preload" href="bar" as="style" />
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('creates a preload resource when ReactDOM.preinit(..., {as: "style" }) is called outside of render on the client', async () => {
      function App() {
        React.useEffect(() => {
          ReactDOM.preinit('foo', {as: 'style'});
        }, []);
        return (
          <html>
            <body>foo</body>
          </html>
        );
      }

      const root = ReactDOMClient.createRoot(document);
      root.render(<App />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" href="foo" as="style" />
          </head>
          <body>foo</body>
        </html>,
      );
    });

    // @gate enableFloat
    it('creates a script resource when ReactDOM.preinit(..., {as: "script" }) is called', async () => {
      function App() {
        ReactDOM.preinit('foo', {as: 'script'});
        return (
          <html>
            <body>
              <Suspense fallback="loading...">
                <BlockedOn value="bar">
                  <Component />
                </BlockedOn>
              </Suspense>
            </body>
          </html>
        );
      }

      function Component() {
        ReactDOM.preinit('bar', {as: 'script'});
        return <div>hello</div>;
      }

      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <script async="" src="foo" />
          </head>
          <body>loading...</body>
        </html>,
      );

      await act(() => {
        resolveText('bar');
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <script async="" src="foo" />
          </head>
          <body>
            <div>hello</div>
            <script async="" src="bar" />
          </body>
        </html>,
      );

      function ClientApp() {
        ReactDOM.preinit('bar', {as: 'script'});
        return (
          <html>
            <body>
              <Suspense fallback="loading...">
                <div>hello</div>
              </Suspense>
            </body>
          </html>
        );
      }

      ReactDOMClient.hydrateRoot(document, <ClientApp />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <script async="" src="foo" />
          </head>
          <body>
            <div>hello</div>
            <script async="" src="bar" />
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('creates a preload resource when ReactDOM.preinit(..., {as: "script" }) is called outside of render on the client', async () => {
      function App() {
        React.useEffect(() => {
          ReactDOM.preinit('foo', {as: 'script'});
        }, []);
        return (
          <html>
            <body>foo</body>
          </html>
        );
      }

      const root = ReactDOMClient.createRoot(document);
      root.render(<App />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="preload" href="foo" as="script" />
          </head>
          <body>foo</body>
        </html>,
      );
    });

    // @gate enableFloat
    it('warns if you do not pass in a valid href argument or options argument', async () => {
      function App() {
        ReactDOM.preinit();
        ReactDOM.preinit('');
        ReactDOM.preinit('foo', null);
        ReactDOM.preinit('foo', {});
        ReactDOM.preinit('foo', {as: 'foo'});
        return <div>foo</div>;
      }

      await expect(async () => {
        await act(() => {
          renderToPipeableStream(<App />).pipe(writable);
        });
      }).toErrorDev([
        'ReactDOM.preinit(): Expected the `href` argument (first) to be a non-empty string but encountered `undefined` instead',
        'ReactDOM.preinit(): Expected the `href` argument (first) to be a non-empty string but encountered an empty string instead',
        'ReactDOM.preinit(): Expected the `options` argument (second) to be an object with an `as` property describing the type of resource to be preinitialized but encountered `null` instead',
        'ReactDOM.preinit(): Expected the `as` property in the `options` argument (second) to contain a valid value describing the type of resource to be preinitialized but encountered `undefined` instead. Valid values for `as` are "style" and "script".',
        'ReactDOM.preinit(): Expected the `as` property in the `options` argument (second) to contain a valid value describing the type of resource to be preinitialized but encountered "foo" instead. Valid values for `as` are "style" and "script".',
      ]);
    });

    // @gate enableFloat
    it('warns if you pass options to `ReactDOM.preinit(..., { as: "style", ... })` incompatible with props from an existing <link rel="stylesheet" .../>', async () => {
      function Component() {
        ReactDOM.preinit('foo', {
          as: 'style',
          integrity: 'some hash',
          crossOrigin: 'use-credentials',
        });
      }

      await expect(async () => {
        await actIntoEmptyDocument(() => {
          renderToPipeableStream(
            <html>
              <body>
                <link
                  rel="stylesheet"
                  href="foo"
                  precedence="foo"
                  crossOrigin="anonymous"
                />
                <Component />
              </body>
            </html>,
          );
        });
      }).toErrorDev([
        'ReactDOM.preinit(): For `href` "foo", the options provided conflict with props found on a <link rel="stylesheet" precedence="foo" href="foo" .../> that was already rendered. React will always use the props or options it first encounters for a hoistable stylesheet for a given `href` and any later props or options will be ignored if different. Generally, ReactDOM.preinit() is useful when you are not yet rendering a stylesheet but you anticipate it will be used soon. In this case the stylesheet was already rendered so preinitializing it does not provide any additional benefit. To resolve, try making the props and options agree between the <link rel="stylesheet" .../> and the `ReactDOM.preinit()` call or remove the `ReactDOM.preinit()` call.\n  "precedence" missing from options, prop value: "foo"\n  "integrity" option value: "some hash", missing from props\n  "crossOrigin" option value: "use-credentials", prop value: "anonymous"',
      ]);
    });

    // @gate enableFloat
    it('warns if you pass incompatible options to two `ReactDOM.preinit(..., { as: "style", ... })` with the same href', async () => {
      function Component() {
        ReactDOM.preinit('foo', {
          as: 'style',
          precedence: 'foo',
          crossOrigin: 'use-credentials',
        });
        ReactDOM.preinit('foo', {
          as: 'style',
          integrity: 'some hash',
          crossOrigin: 'anonymous',
        });
      }

      await expect(async () => {
        await actIntoEmptyDocument(() => {
          renderToPipeableStream(
            <html>
              <body>
                <Component />
              </body>
            </html>,
          );
        });
      }).toErrorDev([
        'ReactDOM.preinit(): For `href` "foo", the options provided conflict with another call to `ReactDOM.preinit("foo", { as: "style", ... })`. React will always use the options it first encounters when preinitializing a hoistable stylesheet for a given `href` and any later options will be ignored if different. Try updating all calls to `ReactDOM.preinit()` for a given `href` to use the same options, or only call `ReactDOM.preinit()` once per `href`.\n  "precedence" missing from options, original option value: "foo"\n  "integrity" option value: "some hash", missing from original options\n  "crossOrigin" option value: "anonymous", original option value: "use-credentials"',
      ]);
    });

    // @gate enableFloat
    it('warns if you pass options to `ReactDOM.preinit(..., { as: "script", ... })` incompatible with props from an existing <script async={true} .../>', async () => {
      function Component() {
        ReactDOM.preinit('foo', {
          as: 'script',
          integrity: 'some hash',
          crossOrigin: 'use-credentials',
        });
      }

      await expect(async () => {
        await actIntoEmptyDocument(() => {
          renderToPipeableStream(
            <html>
              <body>
                <script async={true} src="foo" crossOrigin="anonymous" />
                <Component />
              </body>
            </html>,
          );
        });
      }).toErrorDev([
        'ReactDOM.preinit(): For `href` "foo", the options provided conflict with props found on a <script async={true} src="foo" .../> that was already rendered. React will always use the props or options it first encounters for a hoistable script for a given `href` and any later props or options will be ignored if different. Generally, ReactDOM.preinit() is useful when you are not yet rendering a script but you anticipate it will be used soon and want to go beyond preloading it and have it execute early. In this case the script was already rendered so preinitializing it does not provide any additional benefit. To resolve, try making the props and options agree between the <script .../> and the `ReactDOM.preinit()` call or remove the `ReactDOM.preinit()` call.\n  "integrity" option value: "some hash", missing from props\n  "crossOrigin" option value: "use-credentials", prop value: "anonymous"',
      ]);
    });

    // @gate enableFloat
    it('warns if you pass incompatible options to two `ReactDOM.preinit(..., { as: "script", ... })` with the same href', async () => {
      function Component() {
        ReactDOM.preinit('foo', {
          as: 'script',
          crossOrigin: 'use-credentials',
        });
        ReactDOM.preinit('foo', {
          as: 'script',
          integrity: 'some hash',
          crossOrigin: 'anonymous',
        });
      }

      await expect(async () => {
        await actIntoEmptyDocument(() => {
          renderToPipeableStream(
            <html>
              <body>
                <Component />
              </body>
            </html>,
          );
        });
      }).toErrorDev([
        'ReactDOM.preinit(): For `href` "foo", the options provided conflict with another call to `ReactDOM.preinit("foo", { as: "script", ... })`. React will always use the options it first encounters when preinitializing a hoistable script for a given `href` and any later options will be ignored if different. Try updating all calls to `ReactDOM.preinit()` for a given `href` to use the same options, or only call `ReactDOM.preinit()` once per `href`.\n  "integrity" option value: "some hash", missing from original options\n  "crossOrigin" option value: "anonymous", original option value: "use-credentials"',
      ]);
    });
  });

  describe('Stylesheet Resources', () => {
    // @gate enableFloat
    it('treats link rel stylesheet elements as a stylesheet resource when it includes a precedence when server rendering', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
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

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="aresource" data-precedence="foo" />
          </head>
          <body>
            <div>hello world</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('treats link rel stylesheet elements as a stylesheet resource when it includes a precedence when client rendering', async () => {
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

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="aresource" data-precedence="foo" />
          </head>
          <body>
            <div>hello world</div>
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('treats link rel stylesheet elements as a stylesheet resource when it includes a precedence when hydrating', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
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

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="aresource" data-precedence="foo" />
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
        const {pipe} = renderToPipeableStream(
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

      expect(getMeaningfulChildren(document)).toEqual(
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
    it('hoists stylesheet resources to the correct precedence', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
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
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo1" data-precedence="foo" />
            <link rel="stylesheet" href="foo2" data-precedence="foo" />
            <link rel="stylesheet" href="default1" data-precedence="default" />
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
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo1" data-precedence="foo" />
            <link rel="stylesheet" href="foo2" data-precedence="foo" />
            <link rel="stylesheet" href="foo3" data-precedence="foo" />
            <link rel="stylesheet" href="default1" data-precedence="default" />
            <link rel="stylesheet" href="default2" data-precedence="default" />
            <link rel="stylesheet" href="bar1" data-precedence="bar" />
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
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-precedence="foo" />
          </head>
          <body>hello world</body>
        </html>,
      );
    });

    // @gate enableFloat && enableHostSingletons && enableClientRenderFallbackOnTextMismatch
    it('retains styles even when a new html, head, and/body mount', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
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
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-precedence="foo" />
            <link rel="stylesheet" href="bar" data-precedence="bar" />
            <link rel="stylesheet" href="qux" data-precedence="qux" />
          </head>
          <body>client</body>
        </html>,
      );
    });

    // @gate enableFloat && !enableHostSingletons
    it('retains styles even when a new html, head, and/body mount - without HostSingleton', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
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
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="qux" data-precedence="qux" />
            <link rel="stylesheet" href="foo" data-precedence="foo" />
          </head>
          <body>client</body>
        </html>,
      );
    });

    // @gate enableFloat && enableHostSingletons
    it('retains styles in head through head remounts', async () => {
      const root = ReactDOMClient.createRoot(document);
      root.render(
        <html>
          <head key={1} />
          <body>
            <link rel="stylesheet" href="foo" precedence="foo" />
            <link rel="stylesheet" href="bar" precedence="bar" />
            {null}
            hello
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-precedence="foo" />
            <link rel="stylesheet" href="bar" data-precedence="bar" />
          </head>
          <body>hello</body>
        </html>,
      );

      root.render(
        <html>
          <head key={2} />
          <body>
            <link rel="stylesheet" href="foo" precedence="foo" />
            {null}
            <link rel="stylesheet" href="baz" precedence="baz" />
            hello
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      // The reason we do not see preloads in the head is they are inserted synchronously
      // during render and then when the new singleton mounts it resets it's content, retaining only styles
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-precedence="foo" />
            <link rel="stylesheet" href="bar" data-precedence="bar" />
            <link rel="stylesheet" href="baz" data-precedence="baz" />
            <link rel="preload" href="baz" as="style" />
          </head>
          <body>hello</body>
        </html>,
      );
    });
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
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-precedence="default" />
            <link rel="preload" href="foo" as="style" />
          </head>
          <body>
            <div id="container">container</div>
          </body>
        </html>,
      );
      expect(getMeaningfulChildren(shadow)).toEqual([
        <link
          rel="stylesheet"
          href="foo"
          data-precedence="different"
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
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="foo" data-precedence="default" />
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
      expect(getMeaningfulChildren(shadow)).toEqual([
        <link rel="stylesheet" href="foo" data-precedence="one" />,
        <link rel="stylesheet" href="baz" data-precedence="one" />,
        <link rel="stylesheet" href="bar" data-precedence="two" />,
        <link rel="stylesheet" href="qux" data-precedence="three" />,
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
    // @gate enableFloat
    it('escapes hrefs when selecting matching elements in the document when rendering Resources', async () => {
      function App() {
        ReactDOM.preload('preload', {as: 'style'});
        ReactDOM.preload('with\nnewline', {as: 'style'});
        return (
          <html>
            <head />
            <body>
              <link rel="stylesheet" href="style" precedence="style" />
              <link rel="stylesheet" href="with\slashes" precedence="style" />
              <div id="container" />
            </body>
          </html>
        );
      }
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(<App />);
        pipe(writable);
      });

      container = document.getElementById('container');
      const root = ReactDOMClient.createRoot(container);

      function ClientApp() {
        ReactDOM.preload('preload', {as: 'style'});
        ReactDOM.preload('with\nnewline', {as: 'style'});
        return (
          <div>
            <link
              rel="stylesheet"
              href={'style"][rel="stylesheet'}
              precedence="style"
            />
            <link rel="stylesheet" href="with\slashes" precedence="style" />
            foo
          </div>
        );
      }
      root.render(<ClientApp />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="style" data-precedence="style" />
            <link
              rel="stylesheet"
              href="with\slashes"
              data-precedence="style"
            />
            <link
              rel="stylesheet"
              href={'style"][rel="stylesheet'}
              data-precedence="style"
            />
            <link rel="preload" as="style" href="preload" />
            <link rel="preload" href={'with\nnewline'} as="style" />
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
        const {pipe} = renderToPipeableStream(
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
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="style" data-precedence="style" />
            <link
              rel="stylesheet"
              href="with\slashes"
              data-precedence="style"
            />
            <link
              rel="stylesheet"
              href={'style"][rel="stylesheet'}
              data-precedence="style"
            />
            <link rel="preload" as="style" href="preload" />
            <link rel="preload" href={'with\nnewline'} as="style" />
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

    // @gate enableFloat
    it('does not create stylesheet resources when inside an <svg> context', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <svg>
                <path>
                  <link rel="stylesheet" href="foo" precedence="default" />
                </path>
                <foreignObject>
                  <link rel="stylesheet" href="bar" precedence="default" />
                </foreignObject>
              </svg>
            </body>
          </html>,
        );
        pipe(writable);
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="stylesheet" href="bar" data-precedence="default" />
          </head>
          <body>
            <svg>
              <path>
                <link rel="stylesheet" href="foo" precedence="default" />
              </path>
              <foreignobject />
            </svg>
          </body>
        </html>,
      );

      const root = ReactDOMClient.createRoot(document.body);
      root.render(
        <div>
          <svg>
            <path>
              <link rel="stylesheet" href="foo" precedence="default" />
            </path>
            <foreignObject>
              <link rel="stylesheet" href="bar" precedence="default" />
            </foreignObject>
          </svg>
        </div>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document.body)).toEqual(
        <div>
          <svg>
            <path>
              <link rel="stylesheet" href="foo" precedence="default" />
            </path>
            <foreignobject />
          </svg>
        </div>,
      );
    });

    // @gate enableFloat
    it('does not create stylesheet resources when inside a <noscript> context', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <noscript>
                <link rel="stylesheet" href="foo" precedence="default" />
              </noscript>
            </body>
          </html>,
        );
        pipe(writable);
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head />
          <body>
            <noscript>
              &lt;link rel="stylesheet" href="foo" precedence="default"/&gt;
            </noscript>
          </body>
        </html>,
      );

      const root = ReactDOMClient.createRoot(document.body);
      root.render(
        <div>
          <noscript>
            <link rel="stylesheet" href="foo" precedence="default" />
          </noscript>
        </div>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document.body)).toEqual(
        <div>
          {/* On the client, <noscript> never renders children */}
          <noscript />
        </div>,
      );
    });

    // @gate enableFloat
    it('warns if you provide a `precedence` prop with other props that invalidate the creation of a stylesheet resource', async () => {
      await expect(async () => {
        await actIntoEmptyDocument(() => {
          renderToPipeableStream(
            <html>
              <body>
                <link rel="stylesheet" precedence="default" />
                <link rel="stylesheet" href="" precedence="default" />
                <link
                  rel="stylesheet"
                  href="foo"
                  precedence="default"
                  onLoad={() => {}}
                  onError={() => {}}
                />
                <link
                  rel="stylesheet"
                  href="foo"
                  precedence="default"
                  onLoad={() => {}}
                />
                <link
                  rel="stylesheet"
                  href="foo"
                  precedence="default"
                  onError={() => {}}
                />
                <link
                  rel="stylesheet"
                  href="foo"
                  precedence="default"
                  disabled={false}
                />
              </body>
            </html>,
          ).pipe(writable);
        });
      }).toErrorDev(
        [
          gate(flags => flags.enableFilterEmptyStringAttributesDOM)
            ? 'An empty string ("") was passed to the href attribute. To fix this, either do not render the element at all or pass null to href instead of an empty string.'
            : undefined,
          'React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and expected the `href` prop to be a non-empty string but ecountered `undefined` instead. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop ensure there is a non-empty string `href` prop as well, otherwise remove the `precedence` prop.',
          'React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and expected the `href` prop to be a non-empty string but ecountered an empty string instead. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop ensure there is a non-empty string `href` prop as well, otherwise remove the `precedence` prop.',
          'React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and `onLoad` and `onError` props. The presence of loading and error handlers indicates an intent to manage the stylesheet loading state from your from your Component code and React will not hoist or deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop remove the `onLoad` and `onError` props, otherwise remove the `precedence` prop.',
          'React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and `onLoad` prop. The presence of loading and error handlers indicates an intent to manage the stylesheet loading state from your from your Component code and React will not hoist or deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop remove the `onLoad` prop, otherwise remove the `precedence` prop.',
          'React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and `onError` prop. The presence of loading and error handlers indicates an intent to manage the stylesheet loading state from your from your Component code and React will not hoist or deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop remove the `onError` prop, otherwise remove the `precedence` prop.',
          'React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and a `disabled` prop. The presence of the `disabled` prop indicates an intent to manage the stylesheet active state from your from your Component code and React will not hoist or deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop remove the `disabled` prop, otherwise remove the `precedence` prop.',
        ].filter(Boolean),
      );

      ReactDOMClient.hydrateRoot(
        document,
        <html>
          <body>
            <link
              rel="stylesheet"
              href="foo"
              precedence="default"
              onLoad={() => {}}
              onError={() => {}}
            />
          </body>
        </html>,
      );
      expect(() => {
        expect(Scheduler).toFlushWithoutYielding();
      }).toErrorDev([
        'React encountered a <link rel="stylesheet" href="foo" ... /> with a `precedence` prop that also included the `onLoad` and `onError` props. The presence of loading and error handlers indicates an intent to manage the stylesheet loading state from your from your Component code and React will not hoist or deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop remove the `onLoad` and `onError` props, otherwise remove the `precedence` prop.',
      ]);
    });

    // @gate enableFloat
    it('warns if you provide different props between <link re="stylesheet" .../> and ReactDOM.preinit(..., {as: "style"}) for the same `href`', async () => {
      function App() {
        ReactDOM.preinit('foo', {as: 'style'});
        return (
          <html>
            <body>
              <link rel="stylesheet" href="foo" precedence="foo" media="all" />
              hello
            </body>
          </html>
        );
      }
      await expect(async () => {
        await actIntoEmptyDocument(() => {
          const {pipe} = renderToPipeableStream(<App />);
          pipe(writable);
        });
      }).toErrorDev([
        'Warning: React encountered a <link rel="stylesheet" precedence="foo" href="foo" .../> with props that conflict with the options provided to `ReactDOM.preinit("foo", { as: "style", ... })`. React will use the first props or preinitialization options encountered when rendering a hoistable stylesheet with a particular `href` and will ignore any newer props or options. The first instance of this stylesheet resource was created using the `ReactDOM.preinit()` function. Please note, `ReactDOM.preinit()` is modeled off of module import assertions capabilities and does not support arbitrary props. If you need to have props not included with the preinit options you will need to rely on rendering <link> tags only.\n  "media" prop value: "all", option not available with ReactDOM.preinit()\n  "precedence" prop value: "foo", missing from options',
      ]);
    });

    // @gate enableFloat
    it('warns if you provide different props between two <link re="stylesheet" .../> that share the same `href`', async () => {
      function App() {
        return (
          <html>
            <body>
              <link rel="stylesheet" href="foo" precedence="foo" media="all" />
              <link
                rel="stylesheet"
                href="foo"
                precedence="bar"
                data-extra="foo"
              />
              hello
            </body>
          </html>
        );
      }
      await expect(async () => {
        await actIntoEmptyDocument(() => {
          const {pipe} = renderToPipeableStream(<App />);
          pipe(writable);
        });
      }).toErrorDev([
        'Warning: React encountered a <link rel="stylesheet" href="foo" .../> with a `precedence` prop that has props that conflict with another hoistable stylesheet with the same `href`. When using `precedence` with <link rel="stylsheet" .../> the props from the first encountered instance will be used and props from later instances will be ignored. Update the props on either <link rel="stylesheet" .../> instance so they agree.\n  "media" missing for props, original value: "all"\n  "data-extra" prop value: "foo", missing from original props\n  "precedence" prop value: "bar", original value: "foo"',
      ]);
    });

    // @gate enableFloat
    it('will not block displaying a Suspense boundary on a stylesheet with media that does not match', async () => {
      await actIntoEmptyDocument(() => {
        renderToPipeableStream(
          <html>
            <body>
              <Suspense fallback="loading...">
                <BlockedOn value="block">
                  foo
                  <link
                    rel="stylesheet"
                    href="print"
                    media="print"
                    precedence="print"
                  />
                  <link
                    rel="stylesheet"
                    href="all"
                    media="all"
                    precedence="all"
                  />
                </BlockedOn>
              </Suspense>
              <Suspense fallback="loading...">
                <BlockedOn value="block">
                  bar
                  <link
                    rel="stylesheet"
                    href="print"
                    media="print"
                    precedence="print"
                  />
                  <link
                    rel="stylesheet"
                    href="all"
                    media="all"
                    precedence="all"
                  />
                </BlockedOn>
              </Suspense>
            </body>
          </html>,
        ).pipe(writable);
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head />
          <body>
            {'loading...'}
            {'loading...'}
          </body>
        </html>,
      );

      await act(() => {
        resolveText('block');
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link
              rel="stylesheet"
              href="print"
              media="print"
              data-precedence="print"
            />
            <link
              rel="stylesheet"
              href="all"
              media="all"
              data-precedence="all"
            />
          </head>
          <body>
            {'loading...'}
            {'loading...'}
            <link rel="preload" href="print" media="print" as="style" />
            <link rel="preload" href="all" media="all" as="style" />
          </body>
        </html>,
      );

      await act(() => {
        const allStyle = document.querySelector('link[href="all"]');
        const event = document.createEvent('Events');
        event.initEvent('load', true, true);
        allStyle.dispatchEvent(event);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link
              rel="stylesheet"
              href="print"
              media="print"
              data-precedence="print"
            />
            <link
              rel="stylesheet"
              href="all"
              media="all"
              data-precedence="all"
            />
          </head>
          <body>
            {'foo'}
            {'bar'}
            <link rel="preload" href="print" media="print" as="style" />
            <link rel="preload" href="all" media="all" as="style" />
          </body>
        </html>,
      );
    });
  });

  describe('Style Resource', () => {
    // @gate enableFloat
    it('treats <style href="..." precedence="..."> elements as a style resource when server rendering', async () => {
      const css = `
body {
  background-color: red;
}`;
      await actIntoEmptyDocument(() => {
        renderToPipeableStream(
          <html>
            <body>
              <style href="foo" precedence="foo">
                {css}
              </style>
            </body>
          </html>,
        ).pipe(writable);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <style data-href="foo" data-precedence="foo">
              {css}
            </style>
          </head>
          <body />
        </html>,
      );
    });

    // @gate enableFloat
    it('can insert style resources as part of a boundary reveal', async () => {
      const cssRed = `
body {
  background-color: red;
}`;
      const cssBlue = `
body {
background-color: blue;
}`;
      const cssGreen = `
body {
background-color: green;
}`;
      await actIntoEmptyDocument(() => {
        renderToPipeableStream(
          <html>
            <body>
              <Suspense fallback="loading...">
                <BlockedOn value="blocked">
                  <style href="foo" precedence="foo">
                    {cssRed}
                  </style>
                  loaded
                </BlockedOn>
              </Suspense>
            </body>
          </html>,
        ).pipe(writable);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head />
          <body>loading...</body>
        </html>,
      );

      await act(() => {
        resolveText('blocked');
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <style data-href="foo" data-precedence="foo">
              {cssRed}
            </style>
          </head>
          <body>loaded</body>
        </html>,
      );

      const root = ReactDOMClient.hydrateRoot(
        document,
        <html>
          <body>
            <Suspense fallback="loading...">
              <style href="foo" precedence="foo">
                {cssRed}
              </style>
              loaded
            </Suspense>
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <style data-href="foo" data-precedence="foo">
              {cssRed}
            </style>
          </head>
          <body>loaded</body>
        </html>,
      );

      root.render(
        <html>
          <body>
            <Suspense fallback="loading...">
              <style href="foo" precedence="foo">
                {cssRed}
              </style>
              loaded
            </Suspense>
            <style href="bar" precedence="bar">
              {cssBlue}
            </style>
            <style href="baz" precedence="foo">
              {cssGreen}
            </style>
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <style data-href="foo" data-precedence="foo">
              {cssRed}
            </style>
            <style data-href="baz" data-precedence="foo">
              {cssGreen}
            </style>
            <style data-href="bar" data-precedence="bar">
              {cssBlue}
            </style>
          </head>
          <body>loaded</body>
        </html>,
      );
    });

    // @gate enableFloat
    it('can emit styles early when a partial boundary flushes', async () => {
      const css = 'body { background-color: red; }';
      await actIntoEmptyDocument(() => {
        renderToPipeableStream(
          <html>
            <body>
              <Suspense>
                <BlockedOn value="first">
                  <div>first</div>
                  <style href="foo" precedence="default">
                    {css}
                  </style>
                  <BlockedOn value="second">
                    <div>second</div>
                    <style href="bar" precedence="default">
                      {css}
                    </style>
                  </BlockedOn>
                </BlockedOn>
              </Suspense>
            </body>
          </html>,
        ).pipe(writable);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head />
          <body />
        </html>,
      );

      await act(() => {
        resolveText('first');
      });

      const styleTemplates = document.querySelectorAll(
        'template[data-precedence]',
      );
      expect(styleTemplates.length).toBe(1);
      expect(getMeaningfulChildren(styleTemplates[0].content)).toEqual(
        <style data-href="foo" data-precedence="default">
          {css}
        </style>,
      );
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head />
          <body />
        </html>,
      );

      await act(() => {
        resolveText('second');
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <style data-href="foo" data-precedence="default">
              {css}
            </style>
            <style data-href="bar" data-precedence="default">
              {css}
            </style>
          </head>
          <body>
            <div>first</div>
            <div>second</div>
          </body>
        </html>,
      );
    });
  });

  describe('Script Resources', () => {
    // @gate enableFloat
    it('treats async scripts without onLoad or onError as Resources', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <head />
            <body>
              <script src="foo" async={true} />
              <script src="bar" async={true} onLoad={() => {}} />
              <script src="baz" data-meaningful="" />
              hello world
            </body>
          </html>,
        );
        pipe(writable);
      });
      // The plain async script is converted to a resource and emitted as part of the shell
      // The async script with onLoad is preloaded in the shell but is expecting to be added
      // during hydration. This is novel, the script is NOT a HostHoistable but it also will
      // never hydrate
      // The regular script is just a normal html that should hydrate with a HostComponent
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <script src="foo" async="" />
            <link rel="preload" href="bar" as="script" />
            <link rel="preload" href="baz" as="script" />
          </head>
          <body>
            <script src="baz" data-meaningful="" />
            hello world
          </body>
        </html>,
      );

      ReactDOMClient.hydrateRoot(
        document,
        <html>
          <head />
          <body>
            <script src="foo" async={true} />
            <script src="bar" async={true} onLoad={() => {}} />
            <script src="baz" data-meaningful="" />
            hello world
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      // The async script with onLoad is inserted in the right place but does not cause the hydration
      // to fail.
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <script src="foo" async="" />
            <link rel="preload" href="bar" as="script" />
            <link rel="preload" href="baz" as="script" />
          </head>
          <body>
            <script src="bar" async="" />
            <script src="baz" data-meaningful="" />
            hello world
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('does not create script resources when inside an <svg> context', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <svg>
                <path>
                  <script async={true} src="foo" />
                </path>
                <foreignObject>
                  <script async={true} src="bar" />
                </foreignObject>
              </svg>
            </body>
          </html>,
        );
        pipe(writable);
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <script async="" src="bar" />
          </head>
          <body>
            <svg>
              <path>
                <script async="" src="foo" />
              </path>
              <foreignobject />
            </svg>
          </body>
        </html>,
      );

      const root = ReactDOMClient.createRoot(document.body);
      root.render(
        <div>
          <svg>
            <path>
              <script async={true} src="foo" />
            </path>
            <foreignObject>
              <script async={true} src="bar" />
            </foreignObject>
          </svg>
        </div>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document.body)).toEqual(
        <div>
          <svg>
            <path>
              <script async="" src="foo" />
            </path>
            <foreignobject />
          </svg>
        </div>,
      );
    });

    // @gate enableFloat
    it('does not create script resources when inside a <noscript> context', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <noscript>
                <script async={true} src="foo" />
              </noscript>
            </body>
          </html>,
        );
        pipe(writable);
      });
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head />
          <body>
            <noscript>
              &lt;script async="" src="foo"&gt;&lt;/script&gt;
            </noscript>
          </body>
        </html>,
      );

      const root = ReactDOMClient.createRoot(document.body);
      root.render(
        <div>
          <noscript>
            <script async={true} src="foo" />
          </noscript>
        </div>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document.body)).toEqual(
        <div>
          {/* On the client, <noscript> never renders children */}
          <noscript />
        </div>,
      );
    });

    // @gate enableFloat
    it('warns if you provide different props between <script async={true} .../> and ReactDOM.preinit(..., {as: "script"}) for the same `href`', async () => {
      function App() {
        ReactDOM.preinit('foo', {as: 'script', integrity: 'some hash'});
        return (
          <html>
            <body>
              <script
                async={true}
                src="foo"
                integrity="different hash"
                data-foo=""
              />
              hello
            </body>
          </html>
        );
      }
      await expect(async () => {
        await actIntoEmptyDocument(() => {
          const {pipe} = renderToPipeableStream(<App />);
          pipe(writable);
        });
      }).toErrorDev([
        'Warning: React encountered a <script async={true} src="foo" .../> with props that conflict with the options provided to `ReactDOM.preinit("foo", { as: "script", ... })`. React will use the first props or preinitialization options encountered when rendering a hoistable script with a particular `src` and will ignore any newer props or options. The first instance of this script resource was created using the `ReactDOM.preinit()` function. Please note, `ReactDOM.preinit()` is modeled off of module import assertions capabilities and does not support arbitrary props. If you need to have props not included with the preinit options you will need to rely on rendering <script> tags only.\n  "data-foo" prop value: an empty string, option not available with ReactDOM.preinit()\n  "integrity" prop value: "different hash", option value: "some hash"',
      ]);
    });

    // @gate enableFloat
    it('warns if you provide different props between two <script async={true} .../> that share the same `src`', async () => {
      function App() {
        return (
          <html>
            <body>
              <script
                async={true}
                src="foo"
                integrity="some hash"
                data-foo=""
              />
              <script
                async={true}
                src="foo"
                integrity="different hash"
                data-bar=""
              />
              hello
            </body>
          </html>
        );
      }
      await expect(async () => {
        await actIntoEmptyDocument(() => {
          const {pipe} = renderToPipeableStream(<App />);
          pipe(writable);
        });
      }).toErrorDev([
        'React encountered a <script async={true} src="foo" .../> that has props that conflict with another hoistable script with the same `src`. When rendering hoistable scripts (async scripts without any loading handlers) the props from the first encountered instance will be used and props from later instances will be ignored. Update the props on both <script async={true} .../> instance so they agree.\n  "data-foo" missing for props, original value: an empty string\n  "data-bar" prop value: an empty string, missing from original props\n  "integrity" prop value: "different hash", original value: "some hash"',
      ]);
    });
  });

  describe('Hoistables', () => {
    // @gate enableFloat
    it('can hoist meta tags on the server and hydrate them on the client', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <meta name="foo" data-foo="data" content="bar" />
            </body>
          </html>,
        );
        pipe(writable);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <meta name="foo" data-foo="data" content="bar" />
          </head>
          <body />
        </html>,
      );

      const root = ReactDOMClient.hydrateRoot(
        document,
        <html>
          <body>
            <meta name="foo" data-foo="data" content="bar" />
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <meta name="foo" data-foo="data" content="bar" />
          </head>
          <body />
        </html>,
      );

      root.render(
        <html>
          <body />
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head />
          <body />
        </html>,
      );
    });

    // @gate enableFloat
    it('can hoist meta tags on the client', async () => {
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <div>
            <meta name="foo" data-foo="data" content="bar" />
          </div>,
        );
      });
      expect(Scheduler).toFlushWithoutYielding();

      expect(getMeaningfulChildren(document.head)).toEqual(
        <meta name="foo" data-foo="data" content="bar" />,
      );
      expect(getMeaningfulChildren(container)).toEqual(<div />);

      root.render(<div />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document.head)).toEqual(undefined);
    });

    // @gate enableFloat
    it('can hoist link (non-stylesheet) tags on the server and hydrate them on the client', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <link rel="foo" data-foo="data" href="foo" />
            </body>
          </html>,
        );
        pipe(writable);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="foo" data-foo="data" href="foo" />
          </head>
          <body />
        </html>,
      );

      const root = ReactDOMClient.hydrateRoot(
        document,
        <html>
          <body>
            <link rel="foo" data-foo="data" href="foo" />
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <link rel="foo" data-foo="data" href="foo" />
          </head>
          <body />
        </html>,
      );

      root.render(
        <html>
          <body />
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head />
          <body />
        </html>,
      );
    });

    // @gate enableFloat
    it('can hoist link (non-stylesheet) tags on the client', async () => {
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <div>
            <link rel="foo" data-foo="data" href="foo" />
          </div>,
        );
      });
      expect(Scheduler).toFlushWithoutYielding();

      expect(getMeaningfulChildren(document.head)).toEqual(
        <link rel="foo" data-foo="data" href="foo" />,
      );
      expect(getMeaningfulChildren(container)).toEqual(<div />);

      root.render(<div />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document.head)).toEqual(undefined);
    });

    // @gate enableFloat
    it('can hoist title tags on the server and hydrate them on the client', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <title data-foo="foo">a title</title>
            </body>
          </html>,
        );
        pipe(writable);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <title data-foo="foo">a title</title>
          </head>
          <body />
        </html>,
      );

      const root = ReactDOMClient.hydrateRoot(
        document,
        <html>
          <body>
            <title data-foo="foo">a title</title>
          </body>
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <title data-foo="foo">a title</title>
          </head>
          <body />
        </html>,
      );

      root.render(
        <html>
          <body />
        </html>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head />
          <body />
        </html>,
      );
    });

    // @gate enableFloat
    it('can hoist title tags on the client', async () => {
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <div>
            <title data-foo="foo">a title</title>
          </div>,
        );
      });
      expect(Scheduler).toFlushWithoutYielding();

      expect(getMeaningfulChildren(document.head)).toEqual(
        <title data-foo="foo">a title</title>,
      );
      expect(getMeaningfulChildren(container)).toEqual(<div />);

      root.render(<div />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document.head)).toEqual(undefined);
    });

    // @gate enableFloat
    it('prioritizes ordering for certain hoistables over others when rendering on the server', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <link rel="foo" href="foo" />
              <meta name="bar" />
              <title>a title</title>
              <link rel="preload" href="foo" as="style" />
              <link rel="preconnect" href="bar" />
              <link rel="dns-prefetch" href="baz" />
              <meta charSet="utf-8" />
            </body>
          </html>,
        );
        pipe(writable);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            {/* charset first */}
            <meta charset="utf-8" />
            {/* preconnect links next */}
            <link rel="preconnect" href="bar" />
            <link rel="dns-prefetch" href="baz" />
            {/* preloads next */}
            <link rel="preload" href="foo" as="style" />
            {/* Everything else last */}
            <link rel="foo" href="foo" />
            <meta name="bar" />
            <title>a title</title>
          </head>
          <body />
        </html>,
      );
    });

    // @gate enableFloat
    it('emits hoistables before other content when streaming in late', async () => {
      let content = '';
      writable.on('data', chunk => (content += chunk));

      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <meta name="early" />
              <Suspense fallback={null}>
                <BlockedOn value="foo">
                  <div>foo</div>
                  <meta name="late" />
                </BlockedOn>
              </Suspense>
            </body>
          </html>,
        );
        pipe(writable);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <meta name="early" />
          </head>
          <body />
        </html>,
      );
      content = '';

      await act(() => {
        resolveText('foo');
      });

      expect(content.slice(0, 30)).toEqual('<meta name="late"/><div hidden');

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <meta name="early" />
          </head>
          <body>
            <div>foo</div>
            <meta name="late" />
          </body>
        </html>,
      );
    });

    // @gate enableFloat
    it('supports rendering hoistables outside of <html> scope', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <>
            <meta name="before" />
            <html>
              <body>foo</body>
            </html>
            <meta name="after" />
          </>,
        );
        pipe(writable);
      });

      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <meta name="before" />
            <meta name="after" />
          </head>
          <body>foo</body>
        </html>,
      );

      const root = ReactDOMClient.hydrateRoot(
        document,
        <>
          <meta name="before" />
          <html>
            <body>foo</body>
          </html>
          <meta name="after" />
        </>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <meta name="before" />
            <meta name="after" />
          </head>
          <body>foo</body>
        </html>,
      );

      root.render(
        <>
          {null}
          <html>
            <body>foo</body>
          </html>
          {null}
        </>,
      );
      expect(Scheduler).toFlushWithoutYielding();
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head />
          <body>foo</body>
        </html>,
      );
    });

    // @gate enableFloat
    it('does not hoist inside an <svg> context', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <svg>
                <title>svg title</title>
                <link rel="svg link" href="a" />
                <meta name="svg meta" />
                <path>
                  <title>deep svg title</title>
                  <meta name="deep svg meta" />
                  <link rel="deep svg link" href="a" />
                </path>
                <foreignObject>
                  <title>hoistable title</title>
                  <meta name="hoistable" />
                  <link rel="hoistable" href="a" />
                </foreignObject>
              </svg>
            </body>
          </html>,
        );
        pipe(writable);
      });

      expect(getMeaningfulChildren(document.head)).toEqual([
        <title>hoistable title</title>,
        <meta name="hoistable" />,
        <link rel="hoistable" href="a" />,
      ]);
    });

    // @gate enableFloat
    it('does not hoist inside noscript context', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <html>
            <body>
              <title>title</title>
              <link rel="link" href="a" />
              <meta name="meta" />
              <noscript>
                <title>noscript title</title>
                <link rel="noscript link" href="a" />
                <meta name="noscript meta" />
              </noscript>
            </body>
          </html>,
        );
        pipe(writable);
      });

      expect(getMeaningfulChildren(document.head)).toEqual([
        <title>title</title>,
        <link rel="link" href="a" />,
        <meta name="meta" />,
      ]);
    });

    // @gate enableFloat && enableHostSingletons && (enableClientRenderFallbackOnTextMismatch || !__DEV__)
    it('can render a title before a singleton even if that singleton clears its contents', async () => {
      await actIntoEmptyDocument(() => {
        const {pipe} = renderToPipeableStream(
          <>
            <title>foo</title>
            <html>
              <head />
              <body>
                <div>server</div>
              </body>
            </html>
          </>,
        );
        pipe(writable);
      });

      const errors = [];
      ReactDOMClient.hydrateRoot(
        document,
        <>
          <title>foo</title>
          <html>
            <head />
            <body>
              <div>client</div>
            </body>
          </html>
        </>,
        {
          onRecoverableError(err) {
            errors.push(err.message);
          },
        },
      );
      try {
        expect(() => {
          expect(Scheduler).toFlushWithoutYielding();
        }).toErrorDev(
          [
            'Warning: Text content did not match. Server: "server" Client: "client"',
            'Warning: An error occurred during hydration. The server HTML was replaced with client content in <#document>.',
          ],
          {withoutStack: 1},
        );
      } catch (e) {
        // When gates are false this test fails on a DOMException if you don't clear the scheduler after catching.
        // When gates are true this branch should not be hit
        expect(Scheduler).toFlushWithoutYielding();
        throw e;
      }
      expect(getMeaningfulChildren(document)).toEqual(
        <html>
          <head>
            <title>foo</title>
          </head>
          <body>
            <div>client</div>
          </body>
        </html>,
      );
    });
  });
});
