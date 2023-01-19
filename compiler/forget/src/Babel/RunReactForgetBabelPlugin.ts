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
  file: string
): ReactForgetBabelPluginResult {
  const ast = parser.parse(text, {
    sourceFilename: file,
    plugins: ["typescript", "jsx"],
  });
  const result = transformFromAstSync(ast, text, {
    filename: file,
    highlightCode: false,
    retainLines: true,
    plugins: [ReactForgetBabelPlugin],
  });
  invariant(
    result?.code != null,
    `Expected BabelPluginReactForget to codegen successfully, got: ${result}`
  );
  return {
    ast: result.ast,
    code: prettier.format(result.code, {
      semi: true,
      parser: "babel-ts",
    }),
    map: result.map,
  };
}
