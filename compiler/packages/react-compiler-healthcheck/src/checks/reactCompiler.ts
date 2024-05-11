/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as BabelCore from "@babel/core";
import { transformFromAstSync } from "@babel/core";
import * as BabelParser from "@babel/parser";
import BabelPluginReactCompiler, {
  ErrorSeverity,
  type CompilerErrorDetailOptions,
  type PluginOptions,
} from "babel-plugin-react-compiler/src";
import { LoggerEvent } from "babel-plugin-react-compiler/src/Entrypoint";
import chalk from "chalk";

const SucessfulCompilation: Array<LoggerEvent> = [];
const ActionableFailures: Array<LoggerEvent> = [];
const OtherFailures: Array<LoggerEvent> = [];

const logger = {
  logEvent(_: string | null, event: LoggerEvent) {
    switch (event.kind) {
      case "CompileSuccess": {
        SucessfulCompilation.push(event);
        return;
      }
      case "CompileError": {
        if (isActionableDiagnostic(event.detail)) {
          ActionableFailures.push(event);
          return;
        }
        OtherFailures.push(event);
        return;
      }
      case "CompileDiagnostic":
      case "PipelineError":
        OtherFailures.push(event);
        return;
    }
  },
};

const COMPILER_OPTIONS: Partial<PluginOptions> = {
  noEmit: true,
  compilationMode: "infer",
  panicThreshold: "critical_errors",
  logger,
};

function isActionableDiagnostic(detail: CompilerErrorDetailOptions) {
  switch (detail.severity) {
    case ErrorSeverity.InvalidReact:
    case ErrorSeverity.InvalidJS:
      return true;
    case ErrorSeverity.InvalidConfig:
    case ErrorSeverity.Invariant:
    case ErrorSeverity.CannotPreserveMemoization:
    case ErrorSeverity.Todo:
      return false;
    default:
      throw new Error(`Unhandled error severity \`${detail.severity}\``);
  }
}

function runBabelPluginReactCompiler(
  text: string,
  file: string,
  language: "flow" | "typescript",
  options: Partial<PluginOptions> | null
): BabelCore.BabelFileResult {
  const ast = BabelParser.parse(text, {
    sourceFilename: file,
    plugins: [language, "jsx"],
    sourceType: "module",
  });
  const result = transformFromAstSync(ast, text, {
    filename: file,
    highlightCode: false,
    retainLines: true,
    plugins: [[BabelPluginReactCompiler, options]],
    sourceType: "module",
  });
  if (result?.code == null) {
    throw new Error(
      `Expected BabelPluginReactForget to codegen successfully, got: ${result}`
    );
  }
  return result;
}

function compile(sourceCode: string, filename: string) {
  try {
    runBabelPluginReactCompiler(
      sourceCode,
      filename,
      "typescript",
      COMPILER_OPTIONS
    );
  } catch {}
}

const JsFileExtensionRE = /(js|ts|jsx|tsx)$/;

export default {
  run(source: string, path: string): void {
    if (JsFileExtensionRE.exec(path) !== null) {
      compile(source, path);
    }
  },

  report(): void {
    const totalComponents =
      SucessfulCompilation.length +
      OtherFailures.length +
      ActionableFailures.length;
    console.log(
      chalk.green(
        `Successfully compiled ${SucessfulCompilation.length} out of ${totalComponents} components.`
      )
    );
  },
};
