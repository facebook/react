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

describe('ReactClassEquivalence', function() {

  beforeEach(function() {
    this.addMatchers(MetaMatchers);
  });

  var es6 = () => require('./ReactES6Class-test.js');
  var coffee = () => require('./ReactCoffeeScriptClass-test.coffee');

  it('tests the same thing for es6 classes and coffee script', function() {
    expect(coffee).toEqualSpecsIn(es6);
  });

});
