import type { runReactForgetBabelPlugin as RunReactForgetBabelPlugin } from "babel-plugin-react-forget/src/Babel/RunReactForgetBabelPlugin";
import type { Effect, ValueKind } from "babel-plugin-react-forget/src/HIR";

const FlowPragmas = [/\/\/\s@flow$/gm, /\*\s@flow$/gm];

export function parseLanguage(source: string): "flow" | "typescript" {
  let useFlow = false;
  for (const flowPragma of FlowPragmas) {
    useFlow ||= !!source.match(flowPragma);
  }
  return useFlow ? "flow" : "typescript";
}

export function transformFixtureInput(
  input: string,
  basename: string,
  pluginFn: typeof RunReactForgetBabelPlugin,
  includeAst: boolean = false
) {
  // Extract the first line to quickly check for custom test directives
  const firstLine = input.substring(0, input.indexOf("\n"));

  let language = parseLanguage(firstLine);
  let enableOnlyOnUseForgetDirective = false;
  let gating = null;
  let instrumentForget = null;
  let panicOnBailout = true;
  let memoizeJsxElements = true;
  let enableAssumeHooksFollowRulesOfReact = false;
  let enableTreatHooksAsFunctions = true;
  let disableAllMemoization = false;
  let validateRefAccessDuringRender = true;
  let validateNoSetStateInRender = true;
  let enableEmitFreeze = null;
  let enableOptimizeFunctionExpressions = true;
  let enableOnlyOnReactScript = false;

  if (firstLine.indexOf("@forgetDirective") !== -1) {
    enableOnlyOnUseForgetDirective = true;
  }
  if (firstLine.includes("@gating")) {
    gating = {
      source: "ReactForgetFeatureFlag",
      importSpecifierName: "isForgetEnabled_Fixtures",
    };
  }
  if (firstLine.includes("@instrumentForget")) {
    instrumentForget = {
      source: "react-forget-runtime",
      importSpecifierName: "useRenderCounter",
    };
  }
  if (firstLine.includes("@panicOnBailout false")) {
    panicOnBailout = false;
  }
  if (firstLine.includes("@memoizeJsxElements false")) {
    memoizeJsxElements = false;
  }
  if (firstLine.includes("@enableAssumeHooksFollowRulesOfReact true")) {
    enableAssumeHooksFollowRulesOfReact = true;
  }
  if (firstLine.includes("@enableTreatHooksAsFunctions false")) {
    enableTreatHooksAsFunctions = false;
  }
  if (firstLine.includes("@disableAllMemoization true")) {
    disableAllMemoization = true;
  }
  if (firstLine.includes("@validateRefAccessDuringRender false")) {
    validateRefAccessDuringRender = false;
  }
  if (firstLine.includes("@validateNoSetStateInRender false")) {
    validateNoSetStateInRender = false;
  }
  if (firstLine.includes("@enableOptimizeFunctionExpressions false")) {
    enableOptimizeFunctionExpressions = false;
  }
  if (firstLine.includes("@enableEmitFreeze")) {
    enableEmitFreeze = {
      source: "react-forget-runtime",
      importSpecifierName: "makeReadOnly",
    };
  }
  if (firstLine.indexOf("@reactScriptDirective") !== -1) {
    enableOnlyOnReactScript = true;
    language = "flow";
  }

  return pluginFn(input, basename, language, {
    environment: {
      customHooks: new Map([
        [
          "useFreeze",
          {
            valueKind: "frozen" as ValueKind,
            effectKind: "freeze" as Effect,
          },
        ],
      ]),
      enableAssumeHooksFollowRulesOfReact,
      enableFunctionCallSignatureOptimizations: true,
      disableAllMemoization,
      enableTreatHooksAsFunctions,
      inlineUseMemo: true,
      memoizeJsxElements,
      validateHooksUsage: true,
      validateRefAccessDuringRender,
      validateFrozenLambdas: true,
      validateNoSetStateInRender,
      enableEmitFreeze,
      enableOptimizeFunctionExpressions,
      assertValidMutableRanges: true,
    },
    enableOnlyOnUseForgetDirective,
    enableOnlyOnReactScript,
    logger: null,
    gating,
    instrumentForget,
    panicOnBailout,
    isDev: true,
    noEmit: false,
  });
}
