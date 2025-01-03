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

let React;
let ReactNoopServer;
let sha256;

describe('ReactServer', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoopServer = require('react-noop-renderer/server');
    sha256 = require('../ReactServerStreamConfigNode.js')
  });

  function div(...children) {
    children = children.map(c =>
      typeof c === 'string' ? {text: c, hidden: false} : c,
    );
    return {type: 'div', children, prop: undefined, hidden: false};
  }

  it('can call render', () => {
    const result = ReactNoopServer.render(<div>hello world</div>);
    expect(result.root).toEqual(div('hello world'));
  });

  it('correctly computes sha256', () =>{
    const expectedOutput = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
    const hash = sha256.createFastHash('hello world');
    expect(hash).toBe(expectedOutput);
  });
});
