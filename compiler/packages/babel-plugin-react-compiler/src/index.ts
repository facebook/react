/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {runBabelPluginReactCompiler} from './Babel/RunReactCompilerBabelPlugin';
export {
  CompilerError,
  CompilerErrorDetail,
  CompilerSuggestionOperation,
  ErrorSeverity,
  type CompilerErrorDetailOptions,
} from './CompilerError';
export {
  compileFn as compile,
  compileProgram,
  parsePluginOptions,
  OPT_OUT_DIRECTIVES,
  OPT_IN_DIRECTIVES,
  ProgramContext,
  tryFindDirectiveEnablingMemoization as findDirectiveEnablingMemoization,
  findDirectiveDisablingMemoization,
  type CompilerPipelineValue,
  type Logger,
  type LoggerEvent,
  type PluginOptions,
} from './Entrypoint';
export {
  Effect,
  ValueKind,
  printHIR,
  printFunctionWithOutlined,
  validateEnvironmentConfig,
  type EnvironmentConfig,
  type ExternalFunction,
  type Hook,
  type SourceLocation,
} from './HIR';
export {
  printReactiveFunction,
  printReactiveFunctionWithOutlined,
} from './ReactiveScopes';
export {parseConfigPragmaForTests} from './Utils/TestUtils';
declare global {
  let __DEV__: boolean | null | undefined;
}

import BabelPluginReactCompiler from './Babel/BabelPlugin';
export default BabelPluginReactCompiler;
