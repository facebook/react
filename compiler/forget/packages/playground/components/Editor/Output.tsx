/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import generate from "@babel/generator";
import MonacoEditor from "@monaco-editor/react";
import { HIR } from "babel-plugin-react-forget";
import {
  Diagnostic,
  OutputKind,
  stringifyCompilerOutputs,
} from "babel-plugin-react-forget-legacy";
import prettier from "prettier";
import prettierParserBabel from "prettier/parser-babel";
import { memo, useMemo } from "react";
import compileOldArchitecture from "../../lib/compilerDriver";
import type { Store } from "../../lib/stores";
import TabbedWindow, { TabTypes } from "../TabbedWindow";
import { monacoOptions } from "./monacoOptions";
const {
  buildReactiveFunction,
  codegenReactiveFunction,
  eliminateRedundantPhi,
  enterSSA,
  Environment,
  flattenReactiveLoops,
  inferMutableRanges,
  inferReactiveScopes,
  inferReactiveScopeVariables,
  inferReferenceEffects,
  leaveSSA,
  lower,
  parseFunctions,
  printHIR,
  printReactiveFunction,
  propagateScopeDependencies,
  pruneUnusedLabels,
} = HIR;
const MemoizedOutput = memo(Output);

export default MemoizedOutput;

type Props = {
  store: Store;
  updateDiagnostics: (newDiags: Diagnostic[]) => void;
  tabsOpen: Map<TabTypes, boolean>;
  setTabsOpen: (newTab: Map<TabTypes, boolean>) => void;
};

type CompilerOutput = {
  ssaOutput: string;
  hirOutput: string;
  eliminateRedundantPhiOutput: string;
  inferReferenceEffectsOutput: string;
  inferMutableRangesOutput: string;
  inferReactiveScopeVariablesOutput: string;
  inferReactiveScopesOutput: string;
  reactiveFunctionOutput: string;
  leaveSSAOutput: string;
  codegenOutput: string;
  sourceMapUrl: string | null;
};

type CompilerError = string;

function compile(source: string): CompilerOutput | CompilerError {
  try {
    const astFunctions = parseFunctions(source);
    if (astFunctions.length === 0) {
      return "";
    }

    // TODO: Handle multiple functions
    const func = astFunctions[0];
    const env = new Environment();
    const ir = lower(func, env);

    const hirOutput = printHIR(ir.body);

    enterSSA(ir, env);
    const ssaOutput = printHIR(ir.body);

    eliminateRedundantPhi(ir);
    const eliminateRedundantPhiOutput = printHIR(ir.body);

    inferReferenceEffects(ir);
    const inferReferenceEffectsOutput = printHIR(ir.body);

    inferMutableRanges(ir);
    const inferMutableRangesOutput = printHIR(ir.body);

    leaveSSA(ir);
    const leaveSSAOutput = printHIR(ir.body);

    inferReactiveScopeVariables(ir);
    const inferReactiveScopeVariablesOutput = printHIR(ir.body);

    inferReactiveScopes(ir);
    const inferReactiveScopesOutput = printHIR(ir.body);

    const reactiveFunction = buildReactiveFunction(ir);
    pruneUnusedLabels(reactiveFunction);
    flattenReactiveLoops(reactiveFunction);
    propagateScopeDependencies(reactiveFunction);
    const reactiveFunctionOutput = printReactiveFunction(reactiveFunction);

    const ast = codegenReactiveFunction(reactiveFunction);
    const generated = generate(
      ast,
      {
        sourceMaps: true,
        sourceFileName: "input.js",
      },
      source
    );
    const sourceMapUrl = getSourceMapUrl(
      generated.code,
      JSON.stringify(generated.map)
    );
    const codegenOutput = prettier.format(generated.code, {
      semi: true,
      parser: "babel",
      plugins: [prettierParserBabel],
    });

    return {
      hirOutput,
      ssaOutput,
      eliminateRedundantPhiOutput,
      inferReferenceEffectsOutput,
      inferMutableRangesOutput,
      inferReactiveScopeVariablesOutput,
      inferReactiveScopesOutput,
      reactiveFunctionOutput,
      leaveSSAOutput,
      codegenOutput,
      sourceMapUrl,
    };
  } catch (e: any) {
    return e.toString();
  }
}

// TODO(gsn: Update diagnostics ƒrom HIR output
function Output({ store, setTabsOpen, tabsOpen }: Props) {
  const compilerOutput = useMemo(() => compile(store.source), [store.source]);
  const { outputs: oldCompilerOutputs } = useMemo(
    () => compileOldArchitecture(store.source, store.compilerFlags),
    [store]
  );
  const prettyOldCompilerOutput = useMemo(
    () => stringifyCompilerOutputs(oldCompilerOutputs),
    [oldCompilerOutputs]
  );
  const prettyOldCompilerOutputJS =
    prettyOldCompilerOutput[OutputKind.JS] ?? "(Empty)";

  if (typeof compilerOutput === "string") {
    if (compilerOutput === "") return <div></div>;
    return <div>error: ${compilerOutput}</div>;
  }

  return (
    <TabbedWindow
      defaultTab="HIR"
      setTabsOpen={setTabsOpen}
      tabsOpen={tabsOpen}
      tabs={{
        JS: <TextTabContent output={compilerOutput.codegenOutput} />,
        HIR: (
          <TextTabContent output={compilerOutput.hirOutput}></TextTabContent>
        ),
        SSA: (
          <TextTabContent output={compilerOutput.ssaOutput}></TextTabContent>
        ),
        EliminateRedundantPhi: (
          <TextTabContent
            output={compilerOutput.eliminateRedundantPhiOutput}
          ></TextTabContent>
        ),
        InferReferenceEffects: (
          <TextTabContent
            output={compilerOutput.inferReferenceEffectsOutput}
          ></TextTabContent>
        ),
        InferMutableRanges: (
          <TextTabContent
            output={compilerOutput.inferMutableRangesOutput}
          ></TextTabContent>
        ),
        LeaveSSA: (
          <TextTabContent
            output={compilerOutput.leaveSSAOutput}
          ></TextTabContent>
        ),
        InferReactiveScopeVariables: (
          <TextTabContent
            output={compilerOutput.inferReactiveScopeVariablesOutput}
          ></TextTabContent>
        ),
        InferReactiveScopes: (
          <TextTabContent
            output={compilerOutput.inferReactiveScopesOutput}
          ></TextTabContent>
        ),
        ReactiveFunctions: (
          <TextTabContent
            output={compilerOutput.reactiveFunctionOutput}
          ></TextTabContent>
        ),
        SourceMap: (
          <>
            {compilerOutput.sourceMapUrl && (
              <iframe
                src={compilerOutput.sourceMapUrl}
                className="w-full h-96"
                title="Generated Code"
              />
            )}
          </>
        ),
        OldArchitecture: <TextTabContent output={prettyOldCompilerOutputJS} />,
      }}
    />
  );
}

function utf16ToUTF8(s: string): string {
  return unescape(encodeURIComponent(s));
}

function getSourceMapUrl(code: string, map: string): string | null {
  code = utf16ToUTF8(code);
  map = utf16ToUTF8(map);
  return `https://evanw.github.io/source-map-visualization/#${btoa(
    `${code.length}\0${code}${map.length}\0${map}`
  )}`;
}

function TextTabContent({ output }: { output: string }) {
  return (
    // Restrict MonacoEditor's height, since the config autoLayout:true
    // will grow the editor to fit within parent element
    <div className="w-full h-monaco_small sm:h-monaco">
      <MonacoEditor
        defaultLanguage="javascript"
        value={output}
        options={{
          ...monacoOptions,
          readOnly: true,
          lineNumbers: "off",
          glyphMargin: false,
          // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
        }}
      />
    </div>
  );
}
