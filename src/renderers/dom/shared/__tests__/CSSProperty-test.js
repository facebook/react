/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('CSSProperty', () => {
  var CSSProperty;

  beforeEach(() => {
    jest.resetModuleRegistry();
    CSSProperty = require('CSSProperty');
  });

  it('should generate browser prefixes for its `isUnitlessNumber`', () => {
    expect(CSSProperty.isUnitlessNumber.lineClamp).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.WebkitLineClamp).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.msFlexGrow).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.MozFlexGrow).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.msGridRow).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.msGridRowEnd).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.msGridRowSpan).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.msGridRowStart).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.msGridColumn).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.msGridColumnEnd).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.msGridColumnSpan).toBeTruthy();
    expect(CSSProperty.isUnitlessNumber.msGridColumnStart).toBeTruthy();
  });
});
