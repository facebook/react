import {ErrorSeverity} from './CompilerErrorSeverity';

export enum LinterCategory {
  RULES_OF_HOOKS = 'rules-of-hooks',
  IMPURE_FUNCTIONS = 'impure-functions',
  JSX_IN_TRY = 'jsx-in-try',
  NO_REF_ACCESS_IN_RENDER = 'no-ref-access-in-render',
  VALIDATE_MANUAL_MEMO = 'validate-manual-memo',
  DYNAMIC_MANUAL_MEMO = 'dynamic-manual-memo',

  EXHAUSTIVE_DEPS = 'exhaustive-deps',
  MEMOIZED_DEPENDENCIES = 'memoized-dependencies', // not real!
  INVALID_WRITE = 'invalid-write',
  CAPITALIZED_CALLS = 'capitalized-calls',
  STATIC_COMPONENTS = 'static-components',
  NO_SET_STATE_IN_RENDER = 'no-set-state-in-render',
  NO_SET_STATE_IN_EFFECTS = 'no-set-state-in-effects',
  UNNECESSARY_EFFECTS = 'unnecessary-effects',

  UNSUPPORTED_SYNTAX = 'unsupported-syntax',

  TODO_SYNTAX = 'todo-syntax',

  COMPILER_CONFIG = 'compiler-config',
}

export enum ErrorCode {
  HOOK_CALL_STATIC,
  HOOK_INVALID_REFERENCE,
  HOOK_CALL_REACTIVE,
  HOOK_CALL_NOT_TOP_LEVEL,
  IMPURE_FUNCTIONS,
  JSX_IN_TRY,
  NO_REF_ACCESS_IN_RENDER,
  WRITE_AFTER_RENDER,
  REASSIGN_IN_ASYNC,
  INVALID_WRITE,
  CAPITALIZED_CALLS,
  STATIC_COMPONENTS,
  INVALID_USE_MEMO_CALLBACK_RETURN,
  INVALID_USE_MEMO_CALLBACK_PARAMETERS,
  INVALID_USE_MEMO_CALLBACK_ASYNC,
  INVALID_USE_MEMO_NO_ARG0,
  INVALID_USE_CALLBACK_NO_ARG0,
  DYNAMIC_MANUAL_MEMO_CALLBACK,
  DYNAMIC_USE_MEMO_SPREAD_ARGUMENT,
  DYNAMIC_USE_CALLBACK_SPREAD_ARGUMENT,
  DYNAMIC_MANUAL_MEMO_DEPENDENCY_LIST,
  COMPLEX_MANUAL_MEMO_DEPENDENCY_LIST_ENTRY,

  INVALID_SET_STATE_IN_RENDER,
  INVALID_SET_STATE_IN_MEMO,
  INVALID_SET_STATE_IN_EFFECTS,

  NO_DERIVED_COMPUTATIONS_IN_EFFECTS,

  DYNAMIC_GATING_IS_NOT_IDENTIFIER,
  DYNAMIC_GATING_MULTIPLE_DIRECTIVES,
  FILENAME_NOT_SET,

  INVALID_WRITE_GLOBAL,
  INVALID_WRITE_FROZEN_VALUE_JSX,
  INVALID_WRITE_IMMUTABLE_VALUE_USE_CONTEXT,
  INVALID_WRITE_IMMUTABLE_VALUE_KNOWN_SIGNATURE,
  INVALID_WRITE_IMMUTABLE_ARGS,
  INVALID_WRITE_STATE,
  INVALID_WRITE_REDUCER_STATE,
  INVALID_WRITE_EFFECT_DEPENDENCY,
  INVALID_WRITE_HOOK_CAPTURED,
  INVALID_WRITE_HOOK_RETURN,
  INVALID_ACCESS_BEFORE_INIT,
  INVALID_WRITE_GENERIC,

  MEMOIZED_EFFECT_DEPENDENCIES,

  INVALID_SYNTAX_MULTIPLE_DEFAULTS,
  INVALID_SYNTAX_REASSIGNED_CONST,
  INVALID_SYNTAX_BAD_VARIABLE_DECL,
  UNSUPPORTED_WITH,
  UNSUPPORTED_INNER_CLASS,
  INVALID_IMPORT_EXPORT,
  INVALID_TS_NAMESPACE,
  UNSUPPORTED_NEW_EXPRESSION,
  UNSUPPORTED_EMPTY_SEQUENCE_EXPRESSION,
  INVALID_QUASI_LENGTHS,
  INVALID_SYNTAX_DELETE_EXPRESSION,
  UNSUPPORTED_THROW_EXPRESSION,
  INVALID_JSX_NAMESPACED_NAME,
  UNSUPPORTED_EVAL,
  INVALID_SYNTAX_RESERVED_VARIABLE_NAME,
  INVALID_JAVASCRIPT_AST,
  BAILOUT_ESLINT_SUPPRESSION,
  BAILOUT_FLOW_SUPPRESSION,
  MANUAL_MEMO_MUTATED_LATER,
  MANUAL_MEMO_REMOVED,
  MANUAL_MEMO_DEPENDENCIES_CONFLICT,

  CANNOT_COMPILE_FIRE,
  DID_NOT_INFER_DEPS,

  /** Todo syntax */
  TODO_CONFLICTING_FBT_IDENTIFIER,
  TODO_DUPLICATE_FBT_TAGS,
  UNKNOWN_FUNCTION_PARAMETERS,
}

type ErrorCodeType = {
  code: ErrorCode;
  description?: string;
  severity: ErrorSeverity;
  reason: string;
  linterCategory: LinterCategory | null;
};

export const ErrorCodeDetails: Record<ErrorCode, ErrorCodeType> = {
  [ErrorCode.HOOK_CALL_STATIC]: {
    code: ErrorCode.HOOK_CALL_STATIC,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)',
    linterCategory: LinterCategory.RULES_OF_HOOKS,
  },
  [ErrorCode.HOOK_INVALID_REFERENCE]: {
    code: ErrorCode.HOOK_INVALID_REFERENCE,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Hooks may not be referenced as normal values, they must be called. See https://react.dev/reference/rules/react-calls-components-and-hooks#never-pass-around-hooks-as-regular-values',
    linterCategory: LinterCategory.RULES_OF_HOOKS,
  },
  [ErrorCode.HOOK_CALL_REACTIVE]: {
    code: ErrorCode.HOOK_CALL_REACTIVE,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Hooks must be the same function on every render, but this value may change over time to a different function. See https://react.dev/reference/rules/react-calls-components-and-hooks#dont-dynamically-use-hooks',
    linterCategory: LinterCategory.RULES_OF_HOOKS,
  },
  [ErrorCode.HOOK_CALL_NOT_TOP_LEVEL]: {
    code: ErrorCode.HOOK_CALL_NOT_TOP_LEVEL,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Hooks must be called at the top level in the body of a function component or custom hook, and may not be called within function expressions. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)',
    linterCategory: LinterCategory.RULES_OF_HOOKS,
  },
  [ErrorCode.IMPURE_FUNCTIONS]: {
    code: ErrorCode.IMPURE_FUNCTIONS,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Cannot call impure functions during render',
    description:
      'Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).',
    linterCategory: LinterCategory.IMPURE_FUNCTIONS,
  },
  [ErrorCode.JSX_IN_TRY]: {
    code: ErrorCode.JSX_IN_TRY,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Avoid constructing JSX within try/catch',
    description: `React does not immediately render components when JSX is rendered, so any errors from this component will not be caught by the try/catch. To catch errors in rendering a given component, wrap that component in an error boundary. (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)`,
    linterCategory: LinterCategory.JSX_IN_TRY,
  },
  [ErrorCode.NO_REF_ACCESS_IN_RENDER]: {
    code: ErrorCode.NO_REF_ACCESS_IN_RENDER,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Cannot access refs during render',
    description:
      'React refs are values that are not needed for rendering. Refs should only be accessed ' +
      'outside of render, such as in event handlers or effects. ' +
      'Accessing a ref value (the `current` property) during render can cause your component ' +
      'not to update as expected (https://react.dev/reference/react/useRef)',
    linterCategory: LinterCategory.NO_REF_ACCESS_IN_RENDER,
  },
  [ErrorCode.INVALID_SET_STATE_IN_EFFECTS]: {
    code: ErrorCode.INVALID_SET_STATE_IN_EFFECTS,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Calling setState synchronously within an effect can trigger cascading renders',
    description:
      'Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. ' +
      'In general, the body of an effect should do one or both of the following:\n' +
      '* Update external systems with the latest state from React.\n' +
      '* Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\n' +
      'Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. ' +
      '(https://react.dev/learn/you-might-not-need-an-effect)',
    linterCategory: LinterCategory.NO_SET_STATE_IN_EFFECTS,
  },
  [ErrorCode.WRITE_AFTER_RENDER]: {
    code: ErrorCode.WRITE_AFTER_RENDER,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Cannot modify local variables after render completes',
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.REASSIGN_IN_ASYNC]: {
    code: ErrorCode.REASSIGN_IN_ASYNC,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Cannot reassign variable in async function',
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE]: {
    code: ErrorCode.INVALID_WRITE,
    severity: ErrorSeverity.InvalidReact,
    reason: 'This value cannot be modified',
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.CAPITALIZED_CALLS]: {
    code: ErrorCode.CAPITALIZED_CALLS,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Capitalized functions are reserved for components, which must be invoked with JSX. If this is a component, render it with JSX. Otherwise, ensure that it has no hook calls and rename it to begin with a lowercase letter. Alternatively, if you know for a fact that this function is not a component, you can allowlist it via the compiler config',
    linterCategory: LinterCategory.CAPITALIZED_CALLS,
  },
  [ErrorCode.STATIC_COMPONENTS]: {
    code: ErrorCode.STATIC_COMPONENTS,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Cannot create components during render',
    linterCategory: LinterCategory.STATIC_COMPONENTS,
  },
  [ErrorCode.INVALID_USE_MEMO_NO_ARG0]: {
    code: ErrorCode.INVALID_USE_MEMO_NO_ARG0,
    severity: ErrorSeverity.InvalidReact,
    reason: `Expected a callback function to be passed to useMemo`,
    linterCategory: LinterCategory.VALIDATE_MANUAL_MEMO,
  },
  [ErrorCode.INVALID_USE_CALLBACK_NO_ARG0]: {
    code: ErrorCode.INVALID_USE_CALLBACK_NO_ARG0,
    severity: ErrorSeverity.InvalidReact,
    reason: `Expected a callback function to be passed to useCallback`,
    linterCategory: LinterCategory.VALIDATE_MANUAL_MEMO,
  },
  [ErrorCode.DYNAMIC_USE_MEMO_SPREAD_ARGUMENT]: {
    code: ErrorCode.DYNAMIC_USE_MEMO_SPREAD_ARGUMENT,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Unexpected spread argument to useMemo',
    linterCategory: LinterCategory.DYNAMIC_MANUAL_MEMO,
  },

  [ErrorCode.DYNAMIC_USE_CALLBACK_SPREAD_ARGUMENT]: {
    code: ErrorCode.DYNAMIC_USE_CALLBACK_SPREAD_ARGUMENT,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Unexpected spread argument to useCallback',
    linterCategory: LinterCategory.DYNAMIC_MANUAL_MEMO,
  },
  [ErrorCode.INVALID_USE_MEMO_CALLBACK_PARAMETERS]: {
    code: ErrorCode.INVALID_USE_MEMO_CALLBACK_PARAMETERS,
    severity: ErrorSeverity.InvalidReact,
    reason: 'useMemo() callbacks may not accept parameters',
    description:
      'useMemo() callbacks are called by React to cache calculations across re-renders. They should not take parameters. Instead, directly reference the props, state, or local variables needed for the computation.',
    linterCategory: LinterCategory.VALIDATE_MANUAL_MEMO,
  },
  [ErrorCode.INVALID_USE_MEMO_CALLBACK_ASYNC]: {
    code: ErrorCode.INVALID_USE_MEMO_CALLBACK_ASYNC,
    severity: ErrorSeverity.InvalidReact,
    reason: 'useMemo() callbacks may not be async or generator functions',
    description:
      'useMemo() callbacks are called once and must synchronously return a value.',
    linterCategory: LinterCategory.VALIDATE_MANUAL_MEMO,
  },
  [ErrorCode.INVALID_USE_MEMO_CALLBACK_RETURN]: {
    code: ErrorCode.INVALID_USE_MEMO_CALLBACK_RETURN,
    severity: ErrorSeverity.InvalidReact,
    reason: 'useMemo() callbacks must return a value',
    linterCategory: LinterCategory.VALIDATE_MANUAL_MEMO,
  },
  [ErrorCode.DYNAMIC_MANUAL_MEMO_CALLBACK]: {
    code: ErrorCode.DYNAMIC_MANUAL_MEMO_CALLBACK,
    severity: ErrorSeverity.InvalidReact,
    reason: `Expected the first argument to be an inline function expression`,
    linterCategory: LinterCategory.DYNAMIC_MANUAL_MEMO,
  },
  [ErrorCode.DYNAMIC_MANUAL_MEMO_DEPENDENCY_LIST]: {
    code: ErrorCode.DYNAMIC_MANUAL_MEMO_DEPENDENCY_LIST,
    severity: ErrorSeverity.InvalidReact,
    reason: `Expected the dependency list of useMemo or useCallback to be an array literal`,
    linterCategory: LinterCategory.DYNAMIC_MANUAL_MEMO,
  },
  [ErrorCode.COMPLEX_MANUAL_MEMO_DEPENDENCY_LIST_ENTRY]: {
    code: ErrorCode.COMPLEX_MANUAL_MEMO_DEPENDENCY_LIST_ENTRY,
    severity: ErrorSeverity.InvalidReact,
    reason: `Expected the dependency list to be an array of simple expressions (e.g. \`x\`, \`x.y.z\`, \`x?.y?.z\`)`,
    linterCategory: LinterCategory.DYNAMIC_MANUAL_MEMO,
  },
  [ErrorCode.INVALID_SET_STATE_IN_RENDER]: {
    code: ErrorCode.INVALID_SET_STATE_IN_RENDER,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Calling setState during render may trigger an infinite loop',
    description:
      'Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState)',
    linterCategory: LinterCategory.NO_SET_STATE_IN_RENDER,
  },
  [ErrorCode.INVALID_SET_STATE_IN_MEMO]: {
    code: ErrorCode.INVALID_SET_STATE_IN_MEMO,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Calling setState from useMemo may trigger an infinite loop',
    description:
      'Each time the memo callback is evaluated it will change state. This can cause a memoization dependency to change, running the memo function again and causing an infinite loop. Instead of setting state in useMemo(), prefer deriving the value during render. (https://react.dev/reference/react/useState)',
    linterCategory: LinterCategory.NO_SET_STATE_IN_RENDER,
  },
  [ErrorCode.NO_DERIVED_COMPUTATIONS_IN_EFFECTS]: {
    code: ErrorCode.NO_DERIVED_COMPUTATIONS_IN_EFFECTS,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)',
    linterCategory: LinterCategory.UNNECESSARY_EFFECTS,
  },

  /** Invalid writes */
  [ErrorCode.INVALID_WRITE_GLOBAL]: {
    code: ErrorCode.INVALID_WRITE_GLOBAL,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Cannot reassign variables declared outside of the component/hook',
    description:
      'Reassigning this value during render is a form of side effect, which can cause unpredictable behavior depending on when the component happens to re-render. If this variable is used in rendering, use useState instead. Otherwise, consider updating it in an effect. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)',
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE_FROZEN_VALUE_JSX]: {
    code: ErrorCode.INVALID_WRITE_FROZEN_VALUE_JSX,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Modifying a value used previously in JSX is not allowed. Consider moving the modification before the JSX',
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE_IMMUTABLE_VALUE_USE_CONTEXT]: {
    code: ErrorCode.INVALID_WRITE_IMMUTABLE_VALUE_USE_CONTEXT,
    severity: ErrorSeverity.InvalidReact,
    reason: `Modifying a value returned from 'useContext()' is not allowed.`,
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE_IMMUTABLE_VALUE_KNOWN_SIGNATURE]: {
    code: ErrorCode.INVALID_WRITE_IMMUTABLE_VALUE_KNOWN_SIGNATURE,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Modifying a value returned from a function whose return value should not be mutated',
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE_IMMUTABLE_ARGS]: {
    code: ErrorCode.INVALID_WRITE_IMMUTABLE_ARGS,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Modifying component props or hook arguments is not allowed. Consider using a local variable instead',
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE_STATE]: {
    code: ErrorCode.INVALID_WRITE_STATE,
    severity: ErrorSeverity.InvalidReact,
    reason:
      "Modifying a value returned from 'useState()', which should not be modified directly. Use the setter function to update instead",
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE_REDUCER_STATE]: {
    code: ErrorCode.INVALID_WRITE_REDUCER_STATE,
    severity: ErrorSeverity.InvalidReact,
    reason:
      "Modifying a value returned from 'useReducer()', which should not be modified directly. Use the dispatch function to update instead",
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE_EFFECT_DEPENDENCY]: {
    code: ErrorCode.INVALID_WRITE_EFFECT_DEPENDENCY,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Modifying a value used previously in an effect function or as an effect dependency is not allowed. Consider moving the modification before calling useEffect()',
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE_HOOK_CAPTURED]: {
    code: ErrorCode.INVALID_WRITE_HOOK_CAPTURED,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Modifying a value previously passed as an argument to a hook is not allowed. Consider moving the modification before calling the hook',
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE_HOOK_RETURN]: {
    code: ErrorCode.INVALID_WRITE_HOOK_RETURN,
    severity: ErrorSeverity.InvalidReact,
    reason:
      'Modifying a value returned from a hook is not allowed. Consider moving the modification into the hook where the value is constructed',
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_ACCESS_BEFORE_INIT]: {
    code: ErrorCode.INVALID_ACCESS_BEFORE_INIT,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Cannot access variable before it is declared',
    description: `Reading a variable before it is initialized will prevent the earlier access from updating when this value changes over time. Instead, move the variable access to after it has been initialized`,
    linterCategory: LinterCategory.INVALID_WRITE,
  },
  [ErrorCode.INVALID_WRITE_GENERIC]: {
    code: ErrorCode.INVALID_WRITE_GENERIC,
    severity: ErrorSeverity.InvalidReact,
    reason: 'This modifies a variable that React considers immutable',
    linterCategory: LinterCategory.INVALID_WRITE,
  },

  /** Compiler Config */
  [ErrorCode.DYNAMIC_GATING_IS_NOT_IDENTIFIER]: {
    code: ErrorCode.DYNAMIC_GATING_IS_NOT_IDENTIFIER,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Dynamic gating directive is not a valid JavaScript identifier',
    linterCategory: LinterCategory.COMPILER_CONFIG,
  },
  [ErrorCode.DYNAMIC_GATING_MULTIPLE_DIRECTIVES]: {
    code: ErrorCode.DYNAMIC_GATING_MULTIPLE_DIRECTIVES,
    severity: ErrorSeverity.InvalidReact,
    reason: 'Expected a single dynamic gating directive',
    linterCategory: LinterCategory.COMPILER_CONFIG,
  },
  [ErrorCode.FILENAME_NOT_SET]: {
    code: ErrorCode.FILENAME_NOT_SET,
    severity: ErrorSeverity.InvalidConfig,
    reason: `Expected a filename but found none.`,
    description:
      "When the 'sources' config options is specified, the React compiler will only compile files with a name",
    linterCategory: LinterCategory.COMPILER_CONFIG,
  },

  /** Effect dependencies */
  [ErrorCode.MEMOIZED_EFFECT_DEPENDENCIES]: {
    code: ErrorCode.MEMOIZED_EFFECT_DEPENDENCIES,
    reason:
      'React Compiler has skipped optimizing this component because the effect dependencies could not be memoized. Unmemoized effect dependencies can trigger an infinite loop or other unexpected behavior',
    severity: ErrorSeverity.CannotPreserveMemoization,
    linterCategory: LinterCategory.MEMOIZED_DEPENDENCIES,
  },

  /** Invalid / unsupported syntax */
  [ErrorCode.INVALID_SYNTAX_MULTIPLE_DEFAULTS]: {
    code: ErrorCode.INVALID_SYNTAX_MULTIPLE_DEFAULTS,
    reason: `Expected at most one \`default\` branch in a switch statement, this code should have failed to parse`,
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.INVALID_SYNTAX_REASSIGNED_CONST]: {
    code: ErrorCode.INVALID_SYNTAX_REASSIGNED_CONST,
    reason: `Expect \`const\` declaration not to be reassigned`,
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.INVALID_SYNTAX_BAD_VARIABLE_DECL]: {
    code: ErrorCode.INVALID_SYNTAX_BAD_VARIABLE_DECL,
    reason: `Expected variable declaration to be an identifier if no initializer was provided`,
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.UNSUPPORTED_WITH]: {
    code: ErrorCode.UNSUPPORTED_WITH,
    reason: `JavaScript 'with' syntax is not supported`,
    description: `'with' syntax is considered deprecated and removed from JavaScript standards, consider alternatives`,
    severity: ErrorSeverity.UnsupportedJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.UNSUPPORTED_INNER_CLASS]: {
    code: ErrorCode.UNSUPPORTED_INNER_CLASS,
    reason: 'Inline `class` declarations are not supported',
    description: `Move class declarations outside of components/hooks`,
    severity: ErrorSeverity.UnsupportedJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.INVALID_IMPORT_EXPORT]: {
    code: ErrorCode.INVALID_IMPORT_EXPORT,
    reason:
      'JavaScript `import` and `export` statements may only appear at the top level of a module',
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.INVALID_TS_NAMESPACE]: {
    code: ErrorCode.INVALID_TS_NAMESPACE,
    reason:
      'TypeScript `namespace` statements may only appear at the top level of a module',
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.UNSUPPORTED_NEW_EXPRESSION]: {
    code: ErrorCode.UNSUPPORTED_NEW_EXPRESSION,
    reason: `Expected an expression as the \`new\` expression receiver (v8 intrinsics are not supported)`,
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.UNSUPPORTED_EMPTY_SEQUENCE_EXPRESSION]: {
    code: ErrorCode.UNSUPPORTED_EMPTY_SEQUENCE_EXPRESSION,
    reason: `Expected sequence expression to have at least one expression`,
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.INVALID_QUASI_LENGTHS]: {
    code: ErrorCode.INVALID_QUASI_LENGTHS,
    reason: `Unexpected quasi and subexpression lengths in template literal`,
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.INVALID_SYNTAX_DELETE_EXPRESSION]: {
    code: ErrorCode.INVALID_SYNTAX_DELETE_EXPRESSION,
    reason: `Only object properties can be deleted`,
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.UNSUPPORTED_THROW_EXPRESSION]: {
    code: ErrorCode.UNSUPPORTED_THROW_EXPRESSION,
    reason: `Throw expressions are not supported`,
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.INVALID_JSX_NAMESPACED_NAME]: {
    code: ErrorCode.INVALID_JSX_NAMESPACED_NAME,
    reason: `Expected JSXNamespacedName to have no colons in the namespace or name`,
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.UNSUPPORTED_EVAL]: {
    code: ErrorCode.UNSUPPORTED_EVAL,
    reason: `The 'eval' function is not supported`,
    description:
      'Eval is an anti-pattern in JavaScript, and the code executed cannot be evaluated by React Compiler',
    severity: ErrorSeverity.UnsupportedJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.INVALID_SYNTAX_RESERVED_VARIABLE_NAME]: {
    code: ErrorCode.INVALID_SYNTAX_RESERVED_VARIABLE_NAME,
    reason: 'Expected a non-reserved identifier name',
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.INVALID_JAVASCRIPT_AST]: {
    code: ErrorCode.INVALID_JAVASCRIPT_AST,
    reason: 'Encountered invalid JavaScript',
    severity: ErrorSeverity.InvalidJS,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.BAILOUT_ESLINT_SUPPRESSION]: {
    code: ErrorCode.BAILOUT_ESLINT_SUPPRESSION,
    reason:
      'React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled',
    description:
      'React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior',
    severity: ErrorSeverity.InvalidReact,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.MANUAL_MEMO_REMOVED]: {
    code: ErrorCode.MANUAL_MEMO_REMOVED,
    reason:
      'Compilation skipped because existing memoization could not be preserved',
    description:
      'React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value was memoized in source but not in compilation output.',
    severity: ErrorSeverity.CannotPreserveMemoization,
    linterCategory: LinterCategory.TODO_SYNTAX,
  },

  /**
   * This is left vague as fire is very experimental
   */
  [ErrorCode.CANNOT_COMPILE_FIRE]: {
    code: ErrorCode.CANNOT_COMPILE_FIRE,
    reason: 'Cannot compile `fire`',
    severity: ErrorSeverity.InvalidReact,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.DID_NOT_INFER_DEPS]: {
    code: ErrorCode.DID_NOT_INFER_DEPS,
    reason:
      'Cannot infer dependencies of this effect. This will break your build!',
    severity: ErrorSeverity.InvalidReact,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },

  [ErrorCode.BAILOUT_FLOW_SUPPRESSION]: {
    code: ErrorCode.BAILOUT_FLOW_SUPPRESSION,
    reason:
      'React Compiler has skipped optimizing this component because one or more React rule violations were reported by Flow',
    description:
      'React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior',
    severity: ErrorSeverity.InvalidReact,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },

  /** Syntax React Compiler may eventually support */
  [ErrorCode.TODO_CONFLICTING_FBT_IDENTIFIER]: {
    code: ErrorCode.TODO_CONFLICTING_FBT_IDENTIFIER,
    reason: 'Support local variables named `fbt`',
    description:
      'Local variables named `fbt` may conflict with the fbt plugin and are not yet supported',
    severity: ErrorSeverity.Todo,
    linterCategory: LinterCategory.TODO_SYNTAX,
  },
  [ErrorCode.TODO_DUPLICATE_FBT_TAGS]: {
    code: ErrorCode.TODO_DUPLICATE_FBT_TAGS,
    reason: 'Support duplicate fbt tags',
    severity: ErrorSeverity.Todo,
    linterCategory: LinterCategory.TODO_SYNTAX,
  },
  [ErrorCode.UNKNOWN_FUNCTION_PARAMETERS]: {
    code: ErrorCode.UNKNOWN_FUNCTION_PARAMETERS,
    severity: ErrorSeverity.Todo,
    reason: 'Currently unsupported function parameter syntax',
    linterCategory: LinterCategory.TODO_SYNTAX,
  },
  [ErrorCode.MANUAL_MEMO_MUTATED_LATER]: {
    code: ErrorCode.MANUAL_MEMO_MUTATED_LATER,
    reason:
      'Compilation skipped because existing memoization could not be preserved',
    description: [
      'React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. ',
      'This dependency may be mutated later, which could cause the value to change unexpectedly.',
    ].join(''),
    severity: ErrorSeverity.CannotPreserveMemoization,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
  [ErrorCode.MANUAL_MEMO_DEPENDENCIES_CONFLICT]: {
    code: ErrorCode.MANUAL_MEMO_DEPENDENCIES_CONFLICT,
    reason:
      'Compilation skipped because existing memoization could not be preserved',
    description:
      'React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. ' +
      'The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected.',
    severity: ErrorSeverity.CannotPreserveMemoization,
    linterCategory: LinterCategory.UNSUPPORTED_SYNTAX,
  },
};
