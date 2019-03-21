/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */
'use strict';

let ReactErrorProd;

describe('ReactErrorProd', () => {
  let globalErrorMock;

  beforeEach(() => {
    if (!__DEV__) {
      // In production, our Jest environment overrides the global Error
      // class in order to decode error messages automatically. However
      // this is a single test where we actually *don't* want to decode
      // them. So we assert that the OriginalError exists, and temporarily
      // set the global Error object back to it.
      globalErrorMock = global.Error;
      global.Error = globalErrorMock.OriginalError;
      expect(typeof global.Error).toBe('function');
    }
    jest.resetModules();
    ReactErrorProd = require('shared/ReactErrorProd').default;
  });

  afterEach(() => {
    if (!__DEV__) {
      global.Error = globalErrorMock;
    }
  });

  it('should throw with the correct number of `%s`s in the URL', () => {
    expect(function() {
      throw ReactErrorProd(124, 'foo', 'bar');
    }).toThrowError(
      'Minified React error #124; visit ' +
        'https://reactjs.org/docs/error-decoder.html?invariant=124&args[]=foo&args[]=bar' +
        ' for the full message or use the non-minified dev environment' +
        ' for full errors and additional helpful warnings.',
    );

    expect(function() {
      throw ReactErrorProd(20);
    }).toThrowError(
      'Minified React error #20; visit ' +
        'https://reactjs.org/docs/error-decoder.html?invariant=20' +
        ' for the full message or use the non-minified dev environment' +
        ' for full errors and additional helpful warnings.',
    );

    expect(function() {
      throw ReactErrorProd(77, '<div>', '&?bar');
    }).toThrowError(
      'Minified React error #77; visit ' +
        'https://reactjs.org/docs/error-decoder.html?invariant=77&args[]=%3Cdiv%3E&args[]=%26%3Fbar' +
        ' for the full message or use the non-minified dev environment' +
        ' for full errors and additional helpful warnings.',
    );
  });
});
