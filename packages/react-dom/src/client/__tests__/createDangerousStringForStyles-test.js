/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */
'use strict';

const createDangerousStringForStyles = require('../createDangerousStringForStyles').default;

describe('createDangerousStringForStyles', () => {
  describe('should return empty string if null or undefined has been passed', () => {
    it('null', () => {
      const styleString = createDangerousStringForStyles(null);
      expect(styleString).toBe('');
    });

    it('undefined', () => {
      const styleString = createDangerousStringForStyles(undefined);
      expect(styleString).toBe('');
    })
  });

  describe('should split camelCase with dashes', () => {
    it('camelCase', () => {
      const styleString = createDangerousStringForStyles({
        marginTop: '1px',
        paddingBottom: '-2px',
        display: 'none'
      });
      expect(styleString).toBe('margin-top: 1px; padding-bottom: -2px; display: none;');
    })
  });

  describe('should split UpperCamelCase with dashes and add dash to the beginning', () => {
    it('UpperCamelCase', () => {
      const styleString = createDangerousStringForStyles({
        WebkitLineClamp: 1,
        WebkitTouchCallout: 'default',
      });
      expect(styleString).toBe('-webkit-line-clamp: 1; -webkit-touch-callout: default;');
    })
  });
});
