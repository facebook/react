import {RuleTester as ESLintTester, Rule} from 'eslint';
import {
  ErrorCode,
  ErrorCodeDetails,
} from 'babel-plugin-react-compiler/src/Utils/ErrorCodes';
import escape from 'regexp.escape';
import {configs} from '../src/index';

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

export const invalidHookRuleErrorMessage: ESLintTester.TestCaseError = {
  message: new RegExp(
    escape(ErrorCodeDetails[ErrorCode.HOOK_CALL_STATIC].reason),
  ),
};

export const invalidCapitalizedCallsRuleErrorMessage: ESLintTester.TestCaseError =
  {
    message: new RegExp(
      escape(ErrorCodeDetails[ErrorCode.CAPITALIZED_CALLS].reason),
    ),
  };

export const invalidStaticComponentsRuleErrorMessage: ESLintTester.TestCaseError =
  {
    message: new RegExp(
      escape(ErrorCodeDetails[ErrorCode.STATIC_COMPONENTS].reason),
    ),
  };

export function makeTestCaseError(code: ErrorCode): ESLintTester.TestCaseError {
  return {
    message: new RegExp(escape(ErrorCodeDetails[code].reason)),
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

/**
 * Aggregates all recommended rules from the plugin.
 */
export const TestRecommendedRules: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow capitalized function calls',
      category: 'Possible Errors',
      recommended: true,
    },
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create(context) {
    for (const rule of Object.values(
      configs.recommended.plugins['react-compiler'].rules,
    )) {
      const listener = rule.create(context);
      if (Object.entries(listener).length !== 0) {
        throw new Error('TODO: handle rules that return listeners to eslint');
      }
    }
    return {};
  },
};

test('no test', () => {});
