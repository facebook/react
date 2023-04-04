/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment ./scripts/jest/ReactDOMServerIntegrationEnvironment
 */

/* eslint-disable no-script-url */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

let React;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;

const EXPECTED_SAFE_URL =
  "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')";

describe('ReactDOMServerIntegration - Untrusted URLs', () => {
  // The `itRenders` helpers don't work with the gate pragma, so we have to do
  // this instead.
  if (gate(flags => flags.disableJavaScriptURLs)) {
    it("empty test so Jest doesn't complain", () => {});
    return;
  }

  function initModules() {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('react-dom/test-utils');

    // Make them available to the helpers.
    return {
      ReactDOM,
      ReactDOMServer,
      ReactTestUtils,
    };
  }

  const {resetModules, itRenders} = ReactDOMServerIntegrationUtils(initModules);

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

  itRenders('a javascript protocol href', async render => {
    // Only the first one warns. The second warning is deduped.
    const e = await render(
      <div>
        <a href="javascript:notfine">p0wned</a>
        <a href="javascript:notfineagain">p0wned again</a>
      </div>,
      1,
    );
    expect(e.firstChild.href).toBe('javascript:notfine');
    expect(e.lastChild.href).toBe('javascript:notfineagain');
  });

  itRenders('a javascript protocol with leading spaces', async render => {
    const e = await render(
      <a href={'  \t \u0000\u001F\u0003javascript\n: notfine'}>p0wned</a>,
      1,
    );
    // We use an approximate comparison here because JSDOM might not parse
    // \u0000 in HTML properly.
    expect(e.href).toContain('notfine');
  });

  itRenders(
    'a javascript protocol with intermediate new lines and mixed casing',
    async render => {
      const e = await render(
        <a href={'\t\r\n Jav\rasCr\r\niP\t\n\rt\n:notfine'}>p0wned</a>,
        1,
      );
      expect(e.href).toBe('javascript:notfine');
    },
  );

  itRenders('a javascript protocol area href', async render => {
    const e = await render(
      <map>
        <area href="javascript:notfine" />
      </map>,
      1,
    );
    expect(e.firstChild.href).toBe('javascript:notfine');
  });

  itRenders('a javascript protocol form action', async render => {
    const e = await render(<form action="javascript:notfine">p0wned</form>, 1);
    expect(e.action).toBe('javascript:notfine');
  });

  itRenders('a javascript protocol button formAction', async render => {
    const e = await render(<input formAction="javascript:notfine" />, 1);
    expect(e.getAttribute('formAction')).toBe('javascript:notfine');
  });

  itRenders('a javascript protocol input formAction', async render => {
    const e = await render(
      <button formAction="javascript:notfine">p0wned</button>,
      1,
    );
    expect(e.getAttribute('formAction')).toBe('javascript:notfine');
  });

  itRenders('a javascript protocol iframe src', async render => {
    const e = await render(<iframe src="javascript:notfine" />, 1);
    expect(e.src).toBe('javascript:notfine');
  });

  itRenders('a javascript protocol frame src', async render => {
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

  itRenders('a javascript protocol in an SVG link', async render => {
    const e = await render(
      <svg>
        <a href="javascript:notfine" />
      </svg>,
      1,
    );
    expect(e.firstChild.getAttribute('href')).toBe('javascript:notfine');
  });

  itRenders(
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

  it('rejects a javascript protocol href if it is added during an update', () => {
    const container = document.createElement('div');
    ReactDOM.render(<a href="thisisfine">click me</a>, container);
    expect(() => {
      ReactDOM.render(<a href="javascript:notfine">click me</a>, container);
    }).toErrorDev(
      'Warning: A future version of React will block javascript: URLs as a security precaution. ' +
        'Use event handlers instead if you can. If you need to generate unsafe HTML try using ' +
        'dangerouslySetInnerHTML instead. React was passed "javascript:notfine".\n' +
        '    in a (at **)',
    );
  });
});

describe('ReactDOMServerIntegration - Untrusted URLs - disableJavaScriptURLs', () => {
  // The `itRenders` helpers don't work with the gate pragma, so we have to do
  // this instead.
  if (gate(flags => !flags.disableJavaScriptURLs)) {
    it("empty test so Jest doesn't complain", () => {});
    return;
  }

  function initModules() {
    jest.resetModules();
    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.disableJavaScriptURLs = true;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('react-dom/test-utils');

    // Make them available to the helpers.
    return {
      ReactDOM,
      ReactDOMServer,
      ReactTestUtils,
    };
  }

  const {
    resetModules,
    itRenders,
    clientRenderOnBadMarkup,
    clientRenderOnServerString,
  } = ReactDOMServerIntegrationUtils(initModules);

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

  itRenders('a javascript protocol href', async render => {
    // Only the first one warns. The second warning is deduped.
    const e = await render(
      <div>
        <a href="javascript:notfine">p0wned</a>
        <a href="javascript:notfineagain">p0wned again</a>
      </div>,
    );
    expect(e.firstChild.href).toBe(EXPECTED_SAFE_URL);
    expect(e.lastChild.href).toBe(EXPECTED_SAFE_URL);
  });

  itRenders('a javascript protocol with leading spaces', async render => {
    const e = await render(
      <a href={'  \t \u0000\u001F\u0003javascript\n: notfine'}>p0wned</a>,
    );
    // We use an approximate comparison here because JSDOM might not parse
    // \u0000 in HTML properly.
    expect(e.href).toBe(EXPECTED_SAFE_URL);
  });

  itRenders(
    'a javascript protocol with intermediate new lines and mixed casing',
    async render => {
      const e = await render(
        <a href={'\t\r\n Jav\rasCr\r\niP\t\n\rt\n:notfine'}>p0wned</a>,
      );
      expect(e.href).toBe(EXPECTED_SAFE_URL);
    },
  );

  itRenders('a javascript protocol area href', async render => {
    const e = await render(
      <map>
        <area href="javascript:notfine" />
      </map>,
    );
    expect(e.firstChild.href).toBe(EXPECTED_SAFE_URL);
  });

  itRenders('a javascript protocol form action', async render => {
    const e = await render(<form action="javascript:notfine">p0wned</form>);
    expect(e.action).toBe(EXPECTED_SAFE_URL);
  });

  itRenders('a javascript protocol button formAction', async render => {
    const e = await render(<input formAction="javascript:notfine" />);
    expect(e.getAttribute('formAction')).toBe(EXPECTED_SAFE_URL);
  });

  itRenders('a javascript protocol input formAction', async render => {
    const e = await render(
      <button formAction="javascript:notfine">p0wned</button>,
    );
    expect(e.getAttribute('formAction')).toBe(EXPECTED_SAFE_URL);
  });

  itRenders('a javascript protocol iframe src', async render => {
    const e = await render(<iframe src="javascript:notfine" />);
    expect(e.src).toBe(EXPECTED_SAFE_URL);
  });

  itRenders('a javascript protocol frame src', async render => {
    const e = await render(
      <html>
        <head />
        <frameset>
          <frame src="javascript:notfine" />
        </frameset>
      </html>,
    );
    expect(e.lastChild.firstChild.src).toBe(EXPECTED_SAFE_URL);
  });

  itRenders('a javascript protocol in an SVG link', async render => {
    const e = await render(
      <svg>
        <a href="javascript:notfine" />
      </svg>,
    );
    expect(e.firstChild.getAttribute('href')).toBe(EXPECTED_SAFE_URL);
  });

  itRenders(
    'a javascript protocol in an SVG link with a namespace',
    async render => {
      const e = await render(
        <svg>
          <a xlinkHref="javascript:notfine" />
        </svg>,
      );
      expect(
        e.firstChild.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
      ).toBe(EXPECTED_SAFE_URL);
    },
  );

  it('rejects a javascript protocol href if it is added during an update', () => {
    const container = document.createElement('div');
    ReactDOM.render(<a href="http://thisisfine/">click me</a>, container);
    expect(container.firstChild.href).toBe('http://thisisfine/');
    ReactDOM.render(<a href="javascript:notfine">click me</a>, container);
    expect(container.firstChild.href).toBe(EXPECTED_SAFE_URL);
  });

  itRenders('only the first invocation of toString', async render => {
    let expectedToStringCalls = 1;
    if (render === clientRenderOnBadMarkup) {
      // It gets called once on the server and once on the client
      // which happens to share the same object in our test runner.
      expectedToStringCalls = 2;
    }
    if (render === clientRenderOnServerString && __DEV__) {
      // The hydration validation calls it one extra time.
      // TODO: It would be good if we only called toString once for
      // consistency but the code structure makes that hard right now.
      expectedToStringCalls = 4;
    } else if (__DEV__) {
      // Checking for string coercion problems results in double the
      // toString calls in DEV
      expectedToStringCalls *= 2;
    }

    let toStringCalls = 0;
    const firstIsSafe = {
      toString() {
        // This tries to avoid the validation by pretending to be safe
        // the first times it is called and then becomes dangerous.
        toStringCalls++;
        if (toStringCalls <= expectedToStringCalls) {
          return 'https://reactjs.org/';
        }
        return 'javascript:notfine';
      },
    };

    const e = await render(<a href={firstIsSafe} />);
    expect(toStringCalls).toBe(expectedToStringCalls);
    expect(e.href).toBe('https://reactjs.org/');
  });

  it('rejects a javascript protocol href if it is added during an update twice', () => {
    const container = document.createElement('div');
    ReactDOM.render(<a href="http://thisisfine/">click me</a>, container);
    expect(container.firstChild.href).toBe('http://thisisfine/');
    ReactDOM.render(<a href="javascript:notfine">click me</a>, container);
    expect(container.firstChild.href).toBe(EXPECTED_SAFE_URL);
    // The second update ensures that a global flag hasn't been added to the regex
    // which would fail to match the second time it is called.
    ReactDOM.render(<a href="javascript:notfine">click me</a>, container);
    expect(container.firstChild.href).toBe(EXPECTED_SAFE_URL);
  });
});
