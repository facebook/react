/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {getDisplayName} from 'react-devtools-shared/src/utils';

describe('utils', () => {
  describe('getDisplayName', () => {
    const fallbackName = 'TestFallbackName';

    it('should return default fallback name for empty object', () => {
      const result = getDisplayName({});
      expect(result).toEqual('Anonymous');
    });

    it('should return displayName property from object', () => {
      const obj = {
        displayName: 'TestDisplayName',
      };
      const result = getDisplayName(obj);
      expect(result).toEqual(obj.displayName);
    });

    it('should return name property from object', () => {
      const obj = {
        name: 'TestName',
      };
      const result = getDisplayName(obj);
      expect(result).toEqual(obj.name);
    });

    it('should return provided fallback name for empty object', () => {
      const result = getDisplayName({}, fallbackName);
      expect(result).toEqual(fallbackName);
    });

    it('should provide fallback name when displayName prop is not a string', () => {
      const obj = {
        displayName: {},
      };
      const result = getDisplayName(obj, fallbackName);
      expect(result).toEqual(fallbackName);
    });

    it('should provide fallback name when name prop is not a string', () => {
      const obj = {
        name: {},
      };
      const result = getDisplayName(obj, fallbackName);
      expect(result).toEqual(fallbackName);
    });
  });
});
