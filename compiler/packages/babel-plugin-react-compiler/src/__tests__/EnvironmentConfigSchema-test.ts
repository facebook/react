/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, validateEnvironmentConfig} from '..';

describe('validateEnvironmentConfig()', () => {
  it('should throw a CompilerError for unknown properties', () => {
    const invalidConfig = {
      unknownProperty: true,
    };

    expect(() => {
      // @ts-expect-error - This is to simulate the usage outside of the package when the types are not available or if used with javascript.
      validateEnvironmentConfig(invalidConfig);
    }).toThrow(CompilerError);
  });

  it('should parse valid config without errors', () => {
    const validConfig = {
      customHooks: new Map(),
      moduleTypeProvider: null,
      customMacros: null,
      enableResetCacheOnSourceFileChanges: false,
      enablePreserveExistingMemoizationGuarantees: false,
      validatePreserveExistingMemoizationGuarantees: true,
      enablePreserveExistingManualUseMemo: false,
      enableForest: false,
      enableUseTypeAnnotations: false,
    };

    expect(() => {
      validateEnvironmentConfig(validConfig);
    }).not.toThrow();
  });
});
