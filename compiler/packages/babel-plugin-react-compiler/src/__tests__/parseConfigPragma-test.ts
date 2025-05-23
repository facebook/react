/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {parseConfigPragmaForTests, validateEnvironmentConfig} from '..';
import {defaultOptions} from '../Entrypoint';

describe('parseConfigPragmaForTests()', () => {
  it('parses flags in various forms', () => {
    const defaultConfig = validateEnvironmentConfig({});

    // Validate defaults first to make sure that the parser is getting the value from the pragma,
    // and not just missing it and getting the default value
    expect(defaultConfig.enableUseTypeAnnotations).toBe(false);
    expect(defaultConfig.validateNoSetStateInPassiveEffects).toBe(false);
    expect(defaultConfig.validateNoSetStateInRender).toBe(true);

    const config = parseConfigPragmaForTests(
      '@enableUseTypeAnnotations @validateNoSetStateInPassiveEffects:true @validateNoSetStateInRender:false',
      {compilationMode: defaultOptions.compilationMode},
    );
    expect(config).toEqual({
      ...defaultOptions,
      panicThreshold: 'all_errors',
      environment: {
        ...defaultOptions.environment,
        enableUseTypeAnnotations: true,
        validateNoSetStateInPassiveEffects: true,
        validateNoSetStateInRender: false,
        enableResetCacheOnSourceFileChanges: false,
      },
    });
  });
});
