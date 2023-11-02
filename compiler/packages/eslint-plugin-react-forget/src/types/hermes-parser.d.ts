/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// v0.12.1
declare module "hermes-parser" {
  type HermesParserOptions = {
    babel: boolean;
    allowReturnOutsideFunction: boolean;
    flow: "all" | "detect";
    sourceFilename: string | null;
    sourceType: "module" | "script" | "unambiguous";
    tokens: boolean;
  };
  export function parse(code: string, options: Partial<HermesParserOptions>);
}
