/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var adler32 = require('adler32');

describe('adler32', () => {
  it('generates differing checksums', () => {
    expect(adler32('foo')).not.toBe(adler32('bar'));
  });

  it('generates consistent checksums', () => {
    expect(adler32('linux')).toBe(adler32('linux'));
  });

  it('is case sensitive', () => {
    expect(adler32('a')).not.toBe(adler32('A'));
  });

  it("doesn't barf on large inputs", () => {
    var str = '';
    for (var i = 0; i < 100000; i++) {
      str += 'This will be repeated to be very large indeed. ';
    }
    expect(adler32(str)).toBe(692898118);
  });

  it("doesn't barf on international inputs", () => {
    var str = 'Linux 是一個真棒操作系統!';
    expect(adler32(str)).toBe(-1183804097);
  });
});
