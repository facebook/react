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
import chalk from "chalk";
import { glob } from "fast-glob";
import * as fs from "fs/promises";
import ora from "ora";
import yargs from "yargs/yargs";
import { config } from "./config";

const SUCCESS: Array<LoggerEvent> = [];
const ACTIONABLE_FAILURES: Array<LoggerEvent> = [];
const OTHER_FAILURES: Array<LoggerEvent> = [];
let STRICT_MODE_USAGE = false;

const StrictModeRE = /\<StrictMode\>/;

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
        OTHER_FAILURES.push(event);
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
      default: "**/*.*",
    })
    .parseSync();

  const spinner = ora("Compiling").start();
  let src = argv.src;

  // no file extension specified
  if (!src.includes(".")) {
    src = src;
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

  const jsFileExtensionRE = /(js|ts|jsx|tsx|mjs)$/;
  const packageJsonRE = /package\.json$/;
  const knownIncompatibleLibrariesUsage = new Set();

  for (const path of await glob(src, globOptions)) {
    const source = await fs.readFile(path, "utf-8");
    if (jsFileExtensionRE.exec(path) !== null) {
      spinner.text = `Compiling ${path}`;
      compile(source, path);

      if (!STRICT_MODE_USAGE) {
        STRICT_MODE_USAGE = StrictModeRE.exec(source) !== null;
      }
    } else if (packageJsonRE.exec(path) !== null) {
      const contents = JSON.parse(source);
      const deps = contents.dependencies;
      for (const library of config.knownIncompatibleLibraries) {
        if (Object.hasOwn(deps, library)) {
          knownIncompatibleLibrariesUsage.add(library);
        }
      }
    }
  }
  spinner.stop();

  const totalComponents =
    SUCCESS.length + OTHER_FAILURES.length + ACTIONABLE_FAILURES.length;
  console.log(
    chalk.green(
      `Successfully compiled ${SUCCESS.length} out of ${totalComponents} components.`
    )
  );

  if (STRICT_MODE_USAGE) {
    console.log(chalk.green("StrictMode usage found."));
  } else {
    console.log(chalk.red("StrictMode usage not found."));
  }

  if (knownIncompatibleLibrariesUsage.size > 0) {
    console.log(chalk.red(`Found the following incompatible libraries:`));
    for (const library of knownIncompatibleLibrariesUsage) {
      console.log(library);
    }
  } else {
    console.log(chalk.green(`Found no usage of incompatible libraries.`));
  }
}

main();
