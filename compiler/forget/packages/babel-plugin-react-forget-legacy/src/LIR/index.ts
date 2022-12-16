/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The LIR (Low-level IR) in the compiler.
 *
 * Each LIR function is lowered from an IR function
 */

export * from "./Block";
export * from "./Func";
export * from "./Instr";
export * as MemoCache from "./MemoCache";
export * from "./Prog";
