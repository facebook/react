/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {parseConfigPragma, validateEnvironmentConfig} from '..';

describe('parseConfigPragma()', () => {
  it('parses flags in various forms', () => {
    const defaultConfig = validateEnvironmentConfig({});

    // Validate defaults first to make sure that the parser is getting the value from the pragma,
    // and not just missing it and getting the default value
    expect(defaultConfig.enableUseTypeAnnotations).toBe(false);
    expect(defaultConfig.validateNoSetStateInPassiveEffects).toBe(false);
    expect(defaultConfig.validateNoSetStateInRender).toBe(true);

    const config = parseConfigPragma(
      '@enableUseTypeAnnotations @validateNoSetStateInPassiveEffects:true @validateNoSetStateInRender:false',
    );
    expect(config).toEqual({
      ...defaultConfig,
      enableUseTypeAnnotations: true,
      validateNoSetStateInPassiveEffects: true,
      validateNoSetStateInRender: false,
    });
  });
});
