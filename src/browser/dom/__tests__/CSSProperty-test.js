/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

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
