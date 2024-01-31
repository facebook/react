/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import assert from "assert";
import type { runReactForgetBabelPlugin as RunReactForgetBabelPlugin } from "babel-plugin-react-forget/src/Babel/RunReactForgetBabelPlugin";
import {
  CompilationMode,
  PanicThresholdOptions,
} from "babel-plugin-react-forget/src/Entrypoint";
import type { Effect, ValueKind } from "babel-plugin-react-forget/src/HIR";
import type { parseConfigPragma as ParseConfigPragma } from "babel-plugin-react-forget/src/HIR/Environment";
import prettier from "prettier";

export function parseLanguage(source: string): "flow" | "typescript" {
  return source.indexOf("@flow") !== -1 ? "flow" : "typescript";
}

export function transformFixtureInput(
  input: string,
  basename: string,
  pluginFn: typeof RunReactForgetBabelPlugin,
  parseConfigPragmaFn: typeof ParseConfigPragma,
  includeAst: boolean = false
) {
  // Extract the first line to quickly check for custom test directives
  const firstLine = input.substring(0, input.indexOf("\n"));

  let language = parseLanguage(firstLine);
  let gating = null;
  let enableEmitInstrumentForget = null;
  let enableEmitFreeze = null;
  let enableEmitHookGuards = null;
  let compilationMode: CompilationMode = "all";
  let enableUseMemoCachePolyfill = false;
  let panicThreshold: PanicThresholdOptions = "ALL_ERRORS";
  let hookPattern: string | null = null;

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
      source: "react-forget-runtime",
      importSpecifierName: "useRenderCounter",
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
  if (firstLine.includes("@enableUseMemoCachePolyfill")) {
    enableUseMemoCachePolyfill = true;
  }
  if (firstLine.includes("@panicThreshold(NONE)")) {
    panicThreshold = "NONE";
  }

  let eslintSuppressionRules: Array<string> | null = null;
  const eslintSuppressionMatch = /@eslintSuppressionRules\(([^)]+)\)/.exec(
    firstLine
  );
  if (eslintSuppressionMatch != null) {
    eslintSuppressionRules = eslintSuppressionMatch[1].split("|");
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
  const result = pluginFn(
    input,
    basename,
    language,
    {
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
      },
      compilationMode,
      logger: null,
      gating,
      panicThreshold,
      noEmit: false,
      enableUseMemoCachePolyfill,
      eslintSuppressionRules,
    },
    includeAst
  );

  return {
    ...result,
    code:
      result.code != null
        ? prettier.format(result.code, {
            semi: true,
            parser: language === "typescript" ? "babel-ts" : "flow",
          })
        : result.code,
  };
}
