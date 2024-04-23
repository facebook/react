/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ErrorSeverity,
  runReactForgetBabelPlugin,
  type CompilerErrorDetailOptions,
  type PluginOptions,
} from "babel-plugin-react-forget/src";
import { LoggerEvent } from "babel-plugin-react-forget/src/Entrypoint";
import { glob } from "fast-glob";
import * as fs from "fs/promises";
import yargs from "yargs/yargs";

const SUCCESS: Array<LoggerEvent> = [];
const ACTIONABLE_FAILURES: Array<LoggerEvent> = [];
const OTHER_FAILURES: Array<LoggerEvent> = [];

const logger = {
  logEvent(_: string | null, event: LoggerEvent) {
    switch (event.kind) {
      case "CompileSuccess": {
        SUCCESS.push(event);
        return;
      }
      case "CompileError": {
        if (isActionableDiagnostic(event.detail)) {
          ACTIONABLE_FAILURES.push(event);
          return;
        }
        OTHER_FAILURES.push(event);
        return;
      }
      case "CompileDiagnostic":
      case "PipelineError":
      // TODO(gsn): Silenty fail?
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
      throw new Error("Unhandled error severity");
  }
}

function compile(sourceCode: string, filename: string) {
  try {
    runReactForgetBabelPlugin(
      sourceCode,
      filename,
      "typescript",
      COMPILER_OPTIONS
    );
  } catch {}
}

async function main() {
  const argv = yargs(process.argv.slice(2))
    .scriptName("healthcheck")
    .usage("$ npx healthcheck <src>")
    .option("src", {
      description: "glob expression matching src files to compile",
      type: "string",
      default: "**/*.{js,ts,jsx,tsx,mjs}",
    })
    .parseSync();

  let src = argv.src;

  // no file extension specified
  if (!src.includes(".")) {
    src = src + ".{js,ts,jsx,tsx,mjs}";
  }

  const globOptions = {
    onlyFiles: true,
    ignore: [
      "*/node_modules/**",
      "*/dist/**",
      "*/tests/**",
      "*/__tests__/**",
      "node_modules/**",
      "dist/**",
      "tests/**",
      "__tests__/**",
    ],
  };

  for (const path of await glob(src, globOptions)) {
    const source = await fs.readFile(path, "utf-8");
    compile(source, path);
  }

  console.log(`Successful compilation: ${SUCCESS.length}`);
  console.log(`Failed compilation: ${ACTIONABLE_FAILURES.length}`);
}

main();
