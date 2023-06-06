/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
export {
  CompilerPipelineValue,
  compileFn as compile,
  compileProgram,
  parsePluginOptions,
  run,
} from "./Entrypoint";
export { Effect, Hook, ValueKind, printHIR } from "./HIR";
export { printReactiveFunction } from "./ReactiveScopes";

declare global {
  let __DEV__: boolean | null | undefined;
}

import ReactForgetBabelPlugin from "./Babel/BabelPlugin";
export default ReactForgetBabelPlugin;
