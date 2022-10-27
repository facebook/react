/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import type { TransformOptions } from "@babel/core";
import { transform } from "@babel/standalone";
import {
  createArrayLogger,
  createCompilerOutputs,
  getMostRecentCompilerContext,
  NoUseBeforeDefineRule,
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
    "custom-no-use-before-define": "error",
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
  linter.defineRule("custom-no-use-before-define", NoUseBeforeDefineRule);
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
    let code = result.code;

    const errors: Array<{ ruleId: string; message: string }> =
      validateNoUseBeforeDefine(code);
    // Filter out parse errors
    const noUseBeforeDefineErrors =
      errors != null
        ? errors.filter((error) => error.ruleId === "no-use-before-define")
        : [];
    if (noUseBeforeDefineErrors.length !== 0) {
      const comments = noUseBeforeDefineErrors
        .map((error) => `// - ${error.message}`)
        .join("\n");
      code = `// !!! INVALID OUTPUT !!!!\n${comments}\n${code}`;
    } else if (errors != null && errors.length !== 0) {
      code = `// NOTE: Could not validate output, the validator does not yet support JSX\n${code}`;
    }
    outputs[OutputKind.JS] = code;

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
