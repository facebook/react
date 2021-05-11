/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Compiler Middle End.
 * Concerning about static analysis.
 */

export { default as BodyAnalysis } from "./BodyAnalysis";
export { default as DepGraphAnalysis } from "./DepGraphAnalysis";
export { default as DumpCFG } from "./DumpCFG";
export { default as DumpIR } from "./DumpIR";
export { default as IRCheck } from "./IRCheck";
export { default as ParamAnalysis } from "./ParamAnalysis";
export { default as ReactFuncsInfer } from "./ReactFuncsInfer";
export { default as RefKindInfer } from "./RefKindInfer";
export { default as SketchyCodeCheck } from "./SketchyCodeCheck";
