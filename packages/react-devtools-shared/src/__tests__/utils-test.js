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
import {format} from 'react-devtools-shared/src/backend/utils';
import {
  REACT_SUSPENSE_LIST_TYPE as SuspenseList,
  REACT_STRICT_MODE_TYPE as StrictMode,
} from 'shared/ReactSymbols';
import {createElement} from 'react/src/ReactElement';

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
      const element = createElement(FauxComponent);
      expect(getDisplayNameForReactElement(element)).toEqual(
        'OverrideDisplayName',
      );
    });

    it('should return correct display name for an element with a type of StrictMode', () => {
      const element = createElement(StrictMode);
      expect(getDisplayNameForReactElement(element)).toEqual('StrictMode');
    });

    it('should return correct display name for an element with a type of SuspenseList', () => {
      const element = createElement(SuspenseList);
      expect(getDisplayNameForReactElement(element)).toEqual('SuspenseList');
    });

    it('should return NotImplementedInDevtools for an element with invalid symbol type', () => {
      const element = createElement(Symbol('foo'));
      expect(getDisplayNameForReactElement(element)).toEqual(
        'NotImplementedInDevtools',
      );
    });

    it('should return NotImplementedInDevtools for an element with invalid type', () => {
      const element = createElement(true);
      expect(getDisplayNameForReactElement(element)).toEqual(
        'NotImplementedInDevtools',
      );
    });

    it('should return Element for null type', () => {
      const element = createElement();
      expect(getDisplayNameForReactElement(element)).toEqual('Element');
    });
  });

  describe('format', () => {
    it('should format simple strings', () => {
      expect(format('a', 'b', 'c')).toEqual('a b c');
    });

    it('should format multiple argument types', () => {
      expect(format('abc', 123, true)).toEqual('abc 123 true');
    });

    it('should support string substitutions', () => {
      expect(format('a %s b %s c', 123, true)).toEqual('a 123 b true c');
    });

    it('should gracefully handle Symbol types', () => {
      expect(format(Symbol('a'), 'b', Symbol('c'))).toEqual(
        'Symbol(a) b Symbol(c)',
      );
    });

    it('should gracefully handle Symbol type for the first argument', () => {
      expect(format(Symbol('abc'), 123)).toEqual('Symbol(abc) 123');
    });
  });
});
