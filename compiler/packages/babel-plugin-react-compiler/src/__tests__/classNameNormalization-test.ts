/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Tests for className whitespace normalization in the React Compiler.
 *
 * This addresses GitHub issue #35481 where multiline className strings
 * cause hydration mismatches between server and client rendering.
 *
 * @see https://github.com/facebook/react/issues/35481
 */

import {runBabelPluginReactCompiler} from '../Babel/RunReactCompilerBabelPlugin';

describe('className whitespace normalization', () => {
  function compile(code: string): string {
    const result = runBabelPluginReactCompiler(code, 'test.js', 'flow', {
      panicThreshold: 'all_errors',
    });
    return result.code ?? '';
  }

  describe('compiler normalizes className whitespace', () => {
    test('normalizes newlines in multiline className to spaces', () => {
      // Using actual newlines in the className string (the real issue from #35481)
      const input = `function Component() {
        return <div className="flex
items-center" />;
      }`;
      const output = compile(input);
      // After normalization, newlines should become spaces
      expect(output).toContain('className="flex items-center"');
    });

    test('normalizes tabs in className to spaces', () => {
      // Using actual tab character
      const input = `function Component() {
        return <div className="flex	items-center" />;
      }`;
      const output = compile(input);
      expect(output).toContain('className="flex items-center"');
    });

    test('normalizes class attribute for SVG compatibility', () => {
      // Using actual newline in class attribute
      const input = `function Component() {
        return <svg class="w-6
h-6" />;
      }`;
      const output = compile(input);
      expect(output).toContain('class="w-6 h-6"');
    });

    test('preserves spaces in className', () => {
      const input = `function Component() {
        return <div className="flex items-center" />;
      }`;
      const output = compile(input);
      expect(output).toContain('className="flex items-center"');
    });

    test('does not normalize other attributes with newlines', () => {
      // Other attributes should NOT be normalized
      const input = `function Component() {
        return <div data-testid="multi
line" />;
      }`;
      const output = compile(input);
      // The newline should still be present (not normalized)
      expect(output).toMatch(/data-testid[^>]*\\n|data-testid[^>]*\n/);
    });

    test('handles multiline className from issue #35481', () => {
      // This is the exact pattern from the GitHub issue that causes hydration mismatches
      const input = `function Component() {
        return (
          <div
            className="
              flex min-h-screen items-center justify-center
              dark:bg-black
            "
          />
        );
      }`;
      const output = compile(input);
      // The output className should NOT contain newlines
      expect(output).not.toMatch(/className="[^"]*\n[^"]*"/);
      // It should contain the normalized class names
      expect(output).toContain('flex min-h-screen');
    });
  });
});
