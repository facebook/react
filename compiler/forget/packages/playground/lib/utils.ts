/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */
import type { PluginItem, TransformOptions } from "@babel/core";
import ReactForgetBabelPlugin, {
  CompilerOptions,
} from "babel-plugin-react-forget";

/**
 * Unicode-Base64 Codec.
 *
 * @see https://base64.guru/developers/javascript/examples/unicode-strings
 * @see https://github.com/vuejs/core/pull/3662/
 */
export const codec = {
  utoa(data: string): string {
    return btoa(unescape(encodeURIComponent(data)));
  },

  /**
   * @returns undefined if @base64 is not a valid Base64 string.
   */
  atou(base64: string): string {
    return decodeURIComponent(escape(atob(base64)));
  },
};

export function getBabelPlugins(
  language: string | null,
  enableForget: boolean,
  compilerOptions: Partial<CompilerOptions>
): PluginItem[] {
  const babelPlugins: PluginItem[] = ["syntax-jsx"];
  if (language === "typescript") {
    babelPlugins.push(["transform-typescript", { isTSX: true }]);
  } else if (language == "javascript") {
    babelPlugins.push("transform-flow-strip-types");
  }

  if (enableForget) {
    babelPlugins.push([ReactForgetBabelPlugin, compilerOptions]);
  }
  return babelPlugins;
}
