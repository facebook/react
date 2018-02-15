/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * @desc adopted from w3c/web-platform-tests
 * @see https://github.com/w3c/web-platform-tests/tree/d977904a0af38c7e2d28c6e1327fb437c2b2e0da/requestidlecallback
 *
 * @emails react-core
 */

'use strict';

let requestIdleCallback;

describe('RequestIdleCallback', () => {
  beforeEach(() => {
    jest.resetModules();

    requestIdleCallback = require('request-idle-callback-polyfill');
  });

  describe('requestIdleCallback', () => {
      it('should be a function', () => {});
      it('returns a number', () => {});
      it('exceptions are reported to error handlers', () => {});
      it('nested callbacks get a new idle period', () => {});
      it('nested callbacks dont get the same deadline', () => {});
      it('invoked at least once before the timeout', () => {});
      it('callbacks invoked in order (called iteratively)', () => {});
      it('callbacks invoked in order (called recursively)', () => {});


  });

  descibe('cancelIdleCallback', () => {
    it('should be a function', () => {});
    it('cancels a callback', () => {});
  });
});
