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
    it('should return a function name', () => {
      function FauxComponent() {}
      expect(getDisplayName(FauxComponent)).toEqual('FauxComponent');
    });

    it('should return a displayName name if specified', () => {
      function FauxComponent() {}
      FauxComponent.displayName = 'OverrideDisplayName';
      expect(getDisplayName(FauxComponent)).toEqual('OverrideDisplayName');
    });

    it('should return the fallback for anonymous functions', () => {
      expect(getDisplayName(() => {}, 'Fallback')).toEqual('Fallback');
    });

    it('should return Anonymous for anonymous functions without a fallback', () => {
      expect(getDisplayName(() => {})).toEqual('Anonymous');
    });

    // Simulate a reported bug:
    // https://github.com/facebook/react/issues/16685
    it('should return a fallback when the name prop is not a string', () => {
      const FauxComponent = {name: {}};
      expect(getDisplayName(FauxComponent, 'Fallback')).toEqual('Fallback');
    });
  });
});
