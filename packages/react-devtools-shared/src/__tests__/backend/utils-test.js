/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {getSerializableData} from 'react-devtools-shared/src/backend/utils';

describe('backend/utils', () => {
  describe('getSerializableData', () => {
    it('should return null if data is null', () => {
      expect(getSerializableData(null)).toEqual(null);
    });

    it('should return undefined if data is undefined', () => {
      expect(getSerializableData(undefined)).toEqual(undefined);
    });

    it('should return string if data is string', () => {
      expect(getSerializableData('react')).toEqual('react');
    });

    it('should return number if data is number', () => {
      expect(getSerializableData(123)).toEqual(123);
    });

    it('should return array object if data is array object', () => {
      expect(getSerializableData([{name: 'react'}])).toEqual([{name: 'react'}]);
    });

    it('should return object if data is object', () => {
      expect(getSerializableData({name: 'react'})).toEqual({name: 'react'});
    });

    it('should return string with suffix n if data is BigInt', () => {
      // eslint-disable-next-line no-undef
      expect(getSerializableData(BigInt('123'))).toEqual('123n');
    });
  });
});
