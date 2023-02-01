import type * as BabelCore from "@babel/core";
import { transformFromAstSync } from "@babel/core";
import * as parser from "@babel/parser";
import invariant from "invariant";
import prettier from "prettier";
import ReactForgetBabelPlugin from "./BabelPlugin";

type ReactForgetBabelPluginResult = {
  ast: BabelCore.BabelFileResult["ast"];
  code: string;
  map: BabelCore.BabelFileResult["map"];
};

export default function runReactForgetBabelPlugin(
  text: string,
  file: string,
  language: "flow" | "typescript"
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
    plugins: [ReactForgetBabelPlugin],
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
