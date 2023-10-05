/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DEFAULT_ENVIRONMENT_CONFIG, parseConfigPragma } from "..";

describe("parseConfigPragma()", () => {
  it("parses flags in various forms", () => {
    const config = parseConfigPragma(
      "@enableForest @validateFrozenLambdas:true @memoizeJsxElements:false"
    );
    // Validate defaults first to make sure that the parser is getting the value from the pragma,
    // and not just missing it and getting the default value
    expect(DEFAULT_ENVIRONMENT_CONFIG.enableForest).toBe(false);
    expect(DEFAULT_ENVIRONMENT_CONFIG.validateFrozenLambdas).toBe(false);
    expect(DEFAULT_ENVIRONMENT_CONFIG.memoizeJsxElements).toBe(true);

    expect(config).toEqual({
      ...DEFAULT_ENVIRONMENT_CONFIG,
      enableForest: true,
      validateFrozenLambdas: true,
      memoizeJsxElements: false,
    });
  });
});
