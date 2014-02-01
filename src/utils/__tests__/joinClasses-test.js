/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @emails react-core
 */

"use strict";

require('mock-modules').dontMock('joinClasses');

var joinClasses = require('joinClasses');

describe('joinClasses', function() {

  it('should return a single className', function() {
    expect(joinClasses('aaa')).toEqual('aaa');
  });

  it('should join two classes together', function() {
    var aaa = 'aaa';
    var bbb = 'bbb';
    expect(joinClasses(aaa, bbb)).toEqual('aaa bbb');
  });

  it('should join many classes together', function() {
    var aaa = 'aaa';
    var bbb = 'bbb';
    var ccc = 'ccc';
    var ddd = 'ddd';
    var eee = 'eee';
    expect(joinClasses(aaa, bbb, ccc, ddd, eee)).toEqual('aaa bbb ccc ddd eee');
  });

  it('should omit undefined and empty classes', function() {
    var aaa = 'aaa';
    var bbb;
    var ccc = null;
    var ddd = '';
    var eee = 'eee';
    expect(joinClasses(bbb)).toEqual('');
    expect(joinClasses(bbb, bbb, bbb)).toEqual('');
    expect(joinClasses(aaa, bbb, ccc, ddd, eee)).toEqual('aaa eee');
  });

});
