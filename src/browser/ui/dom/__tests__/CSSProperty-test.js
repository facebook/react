/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

/*jslint evil: true */

'use strict';

describe('CSSProperty', function() {
  var CSSProperty;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    CSSProperty = require('CSSProperty');
  });

  it('should generate browser prefixes for its `isUnitlessNumber`', function() {
    expect(CSSProperty.isUnitlessNumber.lineClamp).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.WebkitLineClamp).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.msFlexGrow).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.MozFlexGrow).toBeTruthy();
  });

});
