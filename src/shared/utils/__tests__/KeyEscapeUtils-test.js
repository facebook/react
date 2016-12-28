/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var KeyEscapeUtils;

describe('KeyEscapeUtils', () => {
  beforeEach(() => {
    jest.resetModules();

    KeyEscapeUtils = require('KeyEscapeUtils');
  });

  describe('escape', () => {
    it('should properly escape and wrap user defined keys', () => {
      expect(KeyEscapeUtils.escape('1')).toBe('$1');
      expect(KeyEscapeUtils.escape('1=::=2')).toBe('$1=0=2=2=02');
    });
  });

  describe('unescape', () => {
    it('should properly unescape and unwrap user defined keys', () => {
      expect(KeyEscapeUtils.unescape('.1')).toBe('1');
      expect(KeyEscapeUtils.unescape('$1')).toBe('1');
      expect(KeyEscapeUtils.unescape('.$1')).toBe('1');
      expect(KeyEscapeUtils.unescape('$1=0=2=2=02')).toBe('1=::=2');
    });
  });
});
