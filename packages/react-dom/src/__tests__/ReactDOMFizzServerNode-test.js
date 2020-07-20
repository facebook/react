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

describe('ReactDOMFizzServer', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    if (__EXPERIMENTAL__) {
      ReactDOMFizzServer = require('react-dom/unstable-fizz');
    }
    Stream = require('stream');
  });

  function getTestWritable() {
    const writable = new Stream.PassThrough();
    writable.setEncoding('utf8');
    writable.result = '';
    writable.on('data', chunk => (writable.result += chunk));
    return writable;
  }

  // @gate experimental
  it('should call pipeToNodeWritable', () => {
    const writable = getTestWritable();
    ReactDOMFizzServer.pipeToNodeWritable(<div>hello world</div>, writable);
    jest.runAllTimers();
    expect(writable.result).toBe('<div>hello world</div>');
  });
});
