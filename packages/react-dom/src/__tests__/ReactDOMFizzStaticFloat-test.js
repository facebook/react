/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {patchMessageChannel} from '../../../../scripts/jest/patchMessageChannel';

import {
  getVisibleChildren,
  insertNodesAndExecuteScripts,
} from '../test-utils/FizzTestUtils';

// Polyfills for test environment
global.ReadableStream =
  require('web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;

let React;
let ReactDOM;
let ReactDOMFizzServer;
let ReactDOMFizzStatic;
let Suspense;
let container;
let Scheduler;
let act;

describe('ReactDOMFizzStaticFloat', () => {
  beforeEach(() => {
    jest.resetModules();
    Scheduler = require('scheduler');
    patchMessageChannel(Scheduler);
    act = require('internal-test-utils').act;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMFizzServer = require('react-dom/server.browser');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzStatic = require('react-dom/static.browser');
    }
    Suspense = React.Suspense;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  async function serverAct(callback) {
    let maybePromise;
    await act(() => {
      maybePromise = callback();
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {});
      }
    });
    return maybePromise;
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
    const temp = document.createElement('div');
    temp.innerHTML = result;
    await insertNodesAndExecuteScripts(temp, container, null);
  }

  // @gate enablePostpone
  it('should transfer connection credentials across prerender and resume for stylesheets, scripts, and moduleScripts', async () => {
    let prerendering = true;
    function Postpone() {
      if (prerendering) {
        React.unstable_postpone();
      }
      return (
        <>
          <link rel="stylesheet" href="style creds" precedence="default" />
          <script async={true} src="script creds" data-meaningful="" />
          <script
            type="module"
            async={true}
            src="module creds"
            data-meaningful=""
          />
          <link rel="stylesheet" href="style anon" precedence="default" />
          <script async={true} src="script anon" data-meaningful="" />
          <script
            type="module"
            async={true}
            src="module default"
            data-meaningful=""
          />
        </>
      );
    }

    function App() {
      ReactDOM.preload('style creds', {
        as: 'style',
        crossOrigin: 'use-credentials',
      });
      ReactDOM.preload('script creds', {
        as: 'script',
        crossOrigin: 'use-credentials',
        integrity: 'script-hash',
      });
      ReactDOM.preloadModule('module creds', {
        crossOrigin: 'use-credentials',
        integrity: 'module-hash',
      });
      ReactDOM.preload('style anon', {
        as: 'style',
        crossOrigin: 'anonymous',
      });
      ReactDOM.preload('script anon', {
        as: 'script',
        crossOrigin: 'foobar',
      });
      ReactDOM.preloadModule('module default', {
        integrity: 'module-hash',
      });
      return (
        <div>
          <Suspense fallback="Loading...">
            <Postpone />
          </Suspense>
        </div>
      );
    }

    jest.mock('script creds', () => {}, {
      virtual: true,
    });
    jest.mock('module creds', () => {}, {
      virtual: true,
    });
    jest.mock('script anon', () => {}, {
      virtual: true,
    });
    jest.mock('module default', () => {}, {
      virtual: true,
    });

    const prerendered = await serverAct(() =>
      ReactDOMFizzStatic.prerender(<App />),
    );
    expect(prerendered.postponed).not.toBe(null);

    await readIntoContainer(prerendered.prelude);

    expect(getVisibleChildren(container)).toEqual([
      <link
        rel="preload"
        as="style"
        href="style creds"
        crossorigin="use-credentials"
      />,
      <link
        rel="preload"
        as="script"
        href="script creds"
        crossorigin="use-credentials"
        integrity="script-hash"
      />,
      <link
        rel="modulepreload"
        href="module creds"
        crossorigin="use-credentials"
        integrity="module-hash"
      />,
      <link rel="preload" as="style" href="style anon" crossorigin="" />,
      <link rel="preload" as="script" href="script anon" crossorigin="" />,
      <link
        rel="modulepreload"
        href="module default"
        integrity="module-hash"
      />,
      <div>Loading...</div>,
    ]);

    prerendering = false;
    const content = await serverAct(() =>
      ReactDOMFizzServer.resume(
        <App />,
        JSON.parse(JSON.stringify(prerendered.postponed)),
      ),
    );

    await readIntoContainer(content);

    await act(() => {
      // Dispatch load event to injected stylesheet
      const linkCreds = document.querySelector(
        'link[rel="stylesheet"][href="style creds"]',
      );
      const linkAnon = document.querySelector(
        'link[rel="stylesheet"][href="style anon"]',
      );
      const event = document.createEvent('Events');
      event.initEvent('load', true, true);
      linkCreds.dispatchEvent(event);
      linkAnon.dispatchEvent(event);
    });

    expect(getVisibleChildren(document)).toEqual(
      <html>
        <head>
          <link
            rel="stylesheet"
            data-precedence="default"
            href="style creds"
            crossorigin="use-credentials"
          />
          <link
            rel="stylesheet"
            data-precedence="default"
            href="style anon"
            crossorigin=""
          />
        </head>
        <body>
          <div>
            <link
              rel="preload"
              as="style"
              href="style creds"
              crossorigin="use-credentials"
            />
            <link
              rel="preload"
              as="script"
              href="script creds"
              crossorigin="use-credentials"
              integrity="script-hash"
            />
            <link
              rel="modulepreload"
              href="module creds"
              crossorigin="use-credentials"
              integrity="module-hash"
            />
            <link rel="preload" as="style" href="style anon" crossorigin="" />
            <link rel="preload" as="script" href="script anon" crossorigin="" />
            <link
              rel="modulepreload"
              href="module default"
              integrity="module-hash"
            />
            <div />
            <script
              async=""
              src="script creds"
              crossorigin="use-credentials"
              integrity="script-hash"
              data-meaningful=""
            />
            <script
              type="module"
              async=""
              src="module creds"
              crossorigin="use-credentials"
              integrity="module-hash"
              data-meaningful=""
            />
            <script
              async=""
              src="script anon"
              crossorigin=""
              data-meaningful=""
            />
            <script
              type="module"
              async=""
              src="module default"
              integrity="module-hash"
              data-meaningful=""
            />
          </div>
        </body>
      </html>,
    );
  });
});
