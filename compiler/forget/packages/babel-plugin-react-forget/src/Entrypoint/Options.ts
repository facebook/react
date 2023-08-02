/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EnvironmentConfig } from "../HIR/Environment";

export type ExternalFunction = {
  /**
   * Source for the imported module that exports the `importSpecifierName` functions
   */
  source: string;
  /**
   * Unique name for the feature flag test condition, eg `isForgetEnabled_ProjectName`
   */
  importSpecifierName: string;
};

export type InstrumentForgetOptions = {
  gating: ExternalFunction;
  instrumentFn: ExternalFunction;
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
  gating: ExternalFunction | null;
  /**
   * Enables instrumentation codegen. This emits a dev-mode only call to an
   * instrumentation function, for components and hooks that Forget compiles.
   * For example:
   *  instrumentForget: {
   *    source: 'react-forget-runtime',
   *    importSpecifierName: 'useRenderCounter',
   *  }
   *
   * produces:
   *  import {useRenderCounter} from 'react-forget-runtime-pokes';
   *
   *  function Component(props) {
   *    if (__DEV__) {
   *       useRenderCounter();
   *    }
   *    // ...
   *  }
   *
   */
  instrumentForget: ExternalFunction | null;

  panicOnBailout: boolean;

  isDev: boolean;

  /**
   * When enabled, Forget will continue statically analyzing and linting code, but skip over codegen
   * passes.
   *
   * Defaults to false
   */
  noEmit: boolean;
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
  instrumentForget: null,
  noEmit: false,
} as const;

export function parsePluginOptions(obj: unknown): PluginOptions {
  if (obj == null || typeof obj !== "object") {
    return defaultOptions;
  }
  let parsedOptions: Partial<PluginOptions> = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    if (isCompilerFlag(key)) {
      parsedOptions[key] = value;
    }
  }
  return { ...defaultOptions, ...parsedOptions };
}

function isCompilerFlag(s: string): s is keyof typeof defaultOptions {
  return Object.prototype.hasOwnProperty.call(defaultOptions, s);
}
