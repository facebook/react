/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */
'use strict';

var reactProdInvariant;

describe('reactProdInvariant', function() {
  beforeEach(function() {
    jest.resetModuleRegistry();
    reactProdInvariant = require('reactProdInvariant');
  });

  it('should throw with the correct number of `%s`s in the URL', function() {
    expect(function() {
      reactProdInvariant(124, 'foo', 'bar');
    }).toThrowError(
      'React: production error #124. Visit ' +
      'http://facebook.github.io/react/docs/error-codes.html?invariant=124&args[]=foo&args[]=bar' +
      ' for more details.'
    );

    expect(function() {
      reactProdInvariant(20);
    }).toThrowError(
      'React: production error #20. Visit ' +
      'http://facebook.github.io/react/docs/error-codes.html?invariant=20' +
      ' for more details.'
    );

    expect(function() {
      reactProdInvariant(77, '<div>', '&?bar');
    }).toThrowError(
      'React: production error #77. Visit ' +
      'http://facebook.github.io/react/docs/error-codes.html?invariant=77&args[]=%3Cdiv%3E&args[]=%26%3Fbar' +
      ' for more details.'
    );
  });
});
