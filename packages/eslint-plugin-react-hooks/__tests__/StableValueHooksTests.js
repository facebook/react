/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

'use strict';

const ESLintTesterV7 = require('eslint-v7').RuleTester;
const ESLintTesterV9 = require('eslint-v9').RuleTester;
const ReactHooksESLintPlugin = require('eslint-plugin-react-hooks');
const VerifyStableValueHooksRule =
  ReactHooksESLintPlugin.rules['verify-stable-value-hooks'];

/**
 * A string template tag that removes padding from the left side of multi-line strings
 * @param {Array} strings array of code strings (only one expected)
 */
function normalizeIndent(strings) {
  const codeLines = strings[0].split('\n');
  const leftPadding = codeLines[1].match(/\s+/)[0];
  return codeLines.map(line => line.slice(leftPadding.length)).join('\n');
}

// Tests that are valid/invalid across all parsers
const tests = {
  valid: [
    // Test case for a hook that returns a stable value (entire value is stable)
    {
      code: normalizeIndent`
        function useStableValue() {
          return 'stable value';
        }
      `,
      options: [
        {
          stableValueHooks: [
            {name: 'useStableValue', propertiesOrIndexes: null},
          ],
        },
      ],
    },
    // Test case for a hook that returns a stable value (entire value is stable) - arrow function
    {
      code: normalizeIndent`
        const useStableValue = () => {
          return 'stable value';
        };
      `,
      options: [
        {
          stableValueHooks: [
            {name: 'useStableValue', propertiesOrIndexes: null},
          ],
        },
      ],
    },
    // Test case for a hook that returns a stable value (entire value is stable) - implicit return
    {
      code: normalizeIndent`
        const useStableValue = () => 'stable value';
      `,
      options: [
        {
          stableValueHooks: [
            {name: 'useStableValue', propertiesOrIndexes: null},
          ],
        },
      ],
    },
    // Test case for a hook that returns an array with stable indexes
    {
      code: normalizeIndent`
        function useArrayWithStableItems() {
          return ['stable', Math.random()];
        }
      `,
      options: [
        {
          stableValueHooks: [
            {name: 'useArrayWithStableItems', propertiesOrIndexes: [0]},
          ],
        },
      ],
    },
    // Test case for a hook that returns an array with stable indexes - arrow function
    {
      code: normalizeIndent`
        const useArrayWithStableItems = () => {
          return ['stable', Math.random()];
        };
      `,
      options: [
        {
          stableValueHooks: [
            {name: 'useArrayWithStableItems', propertiesOrIndexes: [0]},
          ],
        },
      ],
    },
    // Test case for a hook that returns an array with stable indexes - implicit return
    {
      code: normalizeIndent`
        const useArrayWithStableItems = () => ['stable', Math.random()];
      `,
      options: [
        {
          stableValueHooks: [
            {name: 'useArrayWithStableItems', propertiesOrIndexes: [0]},
          ],
        },
      ],
    },
    // Test case for a hook that returns an object with stable properties
    {
      code: normalizeIndent`
        function useObjectWithStableProps() {
          return { stableProp: 'stable', unstableProp: Math.random() };
        }
      `,
      options: [
        {
          stableValueHooks: [
            {
              name: 'useObjectWithStableProps',
              propertiesOrIndexes: ['stableProp'],
            },
          ],
        },
      ],
    },
    // Test case for a hook that returns an object with stable properties - arrow function
    {
      code: normalizeIndent`
        const useObjectWithStableProps = () => {
          return { stableProp: 'stable', unstableProp: Math.random() };
        };
      `,
      options: [
        {
          stableValueHooks: [
            {
              name: 'useObjectWithStableProps',
              propertiesOrIndexes: ['stableProp'],
            },
          ],
        },
      ],
    },
    // Test case for a hook that returns an object with stable properties - implicit return
    {
      code: normalizeIndent`
        const useObjectWithStableProps = () => ({ stableProp: 'stable', unstableProp: Math.random() });
      `,
      options: [
        {
          stableValueHooks: [
            {
              name: 'useObjectWithStableProps',
              propertiesOrIndexes: ['stableProp'],
            },
          ],
        },
      ],
    },
    // Test case for a hook that returns an object with multiple stable properties
    {
      code: normalizeIndent`
        function useObjectWithMultipleStableProps() {
          return { 
            stableProp1: 'stable1', 
            stableProp2: 'stable2', 
            unstableProp: Math.random() 
          };
        }
      `,
      options: [
        {
          stableValueHooks: [
            {
              name: 'useObjectWithMultipleStableProps',
              propertiesOrIndexes: ['stableProp1', 'stableProp2'],
            },
          ],
        },
      ],
    },
    // Test case for a hook that returns an array with multiple stable indexes
    {
      code: normalizeIndent`
        function useArrayWithMultipleStableItems() {
          return ['stable1', Math.random(), 'stable2'];
        }
      `,
      options: [
        {
          stableValueHooks: [
            {
              name: 'useArrayWithMultipleStableItems',
              propertiesOrIndexes: [0, 2],
            },
          ],
        },
      ],
    },
  ],
  invalid: [
    // Test case for a hook that should return a stable value but doesn't have a return statement
    {
      code: normalizeIndent`
        function useStableValue() {
          // Missing return statement
        }
      `,
      options: [
        {
          stableValueHooks: [
            {name: 'useStableValue', propertiesOrIndexes: null},
          ],
        },
      ],
      errors: [
        {
          message:
            "Hook 'useStableValue' is configured as a stable value hook but doesn't have a return statement.",
        },
      ],
    },
    // Test case for a hook that should return an array with stable indexes but the array is too small
    {
      code: normalizeIndent`
        function useArrayWithStableItems() {
          return ['stable']; // Missing second element
        }
      `,
      options: [
        {
          stableValueHooks: [
            {name: 'useArrayWithStableItems', propertiesOrIndexes: [0, 1]},
          ],
        },
      ],
      errors: [
        {
          message:
            "Hook 'useArrayWithStableItems' is configured with stable indexes [0, 1], but the returned array only has 1 elements.",
        },
      ],
    },
    // Test case for a hook that should return an object with stable properties but is missing properties
    {
      code: normalizeIndent`
        function useObjectWithStableProps() {
          return { unstableProp: Math.random() }; // Missing stableProp
        }
      `,
      options: [
        {
          stableValueHooks: [
            {
              name: 'useObjectWithStableProps',
              propertiesOrIndexes: ['stableProp'],
            },
          ],
        },
      ],
      errors: [
        {
          message:
            "Hook 'useObjectWithStableProps' is configured with stable properties [stableProp], but the returned object is missing: stableProp.",
        },
      ],
    },
    // Test case for a hook that should return an object but returns something else
    {
      code: normalizeIndent`
        function useObjectWithStableProps() {
          return 'not an object'; // Not an object
        }
      `,
      options: [
        {
          stableValueHooks: [
            {
              name: 'useObjectWithStableProps',
              propertiesOrIndexes: ['stableProp'],
            },
          ],
        },
      ],
      errors: [
        {
          message:
            "Hook 'useObjectWithStableProps' is configured with stable properties/indexes [stableProp], but doesn't return an array or object.",
        },
      ],
    },
    // Test case for a hook that should return an array but returns something else
    {
      code: normalizeIndent`
        function useArrayWithStableItems() {
          return 'not an array'; // Not an array
        }
      `,
      options: [
        {
          stableValueHooks: [
            {name: 'useArrayWithStableItems', propertiesOrIndexes: [0]},
          ],
        },
      ],
      errors: [
        {
          message:
            "Hook 'useArrayWithStableItems' is configured with stable properties/indexes [0], but doesn't return an array or object.",
        },
      ],
    },
    // Test case for a hook that should return an object with multiple stable properties but is missing some
    {
      code: normalizeIndent`
        function useObjectWithMultipleStableProps() {
          return { 
            stableProp1: 'stable1', 
            unstableProp: Math.random() 
          }; // Missing stableProp2
        }
      `,
      options: [
        {
          stableValueHooks: [
            {
              name: 'useObjectWithMultipleStableProps',
              propertiesOrIndexes: ['stableProp1', 'stableProp2'],
            },
          ],
        },
      ],
      errors: [
        {
          message:
            "Hook 'useObjectWithMultipleStableProps' is configured with stable properties [stableProp1, stableProp2], but the returned object is missing: stableProp2.",
        },
      ],
    },
    // Test case for an arrow function hook that should return a stable value but doesn't have a return statement
    {
      code: normalizeIndent`
        const useStableValue = () => {
          // Missing return statement
        };
      `,
      options: [
        {
          stableValueHooks: [
            {name: 'useStableValue', propertiesOrIndexes: null},
          ],
        },
      ],
      errors: [
        {
          message:
            "Hook 'useStableValue' is configured as a stable value hook but doesn't have a return statement.",
        },
      ],
    },
  ],
};

// For easier local testing
if (!process.env.CI) {
  let only = [];
  let skipped = [];
  [...tests.valid, ...tests.invalid].forEach(t => {
    if (t.skip) {
      delete t.skip;
      skipped.push(t);
    }
    if (t.only) {
      delete t.only;
      only.push(t);
    }
  });
  const predicate = t => {
    if (only.length > 0) {
      return only.indexOf(t) !== -1;
    }
    if (skipped.length > 0) {
      return skipped.indexOf(t) === -1;
    }
    return true;
  };
  tests.valid = tests.valid.filter(predicate);
  tests.invalid = tests.invalid.filter(predicate);
}

describe('verify-stable-value-hooks', () => {
  const parserOptionsV7 = {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 6,
    sourceType: 'module',
  };

  const languageOptionsV9 = {
    ecmaVersion: 6,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  };

  new ESLintTesterV7({
    parser: require.resolve('babel-eslint'),
    parserOptions: parserOptionsV7,
  }).run('eslint: v7, parser: babel-eslint', VerifyStableValueHooksRule, tests);

  new ESLintTesterV9({
    languageOptions: {
      ...languageOptionsV9,
      parser: require('@babel/eslint-parser'),
    },
  }).run(
    'eslint: v9, parser: @babel/eslint-parser',
    VerifyStableValueHooksRule,
    tests
  );

  new ESLintTesterV7({
    parser: require.resolve('hermes-eslint'),
    parserOptions: {
      sourceType: 'module',
      enableExperimentalComponentSyntax: true,
    },
  }).run(
    'eslint: v7, parser: hermes-eslint',
    VerifyStableValueHooksRule,
    tests
  );

  new ESLintTesterV9({
    languageOptions: {
      ...languageOptionsV9,
      parser: require('hermes-eslint'),
      parserOptions: {
        sourceType: 'module',
        enableExperimentalComponentSyntax: true,
      },
    },
  }).run(
    'eslint: v9, parser: hermes-eslint',
    VerifyStableValueHooksRule,
    tests
  );

  new ESLintTesterV7({
    parser: require.resolve('@typescript-eslint/parser-v2'),
    parserOptions: parserOptionsV7,
  }).run(
    'eslint: v7, parser: @typescript-eslint/parser@2.x',
    VerifyStableValueHooksRule,
    tests
  );

  new ESLintTesterV9({
    languageOptions: {
      ...languageOptionsV9,
      parser: require('@typescript-eslint/parser-v2'),
    },
  }).run(
    'eslint: v9, parser: @typescript-eslint/parser@2.x',
    VerifyStableValueHooksRule,
    tests
  );

  new ESLintTesterV7({
    parser: require.resolve('@typescript-eslint/parser-v3'),
    parserOptions: parserOptionsV7,
  }).run(
    'eslint: v7, parser: @typescript-eslint/parser@3.x',
    VerifyStableValueHooksRule,
    tests
  );

  new ESLintTesterV9({
    languageOptions: {
      ...languageOptionsV9,
      parser: require('@typescript-eslint/parser-v3'),
    },
  }).run(
    'eslint: v9, parser: @typescript-eslint/parser@3.x',
    VerifyStableValueHooksRule,
    tests
  );

  new ESLintTesterV7({
    parser: require.resolve('@typescript-eslint/parser-v4'),
    parserOptions: parserOptionsV7,
  }).run(
    'eslint: v7, parser: @typescript-eslint/parser@4.x',
    VerifyStableValueHooksRule,
    tests
  );

  new ESLintTesterV9({
    languageOptions: {
      ...languageOptionsV9,
      parser: require('@typescript-eslint/parser-v4'),
    },
  }).run(
    'eslint: v9, parser: @typescript-eslint/parser@4.x',
    VerifyStableValueHooksRule,
    tests
  );

  new ESLintTesterV7({
    parser: require.resolve('@typescript-eslint/parser-v5'),
    parserOptions: parserOptionsV7,
  }).run(
    'eslint: v7, parser: @typescript-eslint/parser@^5.0.0-0',
    VerifyStableValueHooksRule,
    tests
  );

  new ESLintTesterV9({
    languageOptions: {
      ...languageOptionsV9,
      parser: require('@typescript-eslint/parser-v5'),
    },
  }).run(
    'eslint: v9, parser: @typescript-eslint/parser@^5.0.0',
    VerifyStableValueHooksRule,
    tests
  );
});
