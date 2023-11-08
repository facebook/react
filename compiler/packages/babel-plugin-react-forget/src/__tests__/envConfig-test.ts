/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { validateEnvironmentConfig } from "..";

describe("parseConfigPragma()", () => {
  it("passing null throws", () => {
    expect(() => validateEnvironmentConfig(null as any)).toThrow();
  });

  // tests that the errror message remains useful
  it("passing incorrect value throws", () => {
    expect.assertions(1);

    try {
      validateEnvironmentConfig({
        validateHooksUsage: 1,
      } as any);
    } catch (err) {
      expect(err.message).toBe(
        '[ReactForget] InvalidConfig: Validation error: Expected boolean, received number at "validateHooksUsage". Update Forget config to fix the error'
      );
    }
  });
});
