/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The IR in the compiler, or "React IR".
 *
 * The purpose of IR is to represent the program in the way to help with
 * static analysis (e.g. mutability of values, dependencies between values).
 *
 * Each IR function is lowered from an (inferred) React function.
 */

export * from "./Func";
export * from "./FuncTopLevel";
export {
  Hook,
  HookCall,
  HookCallExpr,
  HookKind,
  HookSig,
  isHookLikeName,
  matchHookCall,
} from "./Hook";
export * from "./JSX";
export * from "./Prog";
export * from "./Val";
export * from "./ValSnapshot";
