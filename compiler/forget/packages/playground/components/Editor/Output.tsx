/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import generate from "@babel/generator";
import MonacoEditor from "@monaco-editor/react";
import { Diagnostic, HIR, OutputKind } from "babel-plugin-react-forget";
import prettier from "prettier";
import prettierParserBabel from "prettier/parser-babel";
import { memo } from "react";
import type { Store } from "../../lib/stores";
import TabbedWindow from "../TabbedWindow";
import { monacoOptions } from "./monacoOptions";

const {
  parseFunctions,
  Environment,
  enterSSA,
  eliminateRedundantPhi,
  inferReferenceEffects,
  inferMutableRanges,
  leaveSSA,
  lower,
  printHIR,
  codegen,
} = HIR;
const MemoizedOutput = memo(Output);

export default MemoizedOutput;

type Props = {
  store: Store;
  updateDiagnostics: (newDiags: Diagnostic[]) => void;
};

// TODO(gsn: Update diagnostics ƒrom HIR output
function Output({ store }: Props) {
  const astFunctions = parseFunctions(store.source);
  if (astFunctions.length === 0) {
    return <div></div>;
  }

  try {
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

    codegen(ir);
    const ast = codegen(ir);
    const generated = generate(
      ast,
      {
        sourceMaps: true,
        sourceFileName: "input.js",
      },
      store.source
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
    return (
      <TabbedWindow
        defaultTab="HIR"
        tabs={{
          HIR: (
            <TextTabContent
              output={hirOutput}
              kind={OutputKind.IR}
            ></TextTabContent>
          ),
          SSA: (
            <TextTabContent
              output={ssaOutput}
              kind={OutputKind.IR}
            ></TextTabContent>
          ),
          EliminateRedundantPhi: (
            <TextTabContent
              output={eliminateRedundantPhiOutput}
              kind={OutputKind.IR}
            ></TextTabContent>
          ),
          InferReferenceEffects: (
            <TextTabContent
              output={inferReferenceEffectsOutput}
              kind={OutputKind.IR}
            ></TextTabContent>
          ),
          InferMutableRanges: (
            <TextTabContent
              output={inferMutableRangesOutput}
              kind={OutputKind.IR}
            ></TextTabContent>
          ),
          LeaveSSA: (
            <TextTabContent
              output={leaveSSAOutput}
              kind={OutputKind.IR}
            ></TextTabContent>
          ),
          JS: <TextTabContent output={codegenOutput} kind={OutputKind.JS} />,
          SourceMap: (
            <>
              {" "}
              {sourceMapUrl && (
                <iframe
                  src={sourceMapUrl}
                  className="w-full h-96"
                  title="Generated Code"
                />
              )}
            </>
          ),
        }}
      />
    );
  } catch (e: any) {
    return <div>error: ${e.toString()}</div>;
  }
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

function TextTabContent({
  output,
  kind,
}: {
  output: string;
  kind: OutputKind;
}) {
  return (
    <div className="w-full h-full">
      <MonacoEditor
        path={kind}
        defaultLanguage="javascript"
        value={output}
        options={{
          ...monacoOptions,
          readOnly: true,
        }}
      />
    </div>
  );
}
