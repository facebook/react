/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Compiler Flags.
 */

export type CompilerFlags = {
  // Analysis

  /**
   * Although global mutation is unsafe, (render-)local mutation through free
   * vars could still be safe. This flag will include references to free vars
   * into the analysis and conservatively assume the value itself being mutable.
   */
  localMutationThroughFreeVars: boolean;

  /**
   * Abort compilation of functions with more than one return (implicit or
   * explicit).
   */
  bailOnMultipleReturns: boolean;

  /**
   * Abort compilation when a function starting with a capictal letter is
   * called as this might indicate a component called w/o JSX.
   *
   * Examples:
   * - `Container(memoizedProps)` might contain hook calls in
   *   https://fburl.com/code/l9mmhzlg
   */
  bailOnCapitalizedFunctionCalls: boolean;

  /**
   * Bail out on components defined in nested scopes.
   *
   * Examples:
   * - `getter` function call might contain hook calls in
   *   https://fburl.com/code/yji3smfm
   *   While this bailout doesn't directly discover this case, HOCs are a
   *   common source of calls like this.
   */
  bailOnNestedComponents: boolean;

  /**
   * Abort compilation of functions that contain any `useRef` calls.
   */
  bailOnUseRef: boolean;

  // Optimizations
  singleReturnShortcut: boolean;

  // Codegen
  /**
   * Conditional Cache Replacement For ReactiveVal.
   * @See <https://github.com/facebook/react-forget/issues/115>
   */
  condCache: boolean;

  /**
   * Enable runtime guards against reads of uninitialied memo cache values.
   */
  guardReads: boolean;

  /**
   * Enable runtime guards against calls to hooks in reactive blocks. These calls
   * are bugs in the compiler or user code not following Rules of Hooks, such
   * as calling a component like a function or naming a hook incorrectly.
   */
  guardHooks: boolean;

  /**
   * Experimental runtime logging to collect data
   */
  addFreeze: boolean;
};

export function createCompilerFlags(): CompilerFlags {
  return {
    localMutationThroughFreeVars: false,
    bailOnMultipleReturns: false,
    bailOnCapitalizedFunctionCalls: false,
    bailOnNestedComponents: false,
    bailOnUseRef: false,
    singleReturnShortcut: true,
    condCache: false,
    guardReads: false,
    guardHooks: false,
    addFreeze: false,
  };
}

export function parseCompilerFlags(
  flags: object,
  ignoreInvalidInput: boolean = false
): CompilerFlags {
  const res = createCompilerFlags();
  for (const [key, value] of Object.entries(flags)) {
    switch (key) {
      case "localMutationThroughFreeVars":
      case "bailOnMultipleReturns":
      case "bailOnCapitalizedFunctionCalls":
      case "bailOnNestedComponents":
      case "bailOnUseRef":
      case "singleReturnShortcut":
      case "condCache":
      case "guardReads":
      case "guardHooks":
      case "addFreeze":
        if (typeof value !== "boolean") {
          throw `Expected boolean for flag '${key}': ${value}`;
        }
        res[key] = value;
        break;
      case "guardThrows": {
        console.warn(
          `the 'guardThrows' flag is no longer supported, this feature is built into React now`
        );
        break;
      }
      default:
        if (!ignoreInvalidInput) {
          throw `Unknown flag: ${key}`;
        }
    }
  }
  return res;
}
