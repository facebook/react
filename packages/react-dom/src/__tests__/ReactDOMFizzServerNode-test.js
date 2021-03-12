/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

describe('ReactDOMFizzServer', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzServer = require('react-dom/unstable-fizz');
    }
    Stream = require('stream');
    Suspense = React.Suspense;
  });

  function getTestWritable() {
    const writable = new Stream.PassThrough();
    writable.setEncoding('utf8');
    writable.result = '';
    writable.on('data', chunk => {
      writable.result += chunk;
    });
    writable.on('error', error => {
      writable.error = error;
    });
    return writable;
  }

  function waitUntilClose(writable) {
    return new Promise(resolve => writable.on('close', resolve));
  }

  const theError = new Error('This is an error');
  function Throw() {
    throw theError;
  }
  const theInfinitePromise = new Promise(() => {});
  function InfiniteSuspend() {
    throw theInfinitePromise;
  }

  // @gate experimental
  it('should call pipeToNodeWritable', () => {
    const writable = getTestWritable();
    ReactDOMFizzServer.pipeToNodeWritable(<div>hello world</div>, writable);
    jest.runAllTimers();
    expect(writable.result).toBe('<div>hello world</div>');
  });

  // @gate experimental
  it('should error the stream when an error is thrown at the root', async () => {
    const writable = getTestWritable();
    ReactDOMFizzServer.pipeToNodeWritable(
      <div>
        <Throw />
      </div>,
      writable,
    );

    await waitUntilClose(writable);

    expect(writable.error).toBe(theError);
    expect(writable.result).toBe('');
  });

  // @gate experimental
  it('should error the stream when an error is thrown inside a fallback', async () => {
    const writable = getTestWritable();
    ReactDOMFizzServer.pipeToNodeWritable(
      <div>
        <Suspense fallback={<Throw />}>
          <InfiniteSuspend />
        </Suspense>
      </div>,
      writable,
    );

    await waitUntilClose(writable);

    expect(writable.error).toBe(theError);
    expect(writable.result).toBe('');
  });

  // @gate experimental
  it('should not error the stream when an error is thrown inside suspense boundary', async () => {
    const writable = getTestWritable();
    ReactDOMFizzServer.pipeToNodeWritable(
      <div>
        <Suspense fallback={<div>Loading</div>}>
          <Throw />
        </Suspense>
      </div>,
      writable,
    );

    await waitUntilClose(writable);

    expect(writable.error).toBe(undefined);
    expect(writable.result).toContain('Loading');
  });
});
