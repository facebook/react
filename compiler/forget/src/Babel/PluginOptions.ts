/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EnvironmentConfig } from "../HIR/Environment";

export type GatingOptions = {
  /**
   * Source for the imported module that exports the `importSpecifierName` functions
   */
  source: string;
  /**
   * Unique name for the feature flag test condition, eg `isForgetEnabled_ProjectName`
   */
  importSpecifierName: string;
};

export type PluginOptions = {
  /**
   * Enable to make Forget only compile functions containing the 'use forget' directive.
   */
  enableOnlyOnUseForgetDirective: boolean;

  environment: EnvironmentConfig | null;

  logger: Logger | null;

  /**
   * Specifying a `gating` config, makes Forget compile and emit a separate
   * version of the function gated by importing the `gating.importSpecifierName` from the
   * specified `gating.source`.
   *
   * For example:
   *  gating: {
   *    source: 'ReactForgetFeatureFlag',
   *    importSpecifierName: 'isForgetEnabled_Pokes',
   *  }
   *
   * produces:
   *  import {isForgetEnabled_Pokes} from 'ReactForgetFeatureFlag';
   *
   *  Foo_forget()   {}
   *
   *  Foo_uncompiled() {}
   *
   *  var Foo = isForgetEnabled_Pokes() ? Foo_forget : Foo_uncompiled;
   */
  gating: GatingOptions | null;

  panicOnBailout: boolean;

  isDev: boolean;
};

export type Logger = {
  logEvent(name: string, data: any): void;
};

export const defaultOptions: PluginOptions = {
  enableOnlyOnUseForgetDirective: false,
  panicOnBailout: true,
  environment: null,
  logger: null,
  gating: null,
  isDev: false,
} as const;

export function parsePluginOptions(obj: unknown): PluginOptions {
  if (obj == null || typeof obj !== "object") {
    return defaultOptions;
  }
  const invalidOptions: Array<string> = [];
  let parsedOptions: Partial<PluginOptions> = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    if (isCompilerFlag(key)) {
      parsedOptions[key] = value;
    } else {
      invalidOptions.push(key);
    }
  }
  if (invalidOptions.length > 0) {
    console.error(`Unexpected React Forget compiler flags: ${invalidOptions}`);
  }
  return { ...defaultOptions, ...parsedOptions };
}

function isCompilerFlag(s: string): s is keyof typeof defaultOptions {
  return Object.prototype.hasOwnProperty.call(defaultOptions, s);
}
