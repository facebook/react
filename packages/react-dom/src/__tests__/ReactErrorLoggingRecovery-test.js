/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

// This is a regression test for https://github.com/facebook/react/issues/13188.
// It reproduces a combination of conditions that led to a problem.

if (global.window) {
  throw new Error('This test must run in a Node environment.');
}

// The issue only reproduced when React was loaded before JSDOM.
const React = require('react');
const ReactDOMClient = require('react-dom/client');
const act = require('internal-test-utils').act;

// Initialize JSDOM separately.
// We don't use our normal JSDOM setup because we want to load React first.
const {JSDOM} = require('jsdom');
global.requestAnimationFrame = setTimeout;
global.cancelAnimationFrame = clearTimeout;
const jsdom = new JSDOM(`<div id="app-root"></div>`);
global.window = jsdom.window;
global.document = jsdom.window.document;
global.navigator = jsdom.window.navigator;

class Bad extends React.Component {
  componentDidUpdate() {
    throw new Error('no');
  }
  render() {
    return null;
  }
}

describe('ReactErrorLoggingRecovery', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = error => {
      throw new Error('Buggy console.error');
    };
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should recover from errors in console.error', async function () {
    const div = document.createElement('div');
    const root = ReactDOMClient.createRoot(div);
    await expect(async () => {
      await act(() => {
        root.render(<Bad />);
      });
      await act(() => {
        root.render(<Bad />);
      });
    }).rejects.toThrow('no');

    await expect(async () => {
      await act(() => {
        root.render(<span>Hello</span>);
      });
    }).rejects.toThrow('Buggy console.error');
    expect(div.firstChild.textContent).toBe('Hello');
  });
});
