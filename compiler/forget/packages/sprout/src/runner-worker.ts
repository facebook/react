/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { runReactForgetBabelPlugin as RunReactForgetBabelPlugin } from "babel-plugin-react-forget/src/Babel/RunReactForgetBabelPlugin";
import {
  COMPILER_PATH,
  parseLanguage,
  TestFixture,
  transformFixtureInput,
} from "fixture-test-utils";
import { NodePath, PluginItem, transformFromAstSync } from "@babel/core";
import fs from "fs/promises";
import * as parser from "@babel/parser";
import * as t from "@babel/types";
import { doEval, EvaluatorResult } from "./runner-evaluator";

const { runReactForgetBabelPlugin } = require(COMPILER_PATH) as {
  runReactForgetBabelPlugin: typeof RunReactForgetBabelPlugin;
};

// TODO: save output in .sprout.md files
export type TestResult =
  | {
      nonForgetResult: EvaluatorResult;
      forgetResult: EvaluatorResult;
      unexpectedError: null;
    }
  | {
      nonForgetResult: null;
      forgetResult: null;
      unexpectedError: string;
    };

type TransformResult =
  | {
      type: "Ok";
      value: string;
    }
  | {
      type: "UnexpectedError";
      value: string;
    };

function transformAST(
  ast: t.File,
  sourceCode: string,
  filename: string,
  language: "typescript" | "flow",
  transformJSX: boolean
): string {
  // missing more transforms
  const presets: Array<PluginItem> = [
    language === "typescript"
      ? "@babel/preset-typescript"
      : "@babel/preset-flow",
  ];

  if (transformJSX) {
    presets.push({
      plugins: ["@babel/plugin-syntax-jsx"],
    });
  }
  presets.push(
    ["@babel/preset-react", { throwIfNamespace: false }],
    {
      plugins: ["@babel/plugin-transform-modules-commonjs"],
    },
    {
      plugins: [
        function BabelPluginRewriteRequirePath() {
          return {
            visitor: {
              CallExpression(path: NodePath<t.CallExpression>) {
                const { callee } = path.node;
                if (callee.type === "Identifier" && callee.name === "require") {
                  const arg = path.node.arguments[0];
                  if (arg.type === "StringLiteral") {
                    // rewrite to use relative import
                    if (arg.value === "shared-runtime") {
                      arg.value = "./shared-runtime";
                    }
                  }
                }
              },
            },
          };
        },
      ],
    }
  );
  const transformResult = transformFromAstSync(ast, sourceCode, {
    presets,
    filename: filename,
  });

  const code = transformResult?.code;
  if (code == null) {
    throw new Error(
      `Expected custom transform to codegen successfully, got: ${transformResult}`
    );
  }
  return code;
}
function transformFixtureForget(
  input: string,
  basename: string
): TransformResult {
  try {
    const language = parseLanguage(input.split("\n", 1)[0]);

    const forgetResult = transformFixtureInput(
      input,
      basename,
      runReactForgetBabelPlugin,
      true
    );

    if (forgetResult.ast == null) {
      return {
        type: "UnexpectedError",
        value: "Unexpected - no babel ast",
      };
    }

    const code = transformAST(
      forgetResult.ast,
      forgetResult.code,
      basename,
      language,
      false
    );
    return {
      type: "Ok",
      value: code,
    };
  } catch (e) {
    return {
      type: "UnexpectedError",
      value: "Error in Forget transform pipeline: " + e.message,
    };
  }
}

function transformFixtureNoForget(
  input: string,
  basename: string
): TransformResult {
  try {
    const language = parseLanguage(input.split("\n", 1)[0]);
    const ast = parser.parse(input, {
      sourceFilename: basename,
      plugins: ["jsx", language],
      sourceType: "module",
    });

    const code = transformAST(ast, input, basename, language, true);
    return {
      type: "Ok",
      value: code,
    };
  } catch (e) {
    return {
      type: "UnexpectedError",
      value: "Error in non-Forget transform pipeline: " + e.message,
    };
  }
}

export async function run(fixture: TestFixture): Promise<TestResult> {
  const seenConsoleErrors: Array<string> = [];
  console.error = (...messages: Array<string>) => {
    seenConsoleErrors.push(...messages);
  };
  const { inputPath, inputExists, basename } = fixture;

  if (!inputExists) {
    return {
      nonForgetResult: null,
      forgetResult: null,
      unexpectedError: "file did not exist!",
    };
  }
  const inputRaw = await fs.readFile(inputPath, "utf8");
  const forgetCode = transformFixtureForget(inputRaw, basename);
  const noForgetCode = transformFixtureNoForget(inputRaw, basename);
  if (forgetCode.type === "UnexpectedError") {
    return {
      nonForgetResult: null,
      forgetResult: null,
      unexpectedError: forgetCode.value,
    };
  }
  if (noForgetCode.type === "UnexpectedError") {
    return {
      nonForgetResult: null,
      forgetResult: null,
      unexpectedError: noForgetCode.value,
    };
  }
  const nonForgetResult = doEval(noForgetCode.value);
  const forgetResult = doEval(forgetCode.value);
  return {
    nonForgetResult,
    forgetResult,
    unexpectedError: null,
  };
}
