/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type * as BabelCore from "@babel/core";
import { transformFromAstSync } from "@babel/core";

import * as BabelParser from "@babel/parser";
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import assert from "assert";
import type {
  CompilationMode,
  PanicThresholdOptions,
  PluginOptions,
} from "babel-plugin-react-forget/src/Entrypoint";
import type { Effect, ValueKind } from "babel-plugin-react-forget/src/HIR";
import type { parseConfigPragma as ParseConfigPragma } from "babel-plugin-react-forget/src/HIR/Environment";
import * as HermesParser from "hermes-parser";
import invariant from "invariant";
import path from "path";
import prettier from "prettier";
import SproutTodoFilter from "./SproutTodoFilter";
import { isExpectError } from "./fixture-utils";
export function parseLanguage(source: string): "flow" | "typescript" {
  return source.indexOf("@flow") !== -1 ? "flow" : "typescript";
}

function makePluginOptions(
  firstLine: string,
  parseConfigPragmaFn: typeof ParseConfigPragma
): PluginOptions {
  let gating = null;
  let enableEmitInstrumentForget = null;
  let enableEmitFreeze = null;
  let enableEmitHookGuards = null;
  let compilationMode: CompilationMode = "all";
  // TODO make this `null` to use the default runtime module, needs an upgrade to React 19
  let runtimeModule = "react";
  let panicThreshold: PanicThresholdOptions = "all_errors";
  let hookPattern: string | null = null;
  // TODO(@mofeiZ) rewrite snap fixtures to @validatePreserveExistingMemo:false
  let validatePreserveExistingMemoizationGuarantees = false;

  if (firstLine.indexOf("@compilationMode(annotation)") !== -1) {
    assert(
      compilationMode === "all",
      "Cannot set @compilationMode(..) more than once"
    );
    compilationMode = "annotation";
  }
  if (firstLine.indexOf("@compilationMode(infer)") !== -1) {
    assert(
      compilationMode === "all",
      "Cannot set @compilationMode(..) more than once"
    );
    compilationMode = "infer";
  }

  if (firstLine.includes("@gating")) {
    gating = {
      source: "ReactForgetFeatureFlag",
      importSpecifierName: "isForgetEnabled_Fixtures",
    };
  }
  if (firstLine.includes("@instrumentForget")) {
    enableEmitInstrumentForget = {
      fn: {
        source: "react-forget-runtime",
        importSpecifierName: "useRenderCounter",
      },
      gating: {
        source: "react-forget-runtime",
        importSpecifierName: "shouldInstrument",
      },
      globalGating: "__DEV__",
    };
  }
  if (firstLine.includes("@enableEmitFreeze")) {
    enableEmitFreeze = {
      source: "react-forget-runtime",
      importSpecifierName: "makeReadOnly",
    };
  }
  if (firstLine.includes("@enableEmitHookGuards")) {
    enableEmitHookGuards = {
      source: "react-forget-runtime",
      importSpecifierName: "$dispatcherGuard",
    };
  }
  const runtimeModuleMatch = /@runtimeModule="([^"]+)"/.exec(firstLine);
  if (runtimeModuleMatch) {
    runtimeModule = runtimeModuleMatch[1];
  }
  if (firstLine.includes("@panicThreshold(none)")) {
    panicThreshold = "none";
  }

  let eslintSuppressionRules: Array<string> | null = null;
  const eslintSuppressionMatch = /@eslintSuppressionRules\(([^)]+)\)/.exec(
    firstLine
  );
  if (eslintSuppressionMatch != null) {
    eslintSuppressionRules = eslintSuppressionMatch[1].split("|");
  }

  let flowSuppressions: boolean = false;
  if (firstLine.includes("@enableFlowSuppressions")) {
    flowSuppressions = true;
  }

  let ignoreUseNoForget: boolean = false;
  if (firstLine.includes("@ignoreUseNoForget")) {
    ignoreUseNoForget = true;
  }

  if (firstLine.includes("@validatePreserveExistingMemoizationGuarantees")) {
    validatePreserveExistingMemoizationGuarantees = true;
  }

  const hookPatternMatch = /@hookPattern:"([^"]+)"/.exec(firstLine);
  if (
    hookPatternMatch &&
    hookPatternMatch.length > 1 &&
    hookPatternMatch[1].trim().length > 0
  ) {
    hookPattern = hookPatternMatch[1].trim();
  } else if (firstLine.includes("@hookPattern")) {
    throw new Error(
      'Invalid @hookPattern:"..." pragma, must contain the prefix between balanced double quotes eg @hookPattern:"pattern"'
    );
  }

  const config = parseConfigPragmaFn(firstLine);
  return {
    environment: {
      ...config,
      customHooks: new Map([
        [
          "useFreeze",
          {
            valueKind: "frozen" as ValueKind,
            effectKind: "freeze" as Effect,
            transitiveMixedData: false,
            noAlias: false,
          },
        ],
        [
          "useFragment",
          {
            valueKind: "frozen" as ValueKind,
            effectKind: "freeze" as Effect,
            transitiveMixedData: true,
            noAlias: true,
          },
        ],
        [
          "useNoAlias",
          {
            valueKind: "mutable" as ValueKind,
            effectKind: "read" as Effect,
            transitiveMixedData: false,
            noAlias: true,
          },
        ],
      ]),
      enableEmitFreeze,
      enableEmitInstrumentForget,
      enableEmitHookGuards,
      assertValidMutableRanges: true,
      hookPattern,
      validatePreserveExistingMemoizationGuarantees,
    },
    compilationMode,
    logger: null,
    gating,
    panicThreshold,
    noEmit: false,
    runtimeModule,
    eslintSuppressionRules,
    flowSuppressions,
    ignoreUseNoForget,
  };
}

export function parseInput(
  input: string,
  filename: string,
  language: "flow" | "typescript"
): BabelCore.types.File {
  // Extract the first line to quickly check for custom test directives
  if (language === "flow") {
    return HermesParser.parse(input, {
      babel: true,
      flow: "all",
      sourceFilename: filename,
      sourceType: "module",
      enableExperimentalComponentSyntax: true,
    });
  } else {
    return BabelParser.parse(input, {
      sourceFilename: filename,
      plugins: ["typescript", "jsx"],
      sourceType: "module",
    });
  }
}

function getEvaluatorPresets(
  language: "typescript" | "flow"
): Array<BabelCore.PluginItem> {
  const presets: Array<BabelCore.PluginItem> = [
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

  presets.push({
    plugins: ["@babel/plugin-syntax-jsx"],
  });
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
                    // rewrite to use relative import as eval happens in
                    // sprout/evaluator.ts
                    if (arg.value === "shared-runtime") {
                      arg.value = "./shared-runtime";
                    } else if (arg.value === "ReactForgetFeatureFlag") {
                      arg.value = "./ReactForgetFeatureFlag";
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
  return presets;
}
function format(inputCode: string, language: "typescript" | "flow"): string {
  return prettier.format(inputCode, {
    semi: true,
    parser: language === "typescript" ? "babel-ts" : "flow",
  });
}
const TypescriptEvaluatorPresets = getEvaluatorPresets("typescript");
const FlowEvaluatorPresets = getEvaluatorPresets("flow");

export type TransformResult = {
  forgetOutput: string;
  evaluatorCode: {
    original: string;
    forget: string;
  } | null;
};

export function transformFixtureInput(
  input: string,
  fixturePath: string,
  parseConfigPragmaFn: typeof ParseConfigPragma,
  plugin: BabelCore.PluginObj,
  includeEvaluator: boolean
): { kind: "ok"; value: TransformResult } | { kind: "err"; msg: string } {
  // Extract the first line to quickly check for custom test directives
  const firstLine = input.substring(0, input.indexOf("\n"));

  const language = parseLanguage(firstLine);
  // Preserve file extension as it determines typescript's babel transform
  // mode (e.g. stripping types, parsing rules for brackets)
  const filename =
    path.basename(fixturePath) + (language === "typescript" ? ".ts" : "");
  const inputAst = parseInput(input, filename, language);
  // Give babel transforms an absolute path as relative paths get prefixed
  // with `cwd`, which is different across machines
  const virtualFilepath = "/" + filename;

  const presets =
    language === "typescript"
      ? TypescriptEvaluatorPresets
      : FlowEvaluatorPresets;

  /**
   * Get Forget compiled code
   */
  const forgetResult = transformFromAstSync(inputAst, input, {
    filename: virtualFilepath,
    highlightCode: false,
    retainLines: true,
    plugins: [
      [plugin, makePluginOptions(firstLine, parseConfigPragmaFn)],
      "babel-plugin-fbt",
      "babel-plugin-fbt-runtime",
    ],
    sourceType: "module",
    ast: includeEvaluator,
    cloneInputAst: includeEvaluator,
  });
  invariant(
    forgetResult?.code != null,
    "Expected BabelPluginReactForget to codegen successfully."
  );
  const forgetOutput = forgetResult.code;
  let evaluatorCode = null;

  if (
    includeEvaluator &&
    !SproutTodoFilter.has(fixturePath) &&
    !isExpectError(filename)
  ) {
    let forgetEval: string;
    try {
      invariant(
        forgetResult?.ast != null,
        "Expected BabelPluginReactForget ast."
      );
      const result = transformFromAstSync(forgetResult.ast, forgetOutput, {
        presets,
        filename: virtualFilepath,
      });
      if (result?.code == null) {
        return {
          kind: "err",
          msg: "Unexpected error in forget transform pipeline - no code emitted",
        };
      } else {
        forgetEval = result.code;
      }
    } catch (e) {
      return {
        kind: "err",
        msg: "Unexpected error in Forget transform pipeline: " + e.message,
      };
    }

    /**
     * Get evaluator code for source (no Forget)
     */
    let originalEval: string;
    try {
      const result = transformFromAstSync(inputAst, input, {
        presets,
        filename: virtualFilepath,
      });

      if (result?.code == null) {
        return {
          kind: "err",
          msg: "Unexpected error in non-forget transform pipeline - no code emitted",
        };
      } else {
        originalEval = result.code;
      }
    } catch (e) {
      return {
        kind: "err",
        msg: "Unexpected error in non-forget transform pipeline: " + e.message,
      };
    }
    evaluatorCode = {
      forget: forgetEval,
      original: originalEval,
    };
  }
  return {
    kind: "ok",
    value: {
      forgetOutput: format(forgetOutput, language),
      evaluatorCode,
    },
  };
}
