/**
 * Copyright 2013 Facebook, Inc.
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

"use strict";

describe('CSSPropertyOperations', function() {
  var CSSPropertyOperations;

  beforeEach(function() {
    require("../../mock-modules").dumpCache();
    CSSPropertyOperations = require("../../CSSPropertyOperations");
  });

  it('should create markup for simple styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      backgroundColor: '#3b5998',
      display: 'none'
    })).toBe('background-color:#3b5998;display:none;');
  });

  it('should ignore undefined styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      backgroundColor: undefined,
      display: 'none'
    })).toBe('display:none;');
  });

  it('should automatically append `px` to relevant styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      margin: 16,
      opacity: 0.5,
      padding: '4px'
    })).toBe('margin:16px;opacity:0.5;padding:4px;');
  });

});
