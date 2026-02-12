/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Regression test for https://github.com/facebook/react/issues/35770
 *
 * Validates that react-compiler-runtime exports all helpers that the
 * compiler may emit imports for (via testComplexConfigDefaults in
 * babel-plugin-react-compiler/src/Utils/TestUtils.ts).
 */

import * as runtime from '../index';

describe('react-compiler-runtime export surface', () => {
  test('exports c (memo cache polyfill)', () => {
    expect(typeof runtime.c).toBe('function');
  });

  test('exports $dispatcherGuard (hook guards)', () => {
    expect(typeof runtime.$dispatcherGuard).toBe('function');
  });

  test('exports $structuralCheck (change detection)', () => {
    expect(typeof runtime.$structuralCheck).toBe('function');
  });

  test('exports useRenderCounter (instrumentation)', () => {
    expect(typeof runtime.useRenderCounter).toBe('function');
  });

  test('exports $reset', () => {
    expect(typeof runtime.$reset).toBe('function');
  });

  // --- Helpers added to fix #35770 ---

  test('exports makeReadOnly (enableEmitFreeze)', () => {
    expect(typeof runtime.makeReadOnly).toBe('function');
  });

  test('exports $makeReadOnly as alias for makeReadOnly', () => {
    expect(typeof runtime.$makeReadOnly).toBe('function');
    expect(runtime.$makeReadOnly).toBe(runtime.makeReadOnly);
  });

  test('$makeReadOnly does not throw TODO', () => {
    // Before the fix, $makeReadOnly threw "TODO: implement $makeReadOnly..."
    expect(() => runtime.$makeReadOnly('hello', 'test')).not.toThrow();
  });

  test('exports shouldInstrument (enableEmitInstrumentForget gating)', () => {
    // shouldInstrument is used as a boolean value in compiled output:
    //   if (DEV && shouldInstrument) useRenderCounter(...)
    expect('shouldInstrument' in runtime).toBe(true);
    expect(typeof runtime.shouldInstrument).toBe('boolean');
    expect(runtime.shouldInstrument).toBe(true);
  });

  test('exports useContext_withSelector (lowerContextAccess)', () => {
    expect(typeof runtime.useContext_withSelector).toBe('function');
  });
});

describe('makeReadOnly', () => {
  test('returns primitive values unchanged', () => {
    expect(runtime.makeReadOnly(42, 'test')).toBe(42);
    expect(runtime.makeReadOnly('hello', 'test')).toBe('hello');
    expect(runtime.makeReadOnly(true, 'test')).toBe(true);
    expect(runtime.makeReadOnly(null, 'test')).toBe(null);
    expect(runtime.makeReadOnly(undefined, 'test')).toBe(undefined);
  });

  test('returns same object reference', () => {
    const obj = {a: 1, b: 2};
    const result = runtime.makeReadOnly(obj, 'TestComponent');
    expect(result).toBe(obj);
  });

  test('logs error on mutation of frozen property', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const obj = {x: 1};
    runtime.makeReadOnly(obj, 'TestComponent');
    obj.x = 2;
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('source parameter is optional', () => {
    expect(() => runtime.makeReadOnly({a: 1})).not.toThrow();
  });
});
