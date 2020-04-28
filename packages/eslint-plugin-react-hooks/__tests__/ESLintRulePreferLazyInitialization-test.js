/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ESLintTester = require('eslint').RuleTester;
const ReactHooksESLintPlugin = require('eslint-plugin-react-hooks');
const ReactHooksESLintRule =
  ReactHooksESLintPlugin.rules['prefer-lazy-initialization'];

function createErrorMessage(hookName) {
  return `${hookName}'s initial value is not created lazily, and will execute every render.`;
}

/**
 * A string template tag that removes padding from the left side of multi-line strings
 * @param {Array} strings array of code strings (only one expected)
 */
function normalizeIndent(strings) {
  const codeLines = strings[0].split('\n');
  const leftPadding = codeLines[1].match(/\s+/)[0];
  return codeLines.map(line => line.substr(leftPadding.length)).join('\n');
}

const tests = {
  valid: [
    /* ---------------------
             useState
       --------------------- */
    // lazy class object instantiation
    {
      code: normalizeIndent`
        useState(() => new Foo());
      `,
    },
    // lazy function call
    {
      code: normalizeIndent`
        useState(() => foo());
      `,
    },

    // option: `classObjectInstantiation` off
    {
      code: normalizeIndent`
        useState(new Foo());
        useState(() => foo());
      `,
      options: [
        {
          classObjectInstantiation: false,
        },
      ],
    },

    // option: `functionCall` off
    {
      code: normalizeIndent`
        useState(() => new Foo());
        useState(foo());
      `,
      options: [
        {
          functionCall: false,
        },
      ],
    },

    // options: `classObjectInstantiation` off and `functionCall` off
    {
      code: normalizeIndent`
        useState(new Foo());
        useState(foo());
      `,
      options: [
        {
          classObjectInstantiation: false,
          functionCall: false,
        },
      ],
    },

    /* ---------------------
             useRef
       --------------------- */
    // function ref
    {
      code: normalizeIndent`
        useRef(() => new Foo());
      `,
    },

    // lazy class object creation
    {
      code: normalizeIndent`
        const foo = useRef(null);
        function getFoo() {
          if (foo.current == null) {
            foo.current = new Foo();
          }
          return foo.current;
        }
      `,
    },

    // lazy function call
    {
      code: normalizeIndent`
        const foo = useRef(null);
        function getFoo() {
          if (foo.current == null) {
            foo.current = bar();
          }
          return foo.current;
        }
      `,
    },

    // lazy class object creation and lazy function call
    {
      code: normalizeIndent`
        const foo = useRef(null);
        const baz = useRef(null);

        function getFoo() {
          if (foo.current == null) {
            foo.current = new Foo();
          }
          return foo.current;
        }

        function getBaz() {
          if (baz.current == null) {
            baz.current = bar();
          }
          return bazfoo.current;
        }
      `,
    },

    // option: `classObjectInstantiation` off
    {
      code: normalizeIndent`
        const foo = useRef(new Foo());
        const baz = useRef(null);
        function getBaz() {
          if (baz.current == null) {
            baz.current = bar();
          }
          return baz;
        }
      `,
      options: [
        {
          classObjectInstantiation: false,
        },
      ],
    },

    // option: `functionCall` off
    {
      code: normalizeIndent`
        const foo = useRef(bar());
        const baz = useRef(null);
        function getBaz() {
          if (baz.current == null) {
            baz.current = new Foo();
          }
          return baz;
        }
      `,
      options: [
        {
          functionCall: false,
        },
      ],
    },

    // options: `classObjectInstantiation` off and `functionCall` off
    {
      code: normalizeIndent`
        useRef(new Foo());
        useRef(foo());
      `,
      options: [
        {
          classObjectInstantiation: false,
          functionCall: false,
        },
      ],
    },

    /* ---------------------
            Custom hooks
       --------------------- */
    // lazy class object instantiation
    {
      code: normalizeIndent`
        useCustomState(() => new Foo());
      `,
      options: [{additionalHooks: 'useCustomState'}],
    },
    // lazy function call
    {
      code: normalizeIndent`
        useCustomState(() => foo());
      `,
      options: [{additionalHooks: 'useCustomState'}],
    },

    // option: `classObjectInstantiation` off
    {
      code: normalizeIndent`
        useCustomState(new Foo());
        useCustomState(() => foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomState',
          classObjectInstantiation: false,
        },
      ],
    },

    // option: `functionCall` off
    {
      code: normalizeIndent`
        useCustomState(() => new Foo());
        useCustomState(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomState',
          functionCall: false,
        },
      ],
    },

    // options: `classObjectInstantiation` off and `functionCall` off
    {
      code: normalizeIndent`
        useCustomState(new Foo());
        useCustomState(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomState',
          classObjectInstantiation: false,
          functionCall: false,
        },
      ],
    },

    // allowing another hook to be called within a hook
    {
      code: normalizeIndent`
        useCustomState(useState(0));
      `,
      options: [
        {
          additionalHooks: 'useCustomState',
        },
      ],
    },

    {
      code: normalizeIndent`
        useRef(useState(()=>new Foo()));
      `,
      options: [
        {
          additionalHooks: 'useCustomState',
        },
      ],
    },

    // with React namespace

    {
      code: normalizeIndent`
        React.useCustomState(useState(0));
      `,
      options: [
        {
          additionalHooks: 'useCustomState',
        },
      ],
    },

    {
      code: normalizeIndent`
        React.useState(()=>new Foo());
      `,
    },

    {
      code: normalizeIndent`
        const foo = React.useRef(null);
        function getFoo() {
          if (foo.current == null) {
            foo.current = new Foo();
          }
          return foo;
        }
      `,
    },

    {
      code: normalizeIndent`
        useState(useFoo(useBar(useBaz(3))));
      `,
    },
  ],
  invalid: [
    /* ---------------------
             useState
       --------------------- */
    {
      code: normalizeIndent`
        useState(new Foo());
      `,
      errors: [
        {
          message: createErrorMessage('useState'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useState(foo());
      `,
      errors: [
        {
          message: createErrorMessage('useState'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useState(new Foo());
        useState(foo());
      `,
      errors: [
        {
          message: createErrorMessage('useState'),
        },
        {
          message: createErrorMessage('useState'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useState(new Foo());
        useState(foo());
      `,
      options: [
        {
          classObjectInstantiation: false,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useState'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useState(new Foo());
        useState(foo());
      `,
      options: [
        {
          functionCall: false,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useState'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useState(foo());
      `,
      options: [
        {
          functionCall: true,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useState'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useState(new Foo());
      `,
      options: [
        {
          classObjectInstantiation: true,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useState'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useState(new Foo());
        useState(foo());
      `,
      options: [
        {
          classObjectInstantiation: true,
          functionCall: true,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useState'),
        },
        {
          message: createErrorMessage('useState'),
        },
      ],
    },

    /* ---------------------
              useRef
       --------------------- */
    {
      code: normalizeIndent`
        useRef(new Foo());
      `,
      errors: [
        {
          message: createErrorMessage('useRef'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useRef(foo());
      `,
      errors: [
        {
          message: createErrorMessage('useRef'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useRef(new Foo());
        useRef(foo());
      `,
      errors: [
        {
          message: createErrorMessage('useRef'),
        },
        {
          message: createErrorMessage('useRef'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useRef(new Foo());
        useRef(foo());
      `,
      options: [
        {
          classObjectInstantiation: false,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useRef'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useRef(new Foo());
        useRef(foo());
      `,
      options: [
        {
          functionCall: false,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useRef'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useRef(foo());
      `,
      options: [],
      errors: [
        {
          message: createErrorMessage('useRef'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useRef(new Foo());
      `,
      options: [
        {
          classObjectInstantiation: true,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useRef'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useRef(new Foo());
        useRef(foo());
      `,
      options: [
        {
          classObjectInstantiation: true,
          functionCall: true,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useRef'),
        },
        {
          message: createErrorMessage('useRef'),
        },
      ],
    },

    /* ---------------------
            Custom hooks
       --------------------- */
    {
      code: normalizeIndent`
        useCustomHook(new Foo());
      `,
      options: [{additionalHooks: 'useCustomHook'}],
      errors: [
        {
          message: createErrorMessage('useCustomHook'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useCustomHook(foo());
      `,
      options: [{additionalHooks: 'useCustomHook'}],
      errors: [
        {
          message: createErrorMessage('useCustomHook'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useCustomHook(new Foo());
        useCustomHook(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomHook',
        },
      ],
      errors: [
        {
          message: createErrorMessage('useCustomHook'),
        },
        {
          message: createErrorMessage('useCustomHook'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useCustomHook(new Foo());
        useCustomHook(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomHook',
          classObjectInstantiation: false,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useCustomHook'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useCustomHook(new Foo());
        useCustomHook(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomHook',
          functionCall: false,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useCustomHook'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useCustomHook(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomHook',
          functionCall: true,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useCustomHook'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useCustomHook(new Foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomHook',
          classObjectInstantiation: true,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useCustomHook'),
        },
      ],
    },
    {
      code: normalizeIndent`
        useCustomHook(new Foo());
        useCustomHook(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomHook',
          classObjectInstantiation: true,
          functionCall: true,
        },
      ],
      errors: [
        {
          message: createErrorMessage('useCustomHook'),
        },
        {
          message: createErrorMessage('useCustomHook'),
        },
      ],
    },

    /* ---------------------
            Stress testing
       --------------------- */
    {
      code: normalizeIndent`
        useState(foo());
        useCustomHook(new Foo());
        useCustomState(new Foo());
        useRef(bar());
        useCustomHook(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomHook',
        },
      ],
      errors: [
        {message: createErrorMessage('useState')},
        {message: createErrorMessage('useCustomHook')},
        // not useCustomState since it is not included in regex
        {message: createErrorMessage('useRef')},
        {message: createErrorMessage('useCustomHook')},
      ],
    },

    {
      code: normalizeIndent`
        useState(foo());
        useCustomHook(new Foo());
        useCustomState(new Foo());
        useRef(bar());
        useCustomHook(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustomHook|useCustomState',
        },
      ],
      errors: [
        {message: createErrorMessage('useState')},
        {message: createErrorMessage('useCustomHook')},
        {message: createErrorMessage('useCustomState')},
        {message: createErrorMessage('useRef')},
        {message: createErrorMessage('useCustomHook')},
      ],
    },

    {
      code: normalizeIndent`
        useCustomHook(new Foo());
        useCustomState(new Foo());
        useRef(bar());
        useCustomHook(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustom(Hook|State)',
          functionCall: false,
        },
      ],
      errors: [
        {message: createErrorMessage('useCustomHook')},
        {message: createErrorMessage('useCustomState')},
      ],
    },

    {
      code: normalizeIndent`
        useCustomHook(new Foo());
        useCustomState(new Foo());
        useRef(bar());
        useCustomHook(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustom(Hook|State)',
          classObjectInstantiation: false,
        },
      ],
      errors: [
        {message: createErrorMessage('useRef')},
        {message: createErrorMessage('useCustomHook')},
      ],
    },

    // with React namespace
    {
      code: normalizeIndent`
        React.useCustomHook(new Foo());
        useCustomState(new Foo());
        React.useRef(bar());
        useCustomHook(foo());
      `,
      options: [
        {
          additionalHooks: 'useCustom(Hook|State)',
          classObjectInstantiation: false,
        },
      ],
      errors: [
        {message: createErrorMessage('useRef')},
        {message: createErrorMessage('useCustomHook')},
      ],
    },

    // nested hooks
    {
      code: normalizeIndent`
        useRef(useState(new Foo()));
      `,
      errors: [{message: createErrorMessage('useState')}],
    },

    // nested hooks
    {
      code: normalizeIndent`
        useCustomHook(useCustomState(new Foo()) + useState(new Bar()));
      `,
      options: [
        {
          additionalHooks: 'useCustom(Hook|State)',
        },
      ],
      errors: [
        {message: createErrorMessage('useCustomState')},
        {message: createErrorMessage('useState')},
      ],
    },
  ],
};

const parserOptions = {
  ecmaVersion: 6,
  sourceType: 'module',
};

new ESLintTester({
  parser: require.resolve('babel-eslint'),
  parserOptions,
}).run('react-hooks', ReactHooksESLintRule, tests);
