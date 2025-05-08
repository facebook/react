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
  PanicThresholdOptions,
  parsePluginOptions,
  PluginOptions,
} from '../Entrypoint';
import {EnvironmentConfig} from '..';
import {
  EnvironmentConfigSchema,
  PartialEnvironmentConfig,
} from '../HIR/Environment';

/**
 * For test fixtures and playground only.
 *
 * Pragmas are straightforward to parse for boolean options (`:true` and
 * `:false`). These are 'enabled' config values for non-boolean configs (i.e.
 * what is used when parsing `:true`).
 */
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
  const maybeConfig: any = {};
  // Get the defaults to programmatically check for boolean properties
  const defaultConfig = EnvironmentConfigSchema.parse({});

  for (const token of pragma.split(' ')) {
    if (!token.startsWith('@')) {
      continue;
    }
    const keyVal = token.slice(1);
    let [key, val = undefined] = keyVal.split(':');
    const isSet = val === undefined || val === 'true';

    if (isSet && key in testComplexConfigDefaults) {
      maybeConfig[key] =
        testComplexConfigDefaults[key as keyof PartialEnvironmentConfig];
      continue;
    }

    if (key === 'customMacros' && val) {
      const valSplit = val.split('.');
      if (valSplit.length > 0) {
        const props = [];
        for (const elt of valSplit.slice(1)) {
          if (elt === '*') {
            props.push({type: 'wildcard'});
          } else if (elt.length > 0) {
            props.push({type: 'name', name: elt});
          }
        }
        maybeConfig[key] = [[valSplit[0], props]];
      }
      continue;
    }

    if (
      key !== 'enableResetCacheOnSourceFileChanges' &&
      typeof defaultConfig[key as keyof EnvironmentConfig] !== 'boolean'
    ) {
      // skip parsing non-boolean properties
      continue;
    }
    if (val === undefined || val === 'true') {
      maybeConfig[key] = true;
    } else {
      maybeConfig[key] = false;
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
export function parseConfigPragmaForTests(
  pragma: string,
  defaults: {
    compilationMode: CompilationMode;
  },
): PluginOptions {
  const environment = parseConfigPragmaEnvironmentForTest(pragma);
  let compilationMode: CompilationMode = defaults.compilationMode;
  let panicThreshold: PanicThresholdOptions = 'all_errors';
  let noEmit: boolean = defaultOptions.noEmit;
  for (const token of pragma.split(' ')) {
    if (!token.startsWith('@')) {
      continue;
    }
    switch (token) {
      case '@compilationMode(annotation)': {
        compilationMode = 'annotation';
        break;
      }
      case '@compilationMode(infer)': {
        compilationMode = 'infer';
        break;
      }
      case '@compilationMode(all)': {
        compilationMode = 'all';
        break;
      }
      case '@compilationMode(syntax)': {
        compilationMode = 'syntax';
        break;
      }
      case '@panicThreshold(none)': {
        panicThreshold = 'none';
        break;
      }
      case '@noEmit': {
        noEmit = true;
        break;
      }
    }
  }
  return parsePluginOptions({
    environment,
    compilationMode,
    panicThreshold,
    noEmit,
  });
}
