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
let ReactFlightDOM;

describe('ReactFlightDOM', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFlightDOM = require('react-dom/unstable-flight');
    Stream = require('stream');
  });

  function getTestWritable() {
    let writable = new Stream.PassThrough();
    writable.setEncoding('utf8');
    writable.result = '';
    writable.on('data', chunk => (writable.result += chunk));
    return writable;
  }

  it('should call pipeToNodeWritable', () => {
    let writable = getTestWritable();
    ReactFlightDOM.pipeToNodeWritable(<div>hello world</div>, writable);
    jest.runAllTimers();
    expect(writable.result).toBe('<div>hello world</div>');
  });
});
