/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* istanbul ignore file */
import type { PluginItem, TransformOptions } from "@babel/core";
import { transformSync } from "@babel/core";
import ReactForgetBabelPlugin from "../BabelPlugin";
import { getMostRecentCompilerContext } from "../CompilerContext";
import { CompilerOptions as ForgetCompilerOptions } from "../CompilerOptions";
import { CompilerOutputs, OutputKind } from "../CompilerOutputs";

type CompileOptions = {
  // enables the "block scoping" plugin, needed to repro a regression
  blockScopingTransform?: boolean;
};

function createBabelOpt(
  forgetPluginOptions: Partial<ForgetCompilerOptions>,
  compileOptions: CompileOptions
): TransformOptions {
  const plugins: PluginItem[] = [[ReactForgetBabelPlugin, forgetPluginOptions]];
  if (compileOptions.blockScopingTransform) {
    plugins.push(["@babel/plugin-transform-block-scoping", { loose: true }]);
  }
  return {
    plugins,

    // Set it to false so that CodeFrame won't contain ANSI color code.
    highlightCode: false,

    compact: true,
  };
}

/**
 * @param source
 * @param pluginOpt {@link CompilerOptions}
 * @returns {@link CompilerContext.outputs}
 */
export function compile(
  source: string,
  forgetPluginOptions: Partial<ForgetCompilerOptions> = {},
  compileOptions: CompileOptions = {}
): CompilerOutputs {
  const result = transformSync(
    source,
    createBabelOpt(forgetPluginOptions, compileOptions)
  );
  if (!result?.code) {
    console.error(result);
    throw new Error("Compilation failed.");
  }

  const { outputs } = getMostRecentCompilerContext();
  outputs[OutputKind.JS] = result.code;

  return outputs;
}

export function analyze(
  source: string,
  forgetPluginOptions: Partial<ForgetCompilerOptions> = {}
) {
  transformSync(source, createBabelOpt(forgetPluginOptions, {}));
  return getMostRecentCompilerContext();
}
