/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

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
