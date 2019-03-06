/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

/* eslint-disable no-script-url */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

let React;
let ReactDOM;
let ReactDOMServer;

function runTests(itRenders, itRejects) {
  itRenders('a http link with the word javascript in it', async render => {
    const e = await render(
      <a href="http://javascript:0/thisisfine">Click me</a>,
    );
    expect(e.tagName).toBe('A');
    expect(e.href).toBe('http://javascript:0/thisisfine');
  });

  itRejects('a javascript protocol href', async render => {
    const e = await render(<a href="javascript:notfine">p0wned</a>, 1);
    expect(e.href).toBe('javascript:notfine');
  });

  itRejects('a javascript protocol area href', async render => {
    const e = await render(
      <map>
        <area href="javascript:notfine" />
      </map>,
      1,
    );
    expect(e.firstChild.href).toBe('javascript:notfine');
  });

  itRejects('a javascript protocol form action', async render => {
    const e = await render(<form action="javascript:notfine">p0wned</form>, 1);
    expect(e.action).toBe('javascript:notfine');
  });

  itRejects('a javascript protocol button formAction', async render => {
    const e = await render(<input formAction="javascript:notfine" />, 1);
    expect(e.getAttribute('formAction')).toBe('javascript:notfine');
  });

  itRejects('a javascript protocol input formAction', async render => {
    const e = await render(
      <button formAction="javascript:notfine">p0wned</button>,
      1,
    );
    expect(e.getAttribute('formAction')).toBe('javascript:notfine');
  });

  itRejects('a javascript protocol iframe src', async render => {
    const e = await render(<iframe src="javascript:notfine" />, 1);
    expect(e.src).toBe('javascript:notfine');
  });

  itRejects('a javascript protocol frame src', async render => {
    const e = await render(
      <html>
        <head />
        <frameset>
          <frame src="javascript:notfine" />
        </frameset>
      </html>,
      1,
    );
    expect(e.lastChild.firstChild.src).toBe('javascript:notfine');
  });

  itRejects('a javascript protocol in an SVG link', async render => {
    const e = await render(
      <svg>
        <a href="javascript:notfine" />
      </svg>,
      1,
    );
    expect(e.firstChild.getAttribute('href')).toBe('javascript:notfine');
  });

  itRejects(
    'a javascript protocol in an SVG link with a namespace',
    async render => {
      const e = await render(
        <svg>
          <a xlinkHref="javascript:notfine" />
        </svg>,
        1,
      );
      expect(
        e.firstChild.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
      ).toBe('javascript:notfine');
    },
  );
}

describe('ReactDOMServerIntegration - Untrusted URLs', () => {
  function initModules() {
    jest.resetModuleRegistry();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');

    // Make them available to the helpers.
    return {
      ReactDOM,
      ReactDOMServer,
    };
  }

  const {resetModules, itRenders} = ReactDOMServerIntegrationUtils(initModules);

  beforeEach(() => {
    resetModules();
  });

  runTests(itRenders, itRenders);
});

describe('ReactDOMServerIntegration - Untrusted URLs - disableJavaScriptURLs', () => {
  function initModules() {
    jest.resetModuleRegistry();
    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.disableJavaScriptURLs = true;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');

    // Make them available to the helpers.
    return {
      ReactDOM,
      ReactDOMServer,
    };
  }

  const {
    resetModules,
    itRenders,
    itThrowsWhenRendering,
  } = ReactDOMServerIntegrationUtils(initModules);

  beforeEach(() => {
    resetModules();
  });

  runTests(itRenders, (message, test) =>
    itThrowsWhenRendering(message, test, 'blocked a javascript: URL'),
  );
});
