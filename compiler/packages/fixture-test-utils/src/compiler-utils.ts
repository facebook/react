import assert from "assert";
import type { runReactForgetBabelPlugin as RunReactForgetBabelPlugin } from "babel-plugin-react-forget/src/Babel/RunReactForgetBabelPlugin";
import { CompilationMode } from "babel-plugin-react-forget/src/Entrypoint";
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
  let instrumentForget = null;
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
  if (firstLine.includes("@enableEmitFreeze")) {
    enableEmitFreeze = {
      source: "react-forget-runtime",
      importSpecifierName: "makeReadOnly",
    };
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
        assertValidMutableRanges: true,
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
