/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOM = require('react-dom');

// Isolate test renderer.
jest.resetModules();
const ReactTestRenderer = require('react-test-renderer');

describe('ReactTestRenderer', () => {
  it('should warn if used to render a ReactDOM portal', () => {
    const container = document.createElement('div');
    expect(() => {
      expect(() => {
        ReactTestRenderer.create(ReactDOM.createPortal('foo', container));
      }).toThrow();
    }).toWarnDev('An invalid container has been provided.', {
      withoutStack: true,
    });
  });
});
