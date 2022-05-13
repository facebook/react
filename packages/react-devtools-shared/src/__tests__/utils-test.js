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
  format,
  formatWithStyles,
} from 'react-devtools-shared/src/backend/utils';
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

  describe('formatWithStyles', () => {
    it('should format empty arrays', () => {
      expect(formatWithStyles([])).toEqual([]);
      expect(formatWithStyles([], 'gray')).toEqual([]);
      expect(formatWithStyles(undefined)).toEqual(undefined);
    });

    it('should bail out of strings with styles', () => {
      expect(
        formatWithStyles(['%ca', 'color: green', 'b', 'c'], 'color: gray'),
      ).toEqual(['%ca', 'color: green', 'b', 'c']);
    });

    it('should format simple strings', () => {
      expect(formatWithStyles(['a'])).toEqual(['a']);

      expect(formatWithStyles(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
      expect(formatWithStyles(['a'], 'color: gray')).toEqual([
        '%c%s',
        'color: gray',
        'a',
      ]);
      expect(formatWithStyles(['a', 'b', 'c'], 'color: gray')).toEqual([
        '%c%s %s %s',
        'color: gray',
        'a',
        'b',
        'c',
      ]);
    });

    it('should format string substituions', () => {
      expect(
        formatWithStyles(['%s %s %s', 'a', 'b', 'c'], 'color: gray'),
      ).toEqual(['%c%s %s %s', 'color: gray', 'a', 'b', 'c']);

      // The last letter isn't gray here but I think it's not a big
      // deal, since there is a string substituion but it's incorrect
      expect(
        formatWithStyles(['%s %s', 'a', 'b', 'c'], 'color: gray'),
      ).toEqual(['%c%s %s', 'color: gray', 'a', 'b', 'c']);
    });

    it('should support multiple argument types', () => {
      const symbol = Symbol('a');
      expect(
        formatWithStyles(
          ['abc', 123, 12.3, true, {hello: 'world'}, symbol],
          'color: gray',
        ),
      ).toEqual([
        '%c%s %i %f %s %o %s',
        'color: gray',
        'abc',
        123,
        12.3,
        true,
        {hello: 'world'},
        symbol,
      ]);
    });

    it('should properly format escaped string substituions', () => {
      expect(formatWithStyles(['%%s'], 'color: gray')).toEqual([
        '%c%s',
        'color: gray',
        '%%s',
      ]);
      expect(formatWithStyles(['%%c'], 'color: gray')).toEqual([
        '%c%s',
        'color: gray',
        '%%c',
      ]);
      expect(formatWithStyles(['%%c%c'], 'color: gray')).toEqual(['%%c%c']);
    });

    it('should format non string inputs as the first argument', () => {
      expect(formatWithStyles([{foo: 'bar'}])).toEqual([{foo: 'bar'}]);
      expect(formatWithStyles([[1, 2, 3]])).toEqual([[1, 2, 3]]);
      expect(formatWithStyles([{foo: 'bar'}], 'color: gray')).toEqual([
        '%c%o',
        'color: gray',
        {foo: 'bar'},
      ]);
      expect(formatWithStyles([[1, 2, 3]], 'color: gray')).toEqual([
        '%c%o',
        'color: gray',
        [1, 2, 3],
      ]);
      expect(formatWithStyles([{foo: 'bar'}, 'hi'], 'color: gray')).toEqual([
        '%c%o %s',
        'color: gray',
        {foo: 'bar'},
        'hi',
      ]);
    });
  });
});
