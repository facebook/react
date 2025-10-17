import {RuleTester as ESLintTester, Rule} from 'eslint';
import escape from 'regexp.escape';

/**
 * A string template tag that removes padding from the left side of multi-line strings
 * @param {Array} strings array of code strings (only one expected)
 */
export function normalizeIndent(strings: TemplateStringsArray): string {
  const codeLines = strings[0].split('\n');
  const leftPadding = codeLines[1].match(/\s+/)![0];
  return codeLines.map(line => line.slice(leftPadding.length)).join('\n');
}

export type CompilerTestCases = {
  valid: ESLintTester.ValidTestCase[];
  invalid: ESLintTester.InvalidTestCase[];
};

export function makeTestCaseError(reason: string): ESLintTester.TestCaseError {
  return {
    message: new RegExp(escape(reason)),
  };
}

export function testRule(
  name: string,
  rule: Rule.RuleModule,
  tests: {
    valid: ESLintTester.ValidTestCase[];
    invalid: ESLintTester.InvalidTestCase[];
  },
): void {
  const eslintTester = new ESLintTester({
    // @ts-ignore[2353] - outdated types
    parser: require.resolve('hermes-eslint'),
    parserOptions: {
      ecmaVersion: 2015,
      sourceType: 'module',
      enableExperimentalComponentSyntax: true,
    },
  });

  eslintTester.run(name, rule, tests);
}

test('no test', () => {});
