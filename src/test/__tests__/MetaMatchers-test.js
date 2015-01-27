/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

var MetaMatchers = require('MetaMatchers');

describe('meta-matchers', function() {

  beforeEach(function() {
    this.addMatchers(MetaMatchers);
  });

  function a() {
    it('should add 1 and 2', function() {
      expect(1 + 2).toBe(3);
    });
  }

  function b() {
    it('should add 1 and 2', function() {
      expect(1 + 2).toBe(3);
    });
  }

  function c() {
    it('should add 1 and 2', function() {
      expect(1 + 2).toBe(3);
    });
    it('should mutiply 1 and 2', function() {
      expect(1 * 2).toBe(2);
    });
  }

  function d() {
    it('should add 1 and 2', function() {
      expect(1 + 2).toBe(3);
    });
    it('should mutiply 1 and 2', function() {
      expect(1 * 2).toBe(2);
      expect(2 * 1).toBe(2);
    });
  }

  it('tests equality of specs', function() {
    expect(a).toEqualSpecsIn(b);
  });

  it('tests inequality of specs and expects', function() {
    expect(b).not.toEqualSpecsIn(c);
    expect(c).not.toEqualSpecsIn(d);
  });

});
