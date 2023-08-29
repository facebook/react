import assert from "assert";
import type { runReactForgetBabelPlugin as RunReactForgetBabelPlugin } from "babel-plugin-react-forget/src/Babel/RunReactForgetBabelPlugin";
import { CompilationMode } from "babel-plugin-react-forget/src/Entrypoint";
import type { Effect, ValueKind } from "babel-plugin-react-forget/src/HIR";

export function parseLanguage(source: string): "flow" | "typescript" {
  return source.indexOf("@flow") !== -1 ? "flow" : "typescript";
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
  let compilationMode: CompilationMode = "all";

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
  if (firstLine.includes("@enableEmitFreeze")) {
    enableEmitFreeze = {
      source: "react-forget-runtime",
      importSpecifierName: "makeReadOnly",
    };
  }

  return pluginFn(
    input,
    basename,
    language,
    {
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
        assertValidMutableRanges: true,
      },
      compilationMode,
      logger: null,
      gating,
      instrumentForget,
      panicOnBailout,
      isDev: true,
      noEmit: false,
    },
    includeAst
  );
}
