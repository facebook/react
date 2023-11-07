/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { parseConfigPragma, validateEnvironmentConfig } from "..";

describe("parseConfigPragma()", () => {
  it("parses flags in various forms", () => {
    const defaultConfig = validateEnvironmentConfig({});

    // Validate defaults first to make sure that the parser is getting the value from the pragma,
    // and not just missing it and getting the default value
    expect(defaultConfig.enableForest).toBe(false);
    expect(defaultConfig.validateFrozenLambdas).toBe(false);
    expect(defaultConfig.memoizeJsxElements).toBe(true);

    const config = parseConfigPragma(
      "@enableForest @validateFrozenLambdas:true @memoizeJsxElements:false"
    );
    expect(config).toEqual({
      ...defaultConfig,
      enableForest: true,
      validateFrozenLambdas: true,
      memoizeJsxElements: false,
    });
  });
});
