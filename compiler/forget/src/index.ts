/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export { default as BabelPlugin } from "./Babel/BabelPlugin";
export {
  CompilerError,
  CompilerErrorDetail,
  ErrorSeverity,
} from "./CompilerError";
export { compile, CompilerPipelineValue, run } from "./CompilerPipeline";
export { Effect, printHIR, ValueKind } from "./HIR";
export { printReactiveFunction } from "./ReactiveScopes";

declare global {
  let __DEV__: boolean | null | undefined;
}

console.log("loading Forget!!!");

import ReactForgetBabelPlugin from "./Babel/BabelPlugin";
export default ReactForgetBabelPlugin;
