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

let JSDOM;
let React;
let ReactDOMClient;
let Scheduler;
let waitForAll;
let assertLog;
let currentFontReady;
let resolveFontReady;
let loadCache;
let container;

describe('ReactDOMSuspenseyCommit', () => {
  beforeEach(() => {
    jest.resetModules();
    JSDOM = require('jsdom').JSDOM;

    const dom = new JSDOM(
      '<!DOCTYPE html><html><head></head><body><div id="container">',
      {runScripts: 'dangerously'},
    );
    global.window = dom.window;
    global.document = dom.window.document;

    container = document.getElementById('container');

    currentFontReady = Promise.resolve();
    resolveFontReady = null;

    Object.defineProperty(document, 'fonts', {
      enumerable: false,
      configurable: false,
      get() {
        return {
          ready: currentFontReady,
          status: resolveFontReady ? 'loading' : 'loaded',
        };
      },
    });

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');

    loadCache = new Set();

    ({waitForAll, assertLog} = require('internal-test-utils'));
  });

  function startLoadingFonts() {
    let previousResolveFontReady;
    if (resolveFontReady) {
      previousResolveFontReady = resolveFontReady;
    }
    currentFontReady = new Promise(resolve => {
      resolveFontReady = () => {
        if (previousResolveFontReady) {
          previousResolveFontReady();
        }
        resolve();
      };
    });
  }

  async function finishLoadingFonts() {
    if (resolveFontReady) {
      const resolve = resolveFontReady;
      resolveFontReady = null;
      resolve();
    }
  }

  function loadPreloads(hrefs) {
    const event = new window.Event('load');
    const nodes = document.querySelectorAll('link[rel="preload"]');
    resolveLoadables(hrefs, nodes, event, href =>
      Scheduler.log('load preload: ' + href),
    );
  }

  // function errorPreloads(hrefs) {
  //   const event = new window.Event('error');
  //   const nodes = document.querySelectorAll('link[rel="preload"]');
  //   resolveLoadables(hrefs, nodes, event, href =>
  //     Scheduler.log('error preload: ' + href),
  //   );
  // }

  function loadStylesheets(hrefs) {
    const event = new window.Event('load');
    const nodes = document.querySelectorAll('link[rel="stylesheet"]');
    resolveLoadables(hrefs, nodes, event, href =>
      Scheduler.log('load stylesheet: ' + href),
    );
  }

  // function errorStylesheets(hrefs) {
  //   const event = new window.Event('error');
  //   const nodes = document.querySelectorAll('link[rel="stylesheet"]');
  //   resolveLoadables(hrefs, nodes, event, href => {
  //     Scheduler.log('error stylesheet: ' + href);
  //   });
  // }

  function resolveLoadables(hrefs, nodes, event, onLoad) {
    const hrefSet = hrefs ? new Set(hrefs) : null;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (loadCache.has(node)) {
        continue;
      }
      const href = node.getAttribute('href');
      if (!hrefSet || hrefSet.has(href)) {
        loadCache.add(node);
        onLoad(href);
        node.dispatchEvent(event);
      }
    }
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

  it('should wait for fonts to load before committing', async () => {
    const root = ReactDOMClient.createRoot(container);

    React.startTransition(() => {
      startLoadingFonts();
      root.render(<div>hello</div>);
    });
    await waitForAll([]);
    expect(getMeaningfulChildren(container)).toEqual(undefined);

    await finishLoadingFonts();
    expect(getMeaningfulChildren(container)).toEqual(<div>hello</div>);
  });

  it('should only wait for fonts for at most 100ms', async () => {
    const root = ReactDOMClient.createRoot(container);

    React.startTransition(() => {
      startLoadingFonts();
      root.render(<div>hello</div>);
    });
    await waitForAll([]);
    expect(getMeaningfulChildren(container)).toEqual(undefined);

    jest.advanceTimersByTime(100);
    expect(getMeaningfulChildren(container)).toEqual(<div>hello</div>);
  });

  it('should only wait for stylesheets for at most 1 minute', async () => {
    const root = ReactDOMClient.createRoot(container);

    React.startTransition(() => {
      startLoadingFonts();
      root.render(
        <div>
          hello
          <link rel="stylesheet" href="foo" precedence="default" />
        </div>,
      );
    });
    await waitForAll([]);
    expect(getMeaningfulChildren(container)).toEqual(undefined);

    jest.advanceTimersByTime(100);
    expect(getMeaningfulChildren(container)).toEqual(undefined);

    jest.advanceTimersByTime(1000 * 60);
    expect(getMeaningfulChildren(container)).toEqual(<div>hello</div>);
  });

  it('should coordinate stylesheet insertions with completion of commit', async () => {
    const root = ReactDOMClient.createRoot(container);

    React.startTransition(() => {
      startLoadingFonts();
      root.render(
        <div>
          hello
          <link rel="stylesheet" href="foo" precedence="default" />
        </div>,
      );
    });
    await waitForAll([]);
    expect(getMeaningfulChildren(container)).toEqual(undefined);
    expect(getMeaningfulChildren(document.head)).toEqual(
      <link rel="preload" href="foo" as="style" />,
    );

    loadPreloads();
    assertLog(['load preload: foo']);
    expect(getMeaningfulChildren(container)).toEqual(undefined);
    expect(getMeaningfulChildren(document.head)).toEqual(
      <link rel="preload" href="foo" as="style" />,
    );

    await finishLoadingFonts();
    expect(getMeaningfulChildren(container)).toEqual(undefined);
    expect(getMeaningfulChildren(document.head)).toEqual([
      <link rel="stylesheet" href="foo" data-precedence="default" />,
      <link rel="preload" href="foo" as="style" />,
    ]);

    loadStylesheets();
    assertLog(['load stylesheet: foo']);
    expect(getMeaningfulChildren(container)).toEqual(<div>hello</div>);
  });

  it('should coordinate stylesheet insertions with completion of commit even when exceeding the font timeout', async () => {
    const root = ReactDOMClient.createRoot(container);

    React.startTransition(() => {
      startLoadingFonts();
      root.render(
        <div>
          hello
          <link rel="stylesheet" href="foo" precedence="default" />
        </div>,
      );
    });
    await waitForAll([]);
    expect(getMeaningfulChildren(container)).toEqual(undefined);
    expect(getMeaningfulChildren(document.head)).toEqual(
      <link rel="preload" href="foo" as="style" />,
    );

    loadPreloads();
    assertLog(['load preload: foo']);
    expect(getMeaningfulChildren(container)).toEqual(undefined);
    expect(getMeaningfulChildren(document.head)).toEqual(
      <link rel="preload" href="foo" as="style" />,
    );

    // advance timers to trigger commit timeout for fonts
    jest.advanceTimersByTime(100);
    expect(getMeaningfulChildren(container)).toEqual(undefined);
    expect(getMeaningfulChildren(document.head)).toEqual([
      <link rel="stylesheet" href="foo" data-precedence="default" />,
      <link rel="preload" href="foo" as="style" />,
    ]);

    loadStylesheets();
    assertLog(['load stylesheet: foo']);
    expect(getMeaningfulChildren(container)).toEqual(<div>hello</div>);
  });
});
