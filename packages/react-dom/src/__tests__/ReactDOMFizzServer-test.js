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

let React;
let ReactDOMFizzServer;

describe('ReactDOMFizzServer', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMFizzServer = require('react-dom/fizz');
  });

  it('should call render', () => {
    ReactDOMFizzServer.render(<div>hello world</div>);
  });
});
