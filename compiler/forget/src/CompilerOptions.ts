/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PluginOptions } from "@babel/core";
import { hasOwnProperty } from "./Common/utils";
import {
  CompilerFlags,
  createCompilerFlags,
  parseCompilerFlags,
} from "./CompilerFlags";
import { isOutputKind, OutputKind } from "./CompilerOutputs";
import { Logger, noopLogger } from "./Logger";
import { PassName } from "./Pass";

export type CompilerOptions = {
  outputKinds: OutputKind[];

  flags: CompilerFlags;

  /**
   * Notify the compiler to stop at certain pass.
   */
  stopPass: PassName;

  /**
   * Set this to true to make Forget opt-in at file level.
   * - `"use forget"`
   * - `@react forget` (tentative)
   */
  optIn: boolean;

  /**
   * Logger for compiler development errors and warnings.
   * By default, logs are disabled.
   */
  logger: Logger;

  /**
   * Capitalized identifier names that can be used in call expressions.
   */
  allowedCapitalizedUserFunctions: Set<string>;
};

/**
 * Takes an untyped JSON object and converts it to `CompilerOptions`.
 *
 * @returns A valid `CompilerOptions`.
 * @throws An error message describe the invalid input.
 */
export function parseCompilerOptions(
  pluginOpts: PluginOptions
): CompilerOptions {
  const resOpts: CompilerOptions = createCompilerOptions();
  if (pluginOpts == null) {
    return resOpts;
  }
  if (typeof pluginOpts !== "object") {
    throw "Expected an object";
  }
  const inputOpts = pluginOpts as {
    [P in keyof CompilerOptions]?: any;
  };
  if (hasOwnProperty(inputOpts, "outputKinds")) {
    const outputKinds = inputOpts.outputKinds;
    if (
      outputKinds == null ||
      outputKinds.some((kind: string) => !isOutputKind(kind))
    ) {
      throw `Invalid value for 'outputKinds': ${outputKinds}`;
    }
    resOpts.outputKinds = outputKinds;
  }
  if (hasOwnProperty(inputOpts, "flags")) {
    resOpts.flags = parseCompilerFlags(inputOpts.flags);
  }
  if (hasOwnProperty(inputOpts, "stopPass")) {
    const stopPass = inputOpts.stopPass;
    if (!(stopPass in PassName)) {
      throw `Invalid value for 'stopPass': ${stopPass}`;
    }
    resOpts.stopPass = stopPass;
  }
  if (hasOwnProperty(inputOpts, "optIn")) {
    const optIn = inputOpts.optIn;
    if (typeof optIn !== "boolean") {
      throw `Invalid value for 'optIn': ${optIn}`;
    }
    resOpts.optIn = optIn;
  }
  if (hasOwnProperty(inputOpts, "logger")) {
    const logger = inputOpts.logger;
    if (
      typeof logger !== "object" ||
      typeof logger.error !== "function" ||
      typeof logger.warn !== "function" ||
      typeof logger.logEvent !== "function"
    ) {
      throw `Invalid value for 'logger': ${logger}`;
    }
    resOpts.logger = logger;
  }
  if (hasOwnProperty(inputOpts, "allowedCapitalizedUserFunctions")) {
    const allowedCapitalizedUserFunctions =
      inputOpts.allowedCapitalizedUserFunctions;
    if (
      typeof allowedCapitalizedUserFunctions !== "object" ||
      !(allowedCapitalizedUserFunctions instanceof Set)
    ) {
      throw `Invalid value for 'allowedCapitalizedUserFunctions': ${allowedCapitalizedUserFunctions}`;
    }
    resOpts.allowedCapitalizedUserFunctions = allowedCapitalizedUserFunctions;
  }
  return resOpts;
}

/**
 * Create default {@link CompilerOptions}.
 */
export function createCompilerOptions(): CompilerOptions {
  return {
    outputKinds: [OutputKind.JS],
    flags: createCompilerFlags(),
    stopPass: PassName.JSGen,
    optIn: false,
    logger: noopLogger,
    allowedCapitalizedUserFunctions: new Set(),
  };
}
