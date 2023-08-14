import type { runReactForgetBabelPlugin as RunReactForgetBabelPlugin } from "babel-plugin-react-forget/src/Babel/RunReactForgetBabelPlugin";
import {
  COMPILER_PATH,
  parseLanguage,
  TestFixture,
  transformFixtureInput,
} from "fixture-test-utils";
import { transformFromAstSync } from "@babel/core";
import fs from "fs/promises";
import * as parser from "@babel/parser";
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

function transformFixtureForget(
  input: string,
  basename: string
): TransformResult {
  try {
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

    // missing more transforms
    const transformResult = transformFromAstSync(
      forgetResult.ast,
      forgetResult.code,
      {
        presets: [
          ["@babel/preset-react", { throwIfNamespace: false }],
          {
            plugins: ["@babel/plugin-transform-modules-commonjs"],
          },
        ],
      }
    );

    const code = transformResult?.code;
    if (code == null) {
      return {
        type: "UnexpectedError",
        value: `Expected custom transform to codegen successfully, got: ${transformResult}`,
      };
    }
    return {
      type: "Ok",
      value: code,
    };
  } catch (e) {
    return {
      type: "UnexpectedError",
      value: e.message,
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

    const transformResult = transformFromAstSync(ast, input, {
      presets: [
        {
          plugins: ["@babel/plugin-syntax-jsx"],
        },
        ["@babel/preset-react", { throwIfNamespace: false }],
        {
          plugins: ["@babel/plugin-transform-modules-commonjs"],
        },
      ],
    });

    const code = transformResult?.code;
    if (code == null) {
      return {
        type: "UnexpectedError",
        value: `Expected custom transform to codegen successfully, got: ${transformResult}`,
      };
    }
    return {
      type: "Ok",
      value: code,
    };
  } catch (e) {
    return {
      type: "UnexpectedError",
      value: e.message,
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
