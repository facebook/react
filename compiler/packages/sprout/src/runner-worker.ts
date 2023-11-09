/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath, PluginItem, transformFromAstSync } from "@babel/core";
import * as parser from "@babel/parser";
import * as t from "@babel/types";
import type { runReactForgetBabelPlugin as RunReactForgetBabelPlugin } from "babel-plugin-react-forget/src/Babel/RunReactForgetBabelPlugin";
import type { parseConfigPragma as ParseConfigPragma } from "babel-plugin-react-forget/src/HIR/Environment";
import {
  COMPILER_PATH,
  PARSE_CONFIG_PRAGMA_PATH,
  TestFixture,
  parseLanguage,
  transformFixtureInput,
} from "fixture-test-utils";
import fs from "fs/promises";
import path from "path";
import { EvaluatorResult, doEval } from "./runner-evaluator";

const { runReactForgetBabelPlugin } = require(COMPILER_PATH) as {
  runReactForgetBabelPlugin: typeof RunReactForgetBabelPlugin;
};

const { parseConfigPragma } = require(PARSE_CONFIG_PRAGMA_PATH) as {
  parseConfigPragma: typeof ParseConfigPragma;
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

// Transforms that should run on both forget and non-forget
// source code.
function transformAST(
  ast: t.File,
  sourceCode: string,
  filename: string,
  language: "typescript" | "flow",
  transformJSX: boolean
): string {
  const presets: Array<PluginItem> = [
    {
      plugins: ["babel-plugin-fbt", "babel-plugin-fbt-runtime"],
    },
  ];
  presets.push(
    language === "typescript"
      ? [
          "@babel/preset-typescript",
          {
            /**
             * onlyRemoveTypeImports needs to be set as fbt imports
             * would otherwise be removed by this pass.
             * https://github.com/facebook/fbt/issues/49
             * https://github.com/facebook/sfbt/issues/72
             * https://dev.to/retyui/how-to-add-support-typescript-for-fbt-an-internationalization-framework-3lo0
             */
            onlyRemoveTypeImports: true,
          },
        ]
      : "@babel/preset-flow"
  );

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
  filename: string
): TransformResult {
  try {
    const language = parseLanguage(input.split("\n", 1)[0]);

    const forgetResult = transformFixtureInput(
      input,
      filename,
      runReactForgetBabelPlugin,
      parseConfigPragma,
      true
    );

    if (forgetResult.ast == null) {
      return {
        type: "UnexpectedError",
        value: "Unexpected - no babel ast",
      };
    }

    if (forgetResult.code == null) {
      return {
        type: "UnexpectedError",
        value: "Unexpected - no code emitted",
      };
    }

    const code = transformAST(
      forgetResult.ast,
      forgetResult.code,
      filename,
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
  filename: string
): TransformResult {
  try {
    const language = parseLanguage(input.split("\n", 1)[0]);
    const ast = parser.parse(input, {
      sourceFilename: filename,
      plugins: ["jsx", language],
      sourceType: "module",
    });

    const code = transformAST(ast, input, filename, language, true);
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
  const { inputPath } = fixture;
  if (inputPath == null) {
    return {
      nonForgetResult: null,
      forgetResult: null,
      unexpectedError: "No input for fixture " + fixture.outputPath,
    };
  }
  const inputRaw = await fs.readFile(inputPath, "utf8");
  // We need to include the file extension as it determines typescript
  // babel plugin's mode (e.g. stripping types, parsing rules for brackets)
  const filename = path.basename(inputPath);
  const forgetCode = transformFixtureForget(inputRaw, filename);
  const noForgetCode = transformFixtureNoForget(inputRaw, filename);
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
