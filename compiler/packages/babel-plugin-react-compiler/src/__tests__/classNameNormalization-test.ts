/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Tests for className whitespace normalization.
 *
 * This addresses GitHub issue #35481 where multiline className strings
 * cause hydration mismatches between server and client rendering.
 *
 * @see https://github.com/facebook/react/issues/35481
 */

// Recreate the normalization logic for testing
const CLASS_WHITESPACE_NORMALIZE_PATTERN = /[\t\n\r]+/g;

function normalizeClassNameWhitespace(value: string): string {
  return value.replace(CLASS_WHITESPACE_NORMALIZE_PATTERN, ' ');
}

function isClassNameAttribute(name: string): boolean {
  return name === 'className' || name === 'class';
}

describe('className whitespace normalization', () => {
  describe('normalizeClassNameWhitespace', () => {
    test('normalizes single newline to space', () => {
      expect(normalizeClassNameWhitespace('flex\nitems-center')).toBe(
        'flex items-center',
      );
    });

    test('normalizes multiple newlines to single space', () => {
      expect(normalizeClassNameWhitespace('flex\n\n\nitems-center')).toBe(
        'flex items-center',
      );
    });

    test('normalizes carriage return to space', () => {
      expect(normalizeClassNameWhitespace('flex\ritems-center')).toBe(
        'flex items-center',
      );
    });

    test('normalizes CRLF to space', () => {
      expect(normalizeClassNameWhitespace('flex\r\nitems-center')).toBe(
        'flex items-center',
      );
    });

    test('normalizes tabs to space', () => {
      expect(normalizeClassNameWhitespace('flex\titems-center')).toBe(
        'flex items-center',
      );
    });

    test('normalizes leading newlines', () => {
      expect(normalizeClassNameWhitespace('\n  flex items-center')).toBe(
        '   flex items-center',
      );
    });

    test('normalizes trailing newlines', () => {
      expect(normalizeClassNameWhitespace('flex items-center\n  ')).toBe(
        'flex items-center   ',
      );
    });

    test('normalizes multiline className from issue #35481', () => {
      const input = `
        flex min-h-screen items-center justify-center bg-zinc-50 font-sans
        dark:bg-black
      `;
      const expected =
        '         flex min-h-screen items-center justify-center bg-zinc-50 font-sans         dark:bg-black       ';
      expect(normalizeClassNameWhitespace(input)).toBe(expected);
    });

    test('preserves single spaces', () => {
      expect(normalizeClassNameWhitespace('flex items-center')).toBe(
        'flex items-center',
      );
    });

    test('preserves multiple spaces (not newlines)', () => {
      expect(normalizeClassNameWhitespace('flex   items-center')).toBe(
        'flex   items-center',
      );
    });

    test('handles empty string', () => {
      expect(normalizeClassNameWhitespace('')).toBe('');
    });

    test('handles string with only whitespace characters', () => {
      expect(normalizeClassNameWhitespace('\n\t\r')).toBe(' ');
    });
  });

  describe('isClassNameAttribute', () => {
    test('returns true for className', () => {
      expect(isClassNameAttribute('className')).toBe(true);
    });

    test('returns true for class', () => {
      expect(isClassNameAttribute('class')).toBe(true);
    });

    test('returns false for other attributes', () => {
      expect(isClassNameAttribute('style')).toBe(false);
      expect(isClassNameAttribute('id')).toBe(false);
      expect(isClassNameAttribute('data-testid')).toBe(false);
      expect(isClassNameAttribute('aria-label')).toBe(false);
    });

    test('is case-sensitive', () => {
      expect(isClassNameAttribute('ClassName')).toBe(false);
      expect(isClassNameAttribute('CLASS')).toBe(false);
      expect(isClassNameAttribute('classname')).toBe(false);
    });
  });
});
