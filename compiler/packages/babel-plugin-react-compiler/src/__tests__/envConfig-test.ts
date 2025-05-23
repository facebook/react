/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Effect, validateEnvironmentConfig} from '..';
import {ValueKind} from '../HIR';

describe('parseConfigPragma()', () => {
  it('passing null throws', () => {
    expect(() => validateEnvironmentConfig(null as any)).toThrow();
  });

  // tests that the error message remains useful
  it('passing incorrect value throws', () => {
    expect(() => {
      validateEnvironmentConfig({
        validateHooksUsage: 1,
      } as any);
    }).toThrowErrorMatchingInlineSnapshot(
      `"InvalidConfig: Could not validate environment config. Update React Compiler config to fix the error. Validation error: Expected boolean, received number at "validateHooksUsage""`,
    );
  });

  it('effect autodeps config must have at least 1 required argument', () => {
    expect(() => {
      validateEnvironmentConfig({
        inferEffectDependencies: [
          {
            function: {
              source: 'react',
              importSpecifierName: 'useEffect',
            },
            numRequiredArgs: 0,
          },
        ],
      } as any);
    }).toThrowErrorMatchingInlineSnapshot(
      `"InvalidConfig: Could not validate environment config. Update React Compiler config to fix the error. Validation error: numRequiredArgs must be > 0 at "inferEffectDependencies[0].numRequiredArgs""`,
    );
  });

  it('can parse stringy enums', () => {
    const stringyHook = {
      effectKind: 'freeze',
      valueKind: 'frozen',
    };
    const env = {
      customHooks: new Map([['useFoo', stringyHook]]),
    };
    const validatedEnv = validateEnvironmentConfig(env as any);
    const validatedHook = validatedEnv.customHooks.get('useFoo');
    expect(validatedHook?.effectKind).toBe(Effect.Freeze);
    expect(validatedHook?.valueKind).toBe(ValueKind.Frozen);
  });
});
