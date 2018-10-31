/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ESLintTester = require('eslint').RuleTester;
const ReactHooksESLintPlugin = require('eslint-plugin-react-hooks');
const ReactHooksESLintRule = ReactHooksESLintPlugin.rules['rules-of-hooks'];

ESLintTester.setDefaultConfig({
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

const eslintTester = new ESLintTester();
eslintTester.run('react-hooks', ReactHooksESLintRule, {
  valid: [
    `
      // Valid because components can use hooks.
      function ComponentWithHook() {
        useHook();
      }
    `,
    `
      // Valid because components can use hooks.
      function createComponentWithHook() {
        return function ComponentWithHook() {
          useHook();
        };
      }
    `,
    `
      // Valid because hooks can use hooks.
      function useHookWithHook() {
        useHook();
      }
    `,
    `
      // Valid because hooks can use hooks.
      function createHook() {
        return function useHookWithHook() {
          useHook();
        }
      }
    `,
    `
      // Valid because components can call functions.
      function ComponentWithNormalFunction() {
        doSomething();
      }
    `,
    `
      // Valid because functions can call functions.
      function normalFunctionWithNormalFunction() {
        doSomething();
      }
    `,
    `
      // Valid because functions can call functions.
      function normalFunctionWithConditionalFunction() {
        if (cond) {
          doSomething();
        }
      }
    `,
    `
      // Valid because functions can call functions.
      function functionThatStartsWithUseButIsntAHook() {
        if (cond) {
          userFetch();
        }
      }
    `,
    `
      // Valid although unconditional return doesn't make sense and would fail other rules.
      // We could make it invalid but it doesn't matter.
      function useUnreachable() {
        return;
        useHook();
      }
    `,
    `
      // Valid because hooks can call hooks.
      function useHook() { useState(); }
      const whatever = function useHook() { useState(); };
      const useHook1 = () => { useState(); };
      let useHook2 = () => useState();
      useHook2 = () => { useState(); };
      ({useHook: () => { useState(); }});
      ({useHook() { useState(); }});
      const {useHook = () => { useState(); }} = {};
      ({useHook = () => { useState(); }} = {});
    `,
    `
      // Valid because hooks can call hooks.
      function useHook() {
        useHook1();
        useHook2();
      }
    `,
    `
      // Valid because hooks can call hooks.
      function createHook() {
        return function useHook() {
          useHook1();
          useHook2();
        };
      }
    `,
    `
      // Valid because hooks can call hooks.
      function useHook() {
        useState() && a;
      }
    `,
    `
      // Valid because hooks can call hooks.
      function useHook() {
        return useHook1() + useHook2();
      }
    `,
    `
      // Valid because hooks can call hooks.
      function useHook() {
        return useHook1(useHook2());
      }
    `,
    `
      // Valid because classes can call functions.
      // We don't consider these to be hooks.
      class C {
        m() {
          this.useHook();
          super.useHook();
        }
      }
    `,
    `
      // Currently valid.
      // We *could* make this invalid if we want, but it creates false positives
      // (see the FooStore case).
      class C {
        m() {
          This.useHook();
          Super.useHook();
        }
      }
    `,
    `
      // Valid although we *could* consider these invalid.
      // But it doesn't bring much benefit since it's an immediate runtime error anyway.
      // So might as well allow it.
      Hook.use();
      Hook._use();
      Hook.useState();
      Hook._useState();
      Hook.use42();
      Hook.useHook();
      Hook.use_hook();
    `,
    `
      // Valid -- this is a regression test.
      jest.useFakeTimers();
      beforeEach(() => {
        jest.useRealTimers();
      })
    `,
    `
      // Valid because that's a false positive we've seen quite a bit.
      // This is a regression test.
      class Foo extends Component {
        render() {
          if (cond) {
            FooStore.useFeatureFlag();
          }
        }
      }
    `,
    `
      // Currently valid because we found this to be a common pattern
      // for feature flag checks in existing components.
      // We *could* make it invalid but that produces quite a few false positives.
      // Why does it make sense to ignore it? Firstly, because using
      // hooks in a class would cause a runtime error anyway.
      // But why don't we care about the same kind of false positive in a functional
      // component? Because even if it was a false positive, it would be confusing
      // anyway. So it might make sense to rename a feature flag check in that case.
      class ClassComponentWithFeatureFlag extends React.Component {
        render() {
          if (foo) {
            useFeatureFlag();
          }
        }
      }
    `,
    `
      // Currently valid because we don't check for hooks in classes.
      // See ClassComponentWithFeatureFlag for rationale.
      // We *could* make it invalid if we don't regress that false positive.
      class ClassComponentWithHook extends React.Component {
        render() {
          React.useState();
        }
      }
    `,
    `
      // Currently valid.
      // These are variations capturing the current heuristic--
      // we only allow hooks in PascalCase, useFoo functions,
      // or classes (due to common false positives and because they error anyway).
      // We *could* make some of these invalid.
      // They probably don't matter much.
      (class {useHook = () => { useState(); }});
      (class {useHook() { useState(); }});
      (class {h = () => { useState(); }});
      (class {i() { useState(); }});
    `,
    `
      // Currently valid although we *could* consider these invalid.
      // It doesn't make a lot of difference because it would crash early.
      use();
      _use();
      useState();
      _useState();
      use42();
      useHook();
      use_hook();
      React.useState();
    `,
    `
      // Regression test for the popular "history" library
      const {createHistory, useBasename} = require('history-2.1.2');
      const browserHistory = useBasename(createHistory)({
        basename: '/',
      });
    `,
    `
      // Regression test for some internal code.
      // This shows how the "callback rule" is more relaxed,
      // and doesn't kick in unless we're confident we're in
      // a component or a hook.
      function makeListener(instance) {
        each(pixelsWithInferredEvents, pixel => {
          if (useExtendedSelector(pixel.id) && extendedButton) {
            foo();
          }
        });
      }
    `,
    `
      // Regression test for incorrectly flagged valid code.
      function RegressionTest() {
        const foo = cond ? a : b;
        useState();
      }
    `,
    `
      // Valid because exceptions abort rendering
      function RegressionTest() {
        if (page == null) {
          throw new Error('oh no!');
        }
        useState();
      }
    `,
  ],
  invalid: [
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function ComponentWithConditionalHook() {
          if (cond) {
            useConditionalHook();
          }
        }
      `,
      errors: [conditionalError('useConditionalHook')],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function createComponent() {
          return function ComponentWithConditionalHook() {
            if (cond) {
              useConditionalHook();
            }
          }
        }
      `,
      errors: [conditionalError('useConditionalHook')],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function useHookWithConditionalHook() {
          if (cond) {
            useConditionalHook();
          }
        }
      `,
      errors: [conditionalError('useConditionalHook')],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function createHook() {
          return function useHookWithConditionalHook() {
            if (cond) {
              useConditionalHook();
            }
          }
        }
      `,
      errors: [conditionalError('useConditionalHook')],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function ComponentWithTernaryHook() {
          cond ? useTernaryHook() : null;
        }
      `,
      errors: [conditionalError('useTernaryHook')],
    },
    {
      code: `
        // Invalid because it's a common misunderstanding.
        // We *could* make it valid but the runtime error could be confusing.
        function ComponentWithHookInsideCallback() {
          useEffect(() => {
            useHookInsideCallback();
          });
        }
      `,
      errors: [genericError('useHookInsideCallback')],
    },
    {
      code: `
        // Invalid because it's a common misunderstanding.
        // We *could* make it valid but the runtime error could be confusing.
        function createComponent() {
          return function ComponentWithHookInsideCallback() {
            useEffect(() => {
              useHookInsideCallback();
            });
          }
        }
      `,
      errors: [genericError('useHookInsideCallback')],
    },
    {
      code: `
        // Invalid because it's a common misunderstanding.
        // We *could* make it valid but the runtime error could be confusing.
        function ComponentWithHookInsideCallback() {
          function handleClick() {
            useState();
          }
        }
      `,
      errors: [functionError('useState', 'handleClick')],
    },
    {
      code: `
        // Invalid because it's a common misunderstanding.
        // We *could* make it valid but the runtime error could be confusing.
        function createComponent() {
          return function ComponentWithHookInsideCallback() {
            function handleClick() {
              useState();
            }
          }
        }
      `,
      errors: [functionError('useState', 'handleClick')],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function ComponentWithHookInsideLoop() {
          while (cond) {
            useHookInsideLoop();
          }
        }
      `,
      errors: [loopError('useHookInsideLoop')],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function renderItem() {
          useState();
        }

        function List(props) {
          return props.items.map(renderItem);
        }
      `,
      errors: [functionError('useState', 'renderItem')],
    },
    {
      code: `
        // Currently invalid because it violates the convention and removes the "taint"
        // from a hook. We *could* make it valid to avoid some false positives but let's
        // ensure that we don't break the "renderItem" and "normalFunctionWithConditionalHook"
        // cases which must remain invalid.
        function normalFunctionWithHook() {
          useHookInsideNormalFunction();
        }
      `,
      errors: [
        functionError('useHookInsideNormalFunction', 'normalFunctionWithHook'),
      ],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function normalFunctionWithConditionalHook() {
          if (cond) {
            useHookInsideNormalFunction();
          }
        }
      `,
      errors: [
        functionError(
          'useHookInsideNormalFunction',
          'normalFunctionWithConditionalHook'
        ),
      ],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function useHookInLoops() {
          while (a) {
            useHook1();
            if (b) return;
            useHook2();
          }
          while (c) {
            useHook3();
            if (d) return;
            useHook4();
          }
        }
      `,
      errors: [
        loopError('useHook1'),
        loopError('useHook2'),
        loopError('useHook3'),
        loopError('useHook4'),
      ],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function useHookInLoops() {
          while (a) {
            useHook1();
            if (b) continue;
            useHook2();
          }
        }
      `,
      errors: [
        loopError('useHook1'),

        // NOTE: Small imprecision in error reporting due to caching means we
        // have a conditional error here instead of a loop error. However,
        // we will always get an error so this is acceptable.
        conditionalError('useHook2', true),
      ],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function useLabeledBlock() {
          label: {
            if (a) break label;
            useHook();
          }
        }
      `,
      errors: [conditionalError('useHook')],
    },
    {
      code: `
        // Currently invalid.
        // These are variations capturing the current heuristic--
        // we only allow hooks in PascalCase or useFoo functions.
        // We *could* make some of these valid. But before doing it,
        // consider specific cases documented above that contain reasoning.
        function a() { useState(); }
        const whatever = function b() { useState(); };
        const c = () => { useState(); };
        let d = () => useState();
        e = () => { useState(); };
        ({f: () => { useState(); }});
        ({g() { useState(); }});
        const {j = () => { useState(); }} = {};
        ({k = () => { useState(); }} = {});
      `,
      errors: [
        functionError('useState', 'a'),
        functionError('useState', 'b'),
        functionError('useState', 'c'),
        functionError('useState', 'd'),
        functionError('useState', 'e'),
        functionError('useState', 'f'),
        functionError('useState', 'g'),
        functionError('useState', 'j'),
        functionError('useState', 'k'),
      ],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function useHook() {
          if (a) return;
          useState();
        }
      `,
      errors: [conditionalError('useState', true)],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function useHook() {
          if (a) return;
          if (b) {
            console.log('true');
          } else {
            console.log('false');
          }
          useState();
        }
      `,
      errors: [conditionalError('useState', true)],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function useHook() {
          if (b) {
            console.log('true');
          } else {
            console.log('false');
          }
          if (a) return;
          useState();
        }
      `,
      errors: [conditionalError('useState', true)],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function useHook() {
          a && useHook1();
          b && useHook2();
        }
      `,
      errors: [conditionalError('useHook1'), conditionalError('useHook2')],
    },
    {
      code: `
        // Invalid because it's dangerous and might not warn otherwise.
        // This *must* be invalid.
        function useHook() {
          try {
            f();
            useState();
          } catch {}
        }
      `,
      errors: [
        // NOTE: This is an error since `f()` could possibly throw.
        conditionalError('useState'),
      ],
    },
  ],
});

function conditionalError(hook, hasPreviousFinalizer = false) {
  return {
    message:
      `React Hook "${hook}" is called conditionally. React Hooks must be ` +
      'called in the exact same order in every component render.' +
      (hasPreviousFinalizer
        ? ' Did you accidentally call a React Hook after an early return?'
        : ''),
  };
}

function loopError(hook) {
  return {
    message:
      `React Hook "${hook}" may be executed more than once. Possibly ` +
      'because it is called in a loop. React Hooks must be called in the ' +
      'exact same order in every component render.',
  };
}

function functionError(hook, fn) {
  return {
    message:
      `React Hook "${hook}" is called in function "${fn}" which is neither ` +
      'a React function component or a custom React Hook function.',
  };
}

function genericError(hook) {
  return {
    message:
      `React Hook "${hook}" cannot be called inside a callback. React Hooks ` +
      'must be called in a React function component or a custom React ' +
      'Hook function.',
  };
}
