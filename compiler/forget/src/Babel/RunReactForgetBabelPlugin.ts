/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as BabelCore from "@babel/core";
import { transformFromAstSync } from "@babel/core";
import * as parser from "@babel/parser";
import invariant from "invariant";
import prettier from "prettier";
import ReactForgetBabelPlugin from "./BabelPlugin";
import type { PluginOptions } from "../CompilerOptions";

type ReactForgetBabelPluginResult = {
  ast: BabelCore.BabelFileResult["ast"];
  code: string;
  map: BabelCore.BabelFileResult["map"];
};

export function runReactForgetBabelPlugin(
  text: string,

  file: string,
  language: "flow" | "typescript",
  options: PluginOptions | null
): ReactForgetBabelPluginResult {
  const ast = parser.parse(text, {
    sourceFilename: file,
    plugins: ["jsx", language],
    sourceType: "module",
  });
  const result = transformFromAstSync(ast, text, {
    filename: file,
    highlightCode: false,
    retainLines: true,
    plugins: [
      [ReactForgetBabelPlugin, options],
      "babel-plugin-fbt",
      "babel-plugin-fbt-runtime",
    ],
    sourceType: "module",
  });
  invariant(
    result?.code != null,
    `Expected BabelPluginReactForget to codegen successfully, got: ${result}`
  );
  return {
    ast: result.ast,
    code: prettier.format(result.code, {
      semi: true,
      parser: language === "typescript" ? "babel-ts" : "flow",
    }),
    map: result.map,
  };
}
