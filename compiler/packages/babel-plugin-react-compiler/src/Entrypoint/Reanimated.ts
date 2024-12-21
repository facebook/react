import type * as BabelCore from '@babel/core';
import {hasOwnProperty} from '../Utils/utils';
import {PluginOptions} from './Options';

function hasModule(name: string): boolean {
  try {
    return !!require.resolve(name);
  } catch (error: any) {
    if (
      error.code === 'MODULE_NOT_FOUND' &&
      error.message.indexOf(name) !== -1
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * Tries to detect if reanimated is installed by first looking for the presence of the babel plugin.
 * However, babel-preset-expo includes it by default so it is occasionally ommitted. If so, we do
 * a check to see if `react-native-animated` is requireable.
 *
 * See https://github.com/expo/expo/blob/e4b8d86442482c7316365a6b7ec1141eec73409d/packages/babel-preset-expo/src/index.ts#L300-L301
 */
export function pipelineUsesReanimatedPlugin(
  plugins: Array<BabelCore.PluginItem> | null | undefined,
): boolean {
  if (Array.isArray(plugins)) {
    for (const plugin of plugins) {
      if (hasOwnProperty(plugin, 'key')) {
        const key = (plugin as any).key; // already checked
        if (
          typeof key === 'string' &&
          key.indexOf('react-native-reanimated') !== -1
        ) {
          return true;
        }
      }
    }
  }
  return hasModule('react-native-reanimated');
}

export function injectReanimatedFlag(options: PluginOptions): PluginOptions {
  return {
    ...options,
    environment: {
      ...options.environment,
      enableCustomTypeDefinitionForReanimated: true,
    },
  };
}
