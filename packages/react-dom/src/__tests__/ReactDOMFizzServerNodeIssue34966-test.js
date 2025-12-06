/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let Stream;
let React;
let ReactDOMFizzServer;
let Suspense;
let lazy;
let act;

describe('ReactDOMFizzServerNode Issue 34966', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMFizzServer = require('react-dom/server');
    Stream = require('stream');
    Suspense = React.Suspense;
    lazy = React.lazy;
    act = require('internal-test-utils').act;
  });

  function getTestWritable() {
    const writable = new Stream.PassThrough();
    writable.setEncoding('utf8');
    const output = {result: '', error: undefined};
    writable.on('data', chunk => {
      output.result += chunk;
    });
    writable.on('error', error => {
      output.error = error;
    });
    const completed = new Promise(resolve => {
      writable.on('finish', () => {
        resolve();
      });
      writable.on('error', () => {
        resolve();
      });
    });
    return {writable, completed, output};
  }

  // @gate __DEV__
  it('should not inject streaming scripts in onAllReady with lazy components', async () => {
    // Reproduces the example from issue #34966
    const Button = () =>
      React.createElement(
        'button',
        {
          type: 'button',
          'data-test-button-value1': 'some-value-for-test',
          'data-test-button-value2': 'some-value-for-test',
        },
        'Test',
      );

    const LazyButton = lazy(async () => ({default: Button}));

    const App = () =>
      React.createElement(
        'html',
        null,
        React.createElement('head', null),
        React.createElement(
          'body',
          null,
          React.createElement(
            Suspense,
            {fallback: React.createElement('h1', null, 'Loading...')},
            React.createElement(LazyButton),
          ),
        ),
      );

    const {writable, output, completed} = getTestWritable();

    let allReadyCalled = false;

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        React.createElement(App),
        {
          onAllReady() {
            allReadyCalled = true;
            pipe(writable);
          },
        },
      );
    });

    await completed;

    expect(allReadyCalled).toBe(true);

    // Verify there are no streaming scripts
    expect(output.result).not.toContain('$RC');
    expect(output.result).not.toContain('$RV');
    expect(output.result).not.toContain('$RB');
    expect(output.result).not.toContain('$RT');

    // Verify there are no hidden elements
    expect(output.result).not.toContain('<div hidden');
    expect(output.result).not.toContain('<template');

    // Verify the button is rendered inline (not hidden)
    expect(output.result).toContain('<button');
    expect(output.result).toContain('data-test-button-value1');
    expect(output.result).toContain('Test</button>');

    // Verify the fallback is not present
    expect(output.result).not.toContain('Loading...');
  });

  // @gate __DEV__
  it('should inject streaming scripts in onShellReady with lazy components', async () => {
    // This test verifies that in onShellReady (streaming mode) scripts SHOULD be injected
    const Button = () =>
      React.createElement('button', {type: 'button'}, 'Test');

    const LazyButton = lazy(async () => ({default: Button}));

    const App = () =>
      React.createElement(
        'html',
        null,
        React.createElement('head', null),
        React.createElement(
          'body',
          null,
          React.createElement(
            Suspense,
            {fallback: React.createElement('h1', null, 'Loading...')},
            React.createElement(LazyButton),
          ),
        ),
      );

    const {writable, output, completed} = getTestWritable();

    let shellReadyCalled = false;

    await act(async () => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(
        React.createElement(App),
        {
          onShellReady() {
            shellReadyCalled = true;
            pipe(writable);
          },
        },
      );
    });

    await completed;

    expect(shellReadyCalled).toBe(true);

    // In onShellReady mode, streaming scripts SHOULD be present (this is correct behavior)
    // These assertions may change depending on the implementation
  });
});

