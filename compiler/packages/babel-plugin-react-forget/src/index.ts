/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {
  CompilerError,
  CompilerErrorDetail,
  CompilerSuggestionOperation,
  ErrorSeverity,
} from "./CompilerError";
export {
  CompilerPipelineValue,
  PluginOptions,
  compileFn as compile,
  compileProgram,
  parsePluginOptions,
  run,
} from "./Entrypoint";
export {
  Effect,
  EnvironmentConfig,
  ExternalFunction,
  Hook,
  SourceLocation,
  ValueKind,
  parseConfigPragma,
  printHIR,
  validateEnvironmentConfig,
} from "./HIR";
export { printReactiveFunction } from "./ReactiveScopes";

declare global {
  let __DEV__: boolean | null | undefined;
}

import ReactForgetBabelPlugin from "./Babel/BabelPlugin";
export default ReactForgetBabelPlugin;
