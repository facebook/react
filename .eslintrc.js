'use strict';

const {
  es5Paths,
  esNextPaths,
} = require('./scripts/shared/pathsByLanguageVersion');

const restrictedGlobals = require('confusing-browser-globals');

const OFF = 0;
const ERROR = 2;

module.exports = {
  extends: ['fbjs', 'prettier'],

  // Stop ESLint from looking for a configuration file in parent folders
  root: true,

  plugins: [
    'jest',
    'no-for-of-loops',
    'no-function-declare-after-return',
    'react',
    'react-internal',
  ],

  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 9,
    sourceType: 'script',
  },

  // We're stricter than the default config, mostly. We'll override a few rules
  // and then enable some React specific ones.
  rules: {
    'accessor-pairs': OFF,
    'brace-style': [ERROR, '1tbs'],
    'consistent-return': OFF,
    'dot-location': [ERROR, 'property'],
    // We use console['error']() as a signal to not transform it:
    'dot-notation': [ERROR, {allowPattern: '^(error|warn)$'}],
    'eol-last': ERROR,
    eqeqeq: [ERROR, 'allow-null'],
    indent: OFF,
    'jsx-quotes': [ERROR, 'prefer-double'],
    'keyword-spacing': [ERROR, {after: true, before: true}],
    'no-bitwise': OFF,
    'no-console': OFF,
    'no-inner-declarations': [ERROR, 'functions'],
    'no-multi-spaces': ERROR,
    'no-restricted-globals': [ERROR].concat(restrictedGlobals),
    'no-restricted-syntax': [ERROR, 'WithStatement'],
    'no-shadow': ERROR,
    'no-unused-expressions': ERROR,
    'no-unused-vars': [ERROR, {args: 'none'}],
    'no-use-before-define': OFF,
    'no-useless-concat': OFF,
    quotes: [ERROR, 'single', {avoidEscape: true, allowTemplateLiterals: true}],
    'space-before-blocks': ERROR,
    'space-before-function-paren': OFF,
    'valid-typeof': [ERROR, {requireStringLiterals: true}],
    // Flow fails with with non-string literal keys
    'no-useless-computed-key': OFF,

    // We apply these settings to files that should run on Node.
    // They can't use JSX or ES6 modules, and must be in strict mode.
    // They can, however, use other ES6 features.
    // (Note these rules are overridden later for source files.)
    'no-var': ERROR,
    strict: ERROR,

    // Enforced by Prettier
    // TODO: Prettier doesn't handle long strings or long comments. Not a big
    // deal. But I turned it off because loading the plugin causes some obscure
    // syntax error and it didn't seem worth investigating.
    'max-len': OFF,
    // Prettier forces semicolons in a few places
    'flowtype/object-type-delimiter': OFF,

    // React & JSX
    // Our transforms set this automatically
    'react/jsx-boolean-value': [ERROR, 'always'],
    'react/jsx-no-undef': ERROR,
    // We don't care to do this
    'react/jsx-sort-prop-types': OFF,
    'react/jsx-space-before-closing': ERROR,
    'react/jsx-uses-react': ERROR,
    'react/no-is-mounted': OFF,
    // This isn't useful in our test code
    'react/react-in-jsx-scope': ERROR,
    'react/self-closing-comp': ERROR,
    // We don't care to do this
    'react/jsx-wrap-multilines': [
      ERROR,
      {declaration: false, assignment: false},
    ],

    // Prevent for...of loops because they require a Symbol polyfill.
    // You can disable this rule for code that isn't shipped (e.g. build scripts and tests).
    'no-for-of-loops/no-for-of-loops': ERROR,

    // Prevent function declarations after return statements
    'no-function-declare-after-return/no-function-declare-after-return': ERROR,

    // CUSTOM RULES
    // the second argument of warning/invariant should be a literal string
    'react-internal/no-primitive-constructors': ERROR,
    'react-internal/safe-string-coercion': [
      ERROR,
      {isProductionUserAppCode: true},
    ],
    'react-internal/no-to-warn-dev-within-to-throw': ERROR,
    'react-internal/warning-args': ERROR,
    'react-internal/no-production-logging': ERROR,
    'react-internal/no-cross-fork-imports': ERROR,
    'react-internal/no-cross-fork-types': [
      ERROR,
      {
        old: [],
        new: [],
      },
    ],
  },

  overrides: [
    {
      // By default, anything error message that appears the packages directory
      // must have a corresponding error code. The exceptions are defined
      // in the next override entry.
      files: ['packages/**/*.js'],
      rules: {
        'react-internal/prod-error-codes': ERROR,
      },
    },
    {
      // These are files where it's OK to have unminified error messages. These
      // are environments where bundle size isn't a concern, like tests
      // or Node.
      files: [
        'packages/react-dom/src/test-utils/**/*.js',
        'packages/react-devtools-shared/**/*.js',
        'packages/react-noop-renderer/**/*.js',
        'packages/react-pg/**/*.js',
        'packages/react-fs/**/*.js',
        'packages/react-refresh/**/*.js',
        'packages/react-server-dom-webpack/**/*.js',
        'packages/react-test-renderer/**/*.js',
        'packages/react-debug-tools/**/*.js',
        'packages/react-devtools-extensions/**/*.js',
        'packages/react-devtools-timeline/**/*.js',
        'packages/react-native-renderer/**/*.js',
        'packages/eslint-plugin-react-hooks/**/*.js',
        'packages/jest-react/**/*.js',
        'packages/**/__tests__/*.js',
        'packages/**/npm/*.js',
      ],
      rules: {
        'react-internal/prod-error-codes': OFF,
      },
    },
    {
      // We apply these settings to files that we ship through npm.
      // They must be ES5.
      files: es5Paths,
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 5,
        sourceType: 'script',
      },
      rules: {
        'no-var': OFF,
        strict: ERROR,
      },
    },
    {
      // We apply these settings to the source files that get compiled.
      // They can use all features including JSX (but shouldn't use `var`).
      files: esNextPaths,
      parser: 'babel-eslint',
      parserOptions: {
        ecmaVersion: 8,
        sourceType: 'module',
      },
      rules: {
        'no-var': ERROR,
        'prefer-const': ERROR,
        strict: OFF,
      },
    },
    {
      files: ['**/__tests__/*.js'],
      rules: {
        // https://github.com/jest-community/eslint-plugin-jest
        'jest/no-focused-tests': ERROR,
        'jest/valid-expect': ERROR,
        'jest/valid-expect-in-promise': ERROR,
      },
    },
    {
      files: [
        '**/__tests__/**/*.js',
        'scripts/**/*.js',
        'packages/*/npm/**/*.js',
        'packages/dom-event-testing-library/**/*.js',
        'packages/react-devtools*/**/*.js',
        'dangerfile.js',
        'fixtures',
        'packages/react-dom/src/test-utils/*.js',
      ],
      rules: {
        'react-internal/no-production-logging': OFF,
        'react-internal/warning-args': OFF,
        'react-internal/safe-string-coercion': [
          ERROR,
          {isProductionUserAppCode: false},
        ],

        // Disable accessibility checks
        'jsx-a11y/aria-role': OFF,
        'jsx-a11y/no-noninteractive-element-interactions': OFF,
        'jsx-a11y/no-static-element-interactions': OFF,
        'jsx-a11y/role-has-required-aria-props': OFF,
        'jsx-a11y/no-noninteractive-tabindex': OFF,
        'jsx-a11y/tabindex-no-positive': OFF,
      },
    },
    {
      files: [
        'scripts/eslint-rules/*.js',
        'packages/eslint-plugin-react-hooks/src/*.js',
      ],
      plugins: ['eslint-plugin'],
      rules: {
        'eslint-plugin/prefer-object-rule': ERROR,
        'eslint-plugin/require-meta-fixable': [
          ERROR,
          {catchNoFixerButFixableProperty: true},
        ],
        'eslint-plugin/require-meta-has-suggestions': ERROR,
      },
    },
    {
      files: [
        'packages/react-native-renderer/**/*.js',
        'packages/react-server-native-relay/**/*.js',
      ],
      globals: {
        nativeFabricUIManager: 'readonly',
      },
    },
    {
      files: ['packages/react-server-dom-webpack/**/*.js'],
      globals: {
        __webpack_chunk_load__: 'readonly',
        __webpack_require__: 'readonly',
      },
    },
    {
      files: ['packages/scheduler/**/*.js'],
      globals: {
        TaskController: 'readonly',
      },
    },
  ],

  globals: {
    spyOnDev: 'readonly',
    spyOnDevAndProd: 'readonly',
    spyOnProd: 'readonly',
    __EXPERIMENTAL__: 'readonly',
    __EXTENSION__: 'readonly',
    __PROFILE__: 'readonly',
    __TEST__: 'readonly',
    __UMD__: 'readonly',
    __VARIANT__: 'readonly',
    gate: 'readonly',
    trustedTypes: 'readonly',
    IS_REACT_ACT_ENVIRONMENT: 'readonly',
  },
};
