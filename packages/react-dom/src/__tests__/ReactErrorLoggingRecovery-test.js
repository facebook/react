/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
const ReactDOM = require('react-dom');

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

  it('should recover from errors in console.error', function() {
    const div = document.createElement('div');
    let didCatch = false;
    try {
      ReactDOM.render(<Bad />, div);
      ReactDOM.render(<Bad />, div);
    } catch (e) {
      expect(e.message).toBe('no');
      didCatch = true;
    }
    expect(didCatch).toBe(true);
    ReactDOM.render(<span>Hello</span>, div);
    expect(div.firstChild.textContent).toBe('Hello');

    // Verify the console.error bug is surfaced
    expect(() => {
      jest.runAllTimers();
    }).toThrow('Buggy console.error');
  });
});
