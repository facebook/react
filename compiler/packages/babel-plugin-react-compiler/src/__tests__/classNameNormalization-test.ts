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
    return runBabelPluginReactCompiler(code, 'test.js', 'flow', {
      panicThreshold: 'all_errors',
    }).code;
  }

  describe('compiler normalizes className whitespace', () => {
    test('normalizes newlines in className to spaces', () => {
      const input = `function Component() {
        return <div className="flex\\nitems-center" />;
      }`;
      const output = compile(input);
      expect(output).toContain('className="flex items-center"');
      expect(output).not.toContain('\\n');
    });

    test('normalizes tabs in className to spaces', () => {
      const input = `function Component() {
        return <div className="flex\\titems-center" />;
      }`;
      const output = compile(input);
      expect(output).toContain('className="flex items-center"');
      expect(output).not.toContain('\\t');
    });

    test('normalizes multiple newlines to single space', () => {
      const input = `function Component() {
        return <div className="flex\\n\\n\\nitems-center" />;
      }`;
      const output = compile(input);
      expect(output).toContain('className="flex items-center"');
    });

    test('normalizes CRLF to space', () => {
      const input = `function Component() {
        return <div className="flex\\r\\nitems-center" />;
      }`;
      const output = compile(input);
      expect(output).toContain('className="flex items-center"');
    });

    test('normalizes class attribute (SVG compatibility)', () => {
      const input = `function Component() {
        return <svg class="w-6\\nh-6" />;
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
      const input = `function Component() {
        return <div data-testid="multi\\nline" />;
      }`;
      const output = compile(input);
      // Other attributes should preserve newlines
      expect(output).toContain('\\n');
    });

    test('handles multiline className from issue #35481', () => {
      // This is the exact pattern that causes hydration mismatches
      const input = `function Component() {
        return (
          <div
            className="
              flex min-h-screen
            "
          />
        );
      }`;
      const output = compile(input);
      // The output should have normalized whitespace (newlines become spaces)
      expect(output).not.toMatch(/className="[^"]*\\n[^"]*"/);
    });
  });
});
