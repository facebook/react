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
  let memoizeJsxElements = true;
  let enableAssumeHooksFollowRulesOfReact = false;
  let disableAllMemoization = false;
  let validateRefAccessDuringRender = true;
  let validateNoSetStateInRender = true;
  let enableEmitFreeze = null;
  let compilationMode: CompilationMode = "all";
  let enableForest = false;
  let enableMergeConsecutiveScopes = false;
  let bailoutOnHoleyArrays = false;

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
  if (firstLine.includes("@memoizeJsxElements false")) {
    memoizeJsxElements = false;
  }
  if (firstLine.includes("@enableAssumeHooksFollowRulesOfReact true")) {
    enableAssumeHooksFollowRulesOfReact = true;
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
  if (firstLine.includes("@enableForest true")) {
    enableForest = true;
  }
  if (firstLine.includes("@bailoutOnHoleyArrays")) {
    bailoutOnHoleyArrays = true;
  }

  if (firstLine.includes("@enableMergeConsecutiveScopes")) {
    enableMergeConsecutiveScopes = true;
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
        enableAssumeHooksFollowRulesOfReact,
        disableAllMemoization,
        memoizeJsxElements,
        validateRefAccessDuringRender,
        validateFrozenLambdas: true,
        validateNoSetStateInRender,
        enableEmitFreeze,
        enableMergeConsecutiveScopes,
        assertValidMutableRanges: true,
        bailoutOnHoleyArrays,
        enableForest,
      },
      compilationMode,
      logger: null,
      gating,
      instrumentForget,
      panicThreshold: "ALL_ERRORS",
      noEmit: false,
    },
    includeAst
  );
}
