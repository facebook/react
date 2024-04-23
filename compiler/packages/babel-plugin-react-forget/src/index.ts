/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { runReactForgetBabelPlugin } from "./Babel/RunReactForgetBabelPlugin";
export {
  CompilerError,
  CompilerErrorDetail,
  CompilerSuggestionOperation,
  ErrorSeverity,
} from "./CompilerError";
export {
  compileFn as compile,
  compileProgram,
  parsePluginOptions,
  run,
  type CompilerPipelineValue,
  type PluginOptions,
} from "./Entrypoint";
export {
  Effect,
  ValueKind,
  parseConfigPragma,
  printHIR,
  validateEnvironmentConfig,
  type EnvironmentConfig,
  type ExternalFunction,
  type Hook,
  type SourceLocation,
} from "./HIR";
export { printReactiveFunction } from "./ReactiveScopes";

declare global {
  let __DEV__: boolean | null | undefined;
}

import ReactForgetBabelPlugin from "./Babel/BabelPlugin";
export default ReactForgetBabelPlugin;
