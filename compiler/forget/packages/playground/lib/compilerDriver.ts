/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import type { PluginItem, TransformOptions } from "@babel/core";
import { transform } from "@babel/standalone";
import ReactForgetBabelPlugin, {
  createArrayLogger,
  createCompilerOutputs,
  getMostRecentCompilerContext,
  OutputKind,
  type CompilerContext,
  type CompilerOptions,
  type CompilerOutputs,
  type Diagnostic,
} from "babel-plugin-react-forget";
import type { InputFile } from "./stores";
import { getBabelPlugins } from "./utils";

declare global {
  var Forget$Context: CompilerContext;
}
export type ForgetCompilerFlags = CompilerOptions["flags"];

interface CompileResult {
  outputs: CompilerOutputs;
  diagnostics: Diagnostic[];
}

export default function compile(
  file: InputFile,
  compilerFlags: ForgetCompilerFlags
): CompileResult {
  const outputs = createCompilerOutputs();

  // Bail out if file is CSS.
  if (file.language === "css") {
    return {
      outputs,
      diagnostics: [],
    };
  }

  const forgetLogs: string[] = [];
  const forgetPlaygroundOptions: Partial<CompilerOptions> = {
    logger: createArrayLogger(forgetLogs),
    outputKinds: Object.values(OutputKind),
  };
  if (compilerFlags) {
    forgetPlaygroundOptions.flags = compilerFlags;
  }

  const babelPlugins = getBabelPlugins(
    file.language,
    true,
    forgetPlaygroundOptions
  );
  const babelOptions: TransformOptions = {
    compact: true,
    plugins: babelPlugins,
    filename: file.id,
  };

  try {
    const result = transform(file.content, babelOptions);

    // Don't throw if resulting code is any string. This includes the
    // empty string, which is when `source` is an empty string.
    if (typeof result?.code !== "string") {
      throw new Error("Compilation Failed.");
    }

    const context = getMostRecentCompilerContext();
    // assign to global for interactive debugging
    globalThis.Forget$Context = context;
    const { outputs } = context;
    outputs[OutputKind.JS] = result.code;

    return {
      outputs,
      diagnostics: context.diagnostics,
    };
  } catch (e) {
    const context = getMostRecentCompilerContext();

    return {
      outputs,
      diagnostics: context.diagnostics,
    };
  }
}
