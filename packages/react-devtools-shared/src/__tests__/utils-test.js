/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  getDisplayName,
  getDisplayNameForReactElement,
  isPlainObject,
} from 'react-devtools-shared/src/utils';
import {stackToComponentSources} from 'react-devtools-shared/src/devtools/utils';
import {
  formatConsoleArguments,
  formatConsoleArgumentsToSingleString,
  formatWithStyles,
  gt,
  gte,
  parseSourceFromComponentStack,
} from 'react-devtools-shared/src/backend/utils';
import {
  REACT_SUSPENSE_LIST_TYPE as SuspenseList,
  REACT_STRICT_MODE_TYPE as StrictMode,
} from 'shared/ReactSymbols';
import {createElement} from 'react';
import {symbolicateSource} from '../symbolicateSource';

describe('utils', () => {
  describe('getDisplayName', () => {
    // @reactVersion >= 16.0
    it('should return a function name', () => {
      function FauxComponent() {}
      expect(getDisplayName(FauxComponent)).toEqual('FauxComponent');
    });

    // @reactVersion >= 16.0
    it('should return a displayName name if specified', () => {
      function FauxComponent() {}
      FauxComponent.displayName = 'OverrideDisplayName';
      expect(getDisplayName(FauxComponent)).toEqual('OverrideDisplayName');
    });

    // @reactVersion >= 16.0
    it('should return the fallback for anonymous functions', () => {
      expect(getDisplayName(() => {}, 'Fallback')).toEqual('Fallback');
    });

    // @reactVersion >= 16.0
    it('should return Anonymous for anonymous functions without a fallback', () => {
      expect(getDisplayName(() => {})).toEqual('Anonymous');
    });

    // Simulate a reported bug:
    // https://github.com/facebook/react/issues/16685
    // @reactVersion >= 16.0
    it('should return a fallback when the name prop is not a string', () => {
      const FauxComponent = {name: {}};
      expect(getDisplayName(FauxComponent, 'Fallback')).toEqual('Fallback');
    });

    it('should parse a component stack trace', () => {
      expect(
        stackToComponentSources(`
    at Foobar (http://localhost:3000/static/js/bundle.js:103:74)
    at a
    at header
    at div
    at App`),
      ).toEqual([
        ['Foobar', ['http://localhost:3000/static/js/bundle.js', 103, 74]],
        ['a', null],
        ['header', null],
        ['div', null],
        ['App', null],
      ]);
    });
  });

  describe('getDisplayNameForReactElement', () => {
    // @reactVersion >= 16.0
    it('should return correct display name for an element with function type', () => {
      function FauxComponent() {}
      FauxComponent.displayName = 'OverrideDisplayName';
      const element = createElement(FauxComponent);
      expect(getDisplayNameForReactElement(element)).toEqual(
        'OverrideDisplayName',
      );
    });

    // @reactVersion >= 16.0
    it('should return correct display name for an element with a type of StrictMode', () => {
      const element = createElement(StrictMode);
      expect(getDisplayNameForReactElement(element)).toEqual('StrictMode');
    });

    // @reactVersion >= 16.0
    it('should return correct display name for an element with a type of SuspenseList', () => {
      const element = createElement(SuspenseList);
      expect(getDisplayNameForReactElement(element)).toEqual('SuspenseList');
    });

    // @reactVersion >= 16.0
    it('should return NotImplementedInDevtools for an element with invalid symbol type', () => {
      const element = createElement(Symbol('foo'));
      expect(getDisplayNameForReactElement(element)).toEqual(
        'NotImplementedInDevtools',
      );
    });

    // @reactVersion >= 16.0
    it('should return NotImplementedInDevtools for an element with invalid type', () => {
      const element = createElement(true);
      expect(getDisplayNameForReactElement(element)).toEqual(
        'NotImplementedInDevtools',
      );
    });

    // @reactVersion >= 16.0
    it('should return Element for null type', () => {
      const element = createElement();
      expect(getDisplayNameForReactElement(element)).toEqual('Element');
    });
  });

  describe('formatConsoleArgumentsToSingleString', () => {
    it('should format simple strings', () => {
      expect(formatConsoleArgumentsToSingleString('a', 'b', 'c')).toEqual(
        'a b c',
      );
    });

    it('should format multiple argument types', () => {
      expect(formatConsoleArgumentsToSingleString('abc', 123, true)).toEqual(
        'abc 123 true',
      );
    });

    it('should support string substitutions', () => {
      expect(
        formatConsoleArgumentsToSingleString('a %s b %s c', 123, true),
      ).toEqual('a 123 b true c');
    });

    it('should gracefully handle Symbol types', () => {
      expect(
        formatConsoleArgumentsToSingleString(Symbol('a'), 'b', Symbol('c')),
      ).toEqual('Symbol(a) b Symbol(c)');
    });

    it('should gracefully handle Symbol type for the first argument', () => {
      expect(formatConsoleArgumentsToSingleString(Symbol('abc'), 123)).toEqual(
        'Symbol(abc) 123',
      );
    });

    it('should gracefully handle objects with no prototype', () => {
      expect(
        formatConsoleArgumentsToSingleString('%o', Object.create(null)),
      ).toEqual('%o [object Object]');
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
      expect(formatWithStyles(['%s %s', 'a', 'b', 'c'], 'color: gray')).toEqual(
        ['%c%s %s', 'color: gray', 'a', 'b', 'c'],
      );
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

  describe('semver comparisons', () => {
    it('gte should compare versions correctly', () => {
      expect(gte('1.2.3', '1.2.1')).toBe(true);
      expect(gte('1.2.1', '1.2.1')).toBe(true);
      expect(gte('1.2.1', '1.2.2')).toBe(false);
      expect(gte('10.0.0', '9.0.0')).toBe(true);
    });

    it('gt should compare versions correctly', () => {
      expect(gt('1.2.3', '1.2.1')).toBe(true);
      expect(gt('1.2.1', '1.2.1')).toBe(false);
      expect(gt('1.2.1', '1.2.2')).toBe(false);
      expect(gte('10.0.0', '9.0.0')).toBe(true);
    });
  });

  describe('isPlainObject', () => {
    it('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({a: 1})).toBe(true);
      expect(isPlainObject({a: {b: {c: 123}}})).toBe(true);
    });

    it('should return false if object is a class instance', () => {
      expect(isPlainObject(new (class C {})())).toBe(false);
    });

    it('should return false for objects, which have not only Object in its prototype chain', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(Symbol())).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isPlainObject(5)).toBe(false);
      expect(isPlainObject(true)).toBe(false);
    });

    it('should return true for objects with no prototype', () => {
      expect(isPlainObject(Object.create(null))).toBe(true);
    });
  });

  describe('parseSourceFromComponentStack', () => {
    it('should return null if passed empty string', () => {
      expect(parseSourceFromComponentStack('')).toEqual(null);
    });

    it('should construct the source from the first frame if available', () => {
      expect(
        parseSourceFromComponentStack(
          'at l (https://react.dev/_next/static/chunks/main-78a3b4c2aa4e4850.js:1:10389)\n' +
            'at f (https://react.dev/_next/static/chunks/pages/%5B%5B...markdownPath%5D%5D-af2ed613aedf1d57.js:1:8519)\n' +
            'at r (https://react.dev/_next/static/chunks/pages/_app-dd0b77ea7bd5b246.js:1:498)\n',
        ),
      ).toEqual({
        sourceURL:
          'https://react.dev/_next/static/chunks/main-78a3b4c2aa4e4850.js',
        line: 1,
        column: 10389,
      });
    });

    it('should construct the source from highest available frame', () => {
      expect(
        parseSourceFromComponentStack(
          '    at Q\n' +
            '    at a\n' +
            '    at m (https://react.dev/_next/static/chunks/848-122f91e9565d9ffa.js:5:9236)\n' +
            '    at div\n' +
            '    at div\n' +
            '    at div\n' +
            '    at nav\n' +
            '    at div\n' +
            '    at te (https://react.dev/_next/static/chunks/363-3c5f1b553b6be118.js:1:158857)\n' +
            '    at tt (https://react.dev/_next/static/chunks/363-3c5f1b553b6be118.js:1:165520)\n' +
            '    at f (https://react.dev/_next/static/chunks/pages/%5B%5B...markdownPath%5D%5D-af2ed613aedf1d57.js:1:8519)',
        ),
      ).toEqual({
        sourceURL:
          'https://react.dev/_next/static/chunks/848-122f91e9565d9ffa.js',
        line: 5,
        column: 9236,
      });
    });

    it('should construct the source from frame, which has only url specified', () => {
      expect(
        parseSourceFromComponentStack(
          '    at Q\n' +
            '    at a\n' +
            '    at https://react.dev/_next/static/chunks/848-122f91e9565d9ffa.js:5:9236\n',
        ),
      ).toEqual({
        sourceURL:
          'https://react.dev/_next/static/chunks/848-122f91e9565d9ffa.js',
        line: 5,
        column: 9236,
      });
    });

    it('should parse sourceURL correctly if it includes parentheses', () => {
      expect(
        parseSourceFromComponentStack(
          'at HotReload (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/hot-reloader-client.js:307:11)\n' +
            '    at Router (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:181:11)\n' +
            '    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:114:9)',
        ),
      ).toEqual({
        sourceURL:
          'webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/hot-reloader-client.js',
        line: 307,
        column: 11,
      });
    });

    it('should support Firefox stack', () => {
      expect(
        parseSourceFromComponentStack(
          'tt@https://react.dev/_next/static/chunks/363-3c5f1b553b6be118.js:1:165558\n' +
            'f@https://react.dev/_next/static/chunks/pages/%5B%5B...markdownPath%5D%5D-af2ed613aedf1d57.js:1:8535\n' +
            'r@https://react.dev/_next/static/chunks/pages/_app-dd0b77ea7bd5b246.js:1:513',
        ),
      ).toEqual({
        sourceURL:
          'https://react.dev/_next/static/chunks/363-3c5f1b553b6be118.js',
        line: 1,
        column: 165558,
      });
    });
  });

  describe('symbolicateSource', () => {
    const source = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.f = f;
function f() { }
//# sourceMappingURL=`;
    const result = {
      column: 16,
      line: 1,
      sourceURL: 'http://test/a.mts',
    };
    const fs = {
      'http://test/a.mts': `export function f() {}`,
      'http://test/a.mjs.map': `{"version":3,"file":"a.mjs","sourceRoot":"","sources":["a.mts"],"names":[],"mappings":";;AAAA,cAAsB;AAAtB,SAAgB,CAAC,KAAI,CAAC"}`,
      'http://test/a.mjs': `${source}a.mjs.map`,
      'http://test/b.mjs': `${source}./a.mjs.map`,
      'http://test/c.mjs': `${source}http://test/a.mjs.map`,
      'http://test/d.mjs': `${source}/a.mjs.map`,
    };
    const fetchFileWithCaching = async (url: string) => fs[url] || null;
    it('should parse source map urls', async () => {
      const run = url => symbolicateSource(fetchFileWithCaching, url, 4, 10);
      await expect(run('http://test/a.mjs')).resolves.toStrictEqual(result);
      await expect(run('http://test/b.mjs')).resolves.toStrictEqual(result);
      await expect(run('http://test/c.mjs')).resolves.toStrictEqual(result);
      await expect(run('http://test/d.mjs')).resolves.toStrictEqual(result);
    });
  });

  describe('formatConsoleArguments', () => {
    it('works with empty arguments list', () => {
      expect(formatConsoleArguments(...[])).toEqual([]);
    });

    it('works for string without escape sequences', () => {
      expect(
        formatConsoleArguments('This is the template', 'And another string'),
      ).toEqual(['This is the template', 'And another string']);
    });

    it('works with strings templates', () => {
      expect(formatConsoleArguments('This is %s template', 'the')).toEqual([
        'This is the template',
      ]);
    });

    it('skips %%s', () => {
      expect(formatConsoleArguments('This %%s is %s template', 'the')).toEqual([
        'This %%s is the template',
      ]);
    });

    it('works with %%%s', () => {
      expect(
        formatConsoleArguments('This %%%s is %s template', 'test', 'the'),
      ).toEqual(['This %%test is the template']);
    });

    it("doesn't inline objects", () => {
      expect(
        formatConsoleArguments('This is %s template with object %o', 'the', {}),
      ).toEqual(['This is the template with object %o', {}]);
    });

    it("doesn't inline css", () => {
      expect(
        formatConsoleArguments(
          'This is template with %c %s object %o',
          'color: rgba(...)',
          'the',
          {},
        ),
      ).toEqual([
        'This is template with %c the object %o',
        'color: rgba(...)',
        {},
      ]);
    });

    it('formats nullish values', () => {
      expect(formatConsoleArguments('This is the %s template', null)).toEqual([
        'This is the null template',
      ]);
      expect(
        formatConsoleArguments('This is the %s template', undefined),
      ).toEqual(['This is the undefined template']);
    });
  });
});
