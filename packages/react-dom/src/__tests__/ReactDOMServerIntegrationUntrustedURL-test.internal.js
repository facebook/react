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

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    resetModules();
  });

  itRenders('a http link with the word javascript in it', async render => {
    const e = await render(
      <a href="http://javascript:0/thisisfine">Click me</a>,
    );
    expect(e.tagName).toBe('A');
    expect(e.href).toBe('http://javascript:0/thisisfine');
  });

  itThrowsWhenRendering(
    'a javascript protocol href',
    render => render(<a href="javascript:notfine">p0wned</a>, 1),
    'XSS',
  );

  itThrowsWhenRendering(
    'a javascript protocol area href',
    render =>
      render(
        <map>
          <area href="javascript:notfine" />
        </map>,
        1,
      ),
    'XSS',
  );

  itThrowsWhenRendering(
    'a javascript protocol form action',
    render => render(<form action="javascript:notfine">p0wned</form>, 1),
    'XSS',
  );

  itThrowsWhenRendering(
    'a javascript protocol button formAction',
    render => render(<input formAction="javascript:notfine" />, 1),
    'XSS',
  );

  itThrowsWhenRendering(
    'a javascript protocol input formAction',
    render =>
      render(<button formAction="javascript:notfine">p0wned</button>, 1),
    'XSS',
  );

  itThrowsWhenRendering(
    'a javascript protocol iframe src',
    render => render(<iframe src="javascript:notfine" />, 1),
    'XSS',
  );

  itThrowsWhenRendering(
    'a javascript protocol frame src',
    render =>
      render(
        <frameset>
          <frame src="javascript:notfine" />
        </frameset>,
        1,
      ),
    'XSS',
  );

  itThrowsWhenRendering(
    'a javascript protocol in an SVG link',
    render =>
      render(
        <svg>
          <a href="javascript:notfine" />
        </svg>,
        1,
      ),
    'XSS',
  );

  itThrowsWhenRendering(
    'a javascript protocol in an SVG link with a namespace',
    render =>
      render(
        <svg>
          <a xlinkHref="javascript:notfine" />
        </svg>,
        1,
      ),
    'XSS',
  );
});
