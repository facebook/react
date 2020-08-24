/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  getDisplayName, 
  getDisplayNameForReactElement,
} from 'react-devtools-shared/src/utils';
import {
  REACT_SUSPENSE_LIST_TYPE as SuspenseList,
  REACT_STRICT_MODE_TYPE as StrictMode,
  REACT_ELEMENT_TYPE as Element,
} from 'shared/ReactSymbols';

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
  describe('getDisplayNameForReactElement', () => {
    it('should return correct display name for an element with function type', () => {
      function FauxComponent() {}
      FauxComponent.displayName = 'OverrideDisplayName';
      const FauxElement = {type: FauxComponent}
      expect(getDisplayNameForReactElement(FauxElement)).toEqual('OverrideDisplayName');
    });
    it('should return correct display name for an element with a type of StrictMode', () => {
      const FauxElement = {}
      FauxElement.type = StrictMode;
      FauxElement.$$typeof = Element;
      expect(getDisplayNameForReactElement(FauxElement)).toEqual('StrictMode');
    });
    it('should return correct display name for an element with a type of SuspenseList', () => {
      const FauxElement = {}
      FauxElement.type = SuspenseList;
      FauxElement.$$typeof = Element;
      expect(getDisplayNameForReactElement(FauxElement)).toEqual('SuspenseList');
    });
    it('should return NotImplementedInDevtools for an element with invalid symbol type', () => {
      const FauxElement = {type: Symbol('foo')}
      expect(getDisplayNameForReactElement(FauxElement)).toEqual('NotImplementedInDevtools');
    });
    it('should return NotImplementedInDevtools for an element with invalid type', () => {
      const FauxElement = {type: true}
      expect(getDisplayNameForReactElement(FauxElement)).toEqual('NotImplementedInDevtools');
    });
    it('should return Element for null type', () => {
      const FauxElement = {type: null}
      expect(getDisplayNameForReactElement(FauxElement)).toEqual('Element');
    });
  });
});
