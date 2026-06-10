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

let React;
let ReactDOMFizzServer;
let Suspense;

describe('ReactDOMFizzServerNoScript', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    Suspense = React.Suspense;
    ReactDOMFizzServer = require('react-dom/server');
  });

  it('renders large content inline for no-JS support (size-based outlining disabled)', async () => {
    // Generate content larger than progressiveChunkSize (100)
    const largeContent = 'A'.repeat(2000);

    function App() {
      return (
        <Suspense fallback="Loading...">
          <div>{largeContent}</div>
        </Suspense>
      );
    }

    let streamedContent = '';
    const writable = new (require('stream').Writable)({
      write(chunk, encoding, callback) {
        streamedContent += chunk.toString();
        callback();
      },
    });

    await new Promise(resolve => {
      const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<App />, {
        progressiveChunkSize: 100,
        onAllReady() {
          pipe(writable);
          resolve();
        },
      });
    });

    // Verify content is present in the initial stream (No-JS user sees it)
    expect(streamedContent).toContain(largeContent);

    // Verify fallback is NOT present (because it was inlined, so no pending state)
    // Note: If it WAS outlined, we would see "Loading..."
    expect(streamedContent).not.toContain('Loading...');
  });
});
