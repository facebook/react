/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import type { TransformOptions } from "@babel/core";
import { transform } from "@babel/standalone";
import {
  createArrayLogger,
  createCompilerOutputs,
  getMostRecentCompilerContext,
  OutputKind,
  type CompilerContext,
  type CompilerOptions,
  type CompilerOutputs,
  type Diagnostic,
} from "babel-plugin-react-forget";
import { PassName } from "../../../dist/Pass";
// @ts-ignore
import ESLint from "eslint-browser";
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

const ESLINT_CONFIG = {
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-use-before-define": "error",
  },
};

/**
 * Post-codegen pass to validate that the generated code does not introduce bugs.
 * Note that the compiler currently incorrectly reorders code in some cases: this
 * step detects this using ESLint's no-use-before-define rule at its strictest
 * setting.
 */
function validateNoUseBeforeDefine(source: string) {
  const linter = new ESLint.index.Linter();
  return linter.verify(source, ESLINT_CONFIG);
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
    postCodegenValidator: validateNoUseBeforeDefine,
    stopPass: PassName.Validator,
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

    outputs[OutputKind.JS] = `
      function __COMPILATION_FAILED__() {
        /**
        ${(e as Error).message
          .split("\n")
          .map((line) => "   * " + line)
          .join("\n")}
         */
      }
    `;

    return {
      outputs,
      diagnostics: context.diagnostics,
    };
  }
}
