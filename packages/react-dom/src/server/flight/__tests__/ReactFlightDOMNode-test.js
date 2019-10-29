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
let ReactFlightDOMServer;

describe('ReactFlightDOM', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFlightDOMServer = require('react-dom/unstable-flight-server');
    Stream = require('stream');
  });

  function getTestWritable() {
    let writable = new Stream.PassThrough();
    writable.setEncoding('utf8');
    writable.result = '';
    writable.on('data', chunk => (writable.result += chunk));
    return writable;
  }

  it('should resolve HTML', () => {
    function Text({children}) {
      return <span>{children}</span>;
    }
    function HTML() {
      return (
        <div>
          <Text>hello</Text>
          <Text>world</Text>
        </div>
      );
    }

    let writable = getTestWritable();
    let model = {
      html: <HTML />,
    };
    ReactFlightDOMServer.pipeToNodeWritable(model, writable);
    jest.runAllTimers();
    let result = JSON.parse(writable.result);
    expect(result).toEqual({
      html: '<div><span>hello</span><span>world</span></div>',
    });
  });
});
