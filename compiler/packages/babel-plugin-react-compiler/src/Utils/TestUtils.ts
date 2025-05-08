/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fromZodError} from 'zod-validation-error';
import {CompilerError} from '../CompilerError';
import {
  CompilationMode,
  defaultOptions,
  parsePluginOptions,
  PluginOptions,
} from '../Entrypoint';
import {EnvironmentConfig} from '..';
import {
  EnvironmentConfigSchema,
  PartialEnvironmentConfig,
} from '../HIR/Environment';
import {Err, Ok, Result} from './Result';
import {hasOwnProperty} from './utils';

function tryParseTestPragmaValue(val: string): Result<unknown, unknown> {
  try {
    let parsedVal: unknown;
    const stringMatch = /^"([^"]*)"$/.exec(val);
    if (stringMatch && stringMatch.length > 1) {
      parsedVal = stringMatch[1];
    } else {
      parsedVal = JSON.parse(val);
    }
    return Ok(parsedVal);
  } catch (e) {
    return Err(e);
  }
}

const testComplexConfigDefaults: PartialEnvironmentConfig = {
  validateNoCapitalizedCalls: [],
  enableChangeDetectionForDebugging: {
    source: 'react-compiler-runtime',
    importSpecifierName: '$structuralCheck',
  },
  enableEmitFreeze: {
    source: 'react-compiler-runtime',
    importSpecifierName: 'makeReadOnly',
  },
  enableEmitInstrumentForget: {
    fn: {
      source: 'react-compiler-runtime',
      importSpecifierName: 'useRenderCounter',
    },
    gating: {
      source: 'react-compiler-runtime',
      importSpecifierName: 'shouldInstrument',
    },
    globalGating: 'DEV',
  },
  enableEmitHookGuards: {
    source: 'react-compiler-runtime',
    importSpecifierName: '$dispatcherGuard',
  },
  inlineJsxTransform: {
    elementSymbol: 'react.transitional.element',
    globalDevVar: 'DEV',
  },
  lowerContextAccess: {
    source: 'react-compiler-runtime',
    importSpecifierName: 'useContext_withSelector',
  },
  inferEffectDependencies: [
    {
      function: {
        source: 'react',
        importSpecifierName: 'useEffect',
      },
      numRequiredArgs: 1,
    },
    {
      function: {
        source: 'shared-runtime',
        importSpecifierName: 'useSpecialEffect',
      },
      numRequiredArgs: 2,
    },
    {
      function: {
        source: 'useEffectWrapper',
        importSpecifierName: 'default',
      },
      numRequiredArgs: 1,
    },
  ],
};
/**
 * For snap test fixtures and playground only.
 */
function parseConfigPragmaEnvironmentForTest(
  pragma: string,
): EnvironmentConfig {
  const maybeConfig: Partial<Record<keyof EnvironmentConfig, unknown>> = {};

  for (const token of pragma.split(' ')) {
    if (!token.startsWith('@')) {
      continue;
    }
    const keyVal = token.slice(1);
    const valIdx = keyVal.indexOf(':');
    const key = valIdx === -1 ? keyVal : keyVal.slice(0, valIdx);
    const val = valIdx === -1 ? undefined : keyVal.slice(valIdx + 1);
    const isSet = val === undefined || val === 'true';
    if (!hasOwnProperty(EnvironmentConfigSchema.shape, key)) {
      continue;
    }

    if (isSet && key in testComplexConfigDefaults) {
      maybeConfig[key] = testComplexConfigDefaults[key];
    } else if (isSet) {
      maybeConfig[key] = true;
    } else if (val === 'false') {
      maybeConfig[key] = false;
    } else if (val) {
      const parsedVal = tryParseTestPragmaValue(val).unwrap();
      if (key === 'customMacros' && typeof parsedVal === 'string') {
        const valSplit = parsedVal.split('.');
        const props = [];
        for (const elt of valSplit.slice(1)) {
          if (elt === '*') {
            props.push({type: 'wildcard'});
          } else if (elt.length > 0) {
            props.push({type: 'name', name: elt});
          }
        }
        maybeConfig[key] = [[valSplit[0], props]];
        continue;
      }
      maybeConfig[key] = parsedVal;
    }
  }
  const config = EnvironmentConfigSchema.safeParse(maybeConfig);
  if (config.success) {
    /**
     * Unless explicitly enabled, do not insert HMR handling code
     * in test fixtures or playground to reduce visual noise.
     */
    if (config.data.enableResetCacheOnSourceFileChanges == null) {
      config.data.enableResetCacheOnSourceFileChanges = false;
    }
    return config.data;
  }
  CompilerError.invariant(false, {
    reason: 'Internal error, could not parse config from pragma string',
    description: `${fromZodError(config.error)}`,
    loc: null,
    suggestions: null,
  });
}

const testComplexPluginOptionDefaults: Partial<PluginOptions> = {
  gating: {
    source: 'ReactForgetFeatureFlag',
    importSpecifierName: 'isForgetEnabled_Fixtures',
  },
};
export function parseConfigPragmaForTests(
  pragma: string,
  defaults: {
    compilationMode: CompilationMode;
  },
): PluginOptions {
  const environment = parseConfigPragmaEnvironmentForTest(pragma);
  const options: Record<keyof PluginOptions, unknown> = {
    ...defaultOptions,
    panicThreshold: 'all_errors',
    compilationMode: defaults.compilationMode,
    environment,
  };
  for (const token of pragma.split(' ')) {
    if (!token.startsWith('@')) {
      continue;
    }
    const keyVal = token.slice(1);
    const idx = keyVal.indexOf(':');
    const key = idx === -1 ? keyVal : keyVal.slice(0, idx);
    const val = idx === -1 ? undefined : keyVal.slice(idx + 1);
    if (!hasOwnProperty(defaultOptions, key)) {
      continue;
    }
    const isSet = val === undefined || val === 'true';
    if (isSet && key in testComplexPluginOptionDefaults) {
      options[key] = testComplexPluginOptionDefaults[key];
    } else if (isSet) {
      options[key] = true;
    } else if (val === 'false') {
      options[key] = false;
    } else if (val != null) {
      const parsedVal = tryParseTestPragmaValue(val).unwrap();
      if (key === 'target' && parsedVal === 'donotuse_meta_internal') {
        options[key] = {
          kind: parsedVal,
          runtimeModule: 'react',
        };
      } else {
        options[key] = parsedVal;
      }
    }
  }
  return parsePluginOptions(options);
}
