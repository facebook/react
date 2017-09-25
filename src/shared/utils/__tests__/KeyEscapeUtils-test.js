/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var KeyEscapeUtils;

describe('KeyEscapeUtils', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();

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
