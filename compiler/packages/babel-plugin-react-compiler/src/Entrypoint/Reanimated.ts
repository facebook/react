import type * as BabelCore from "@babel/core";
import { hasOwnProperty } from "../Utils/utils";
import { PluginOptions } from "./Options";

export function pipelineUsesReanimatedPlugin(
  plugins: Array<BabelCore.PluginItem> | null | undefined
): boolean {
  let hasReanimated = false;
  if (Array.isArray(plugins)) {
    for (const plugin of plugins) {
      if (hasOwnProperty(plugin, "key")) {
        const key = (plugin as any).key; // already checked
        if (
          typeof key === "string" &&
          key.indexOf("react-native-reanimated") !== -1
        ) {
          hasReanimated = true;
          break;
        }
      }
    }
  }
  return hasReanimated;
}

export function injectReanimatedFlag(options: PluginOptions): PluginOptions {
  return {
    ...options,
    environment: {
      ...options.environment,
      enableCustomTypeDefinitionForReAnimated: true,
    },
  };
}
