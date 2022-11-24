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
import { memo, useMemo } from "react";
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

type CompilerOutput = {
  ssaOutput: string;
  hirOutput: string;
  eliminateRedundantPhiOutput: string;
  inferReferenceEffectsOutput: string;
  inferMutableRangesOutput: string;
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

    codegen(ir);
    const ast = codegen(ir);
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
      leaveSSAOutput,
      codegenOutput,
      sourceMapUrl,
    };
  } catch (e: any) {
    return e.toString();
  }
}

// TODO(gsn: Update diagnostics ƒrom HIR output
function Output({ store }: Props) {
  const compilerOutput = useMemo(() => compile(store.source), [store.source]);
  if (typeof compilerOutput === "string") {
    if (compilerOutput === "") return <div></div>;
    return <div>error: ${compilerOutput}</div>;
  }

  return (
    <TabbedWindow
      defaultTab="HIR"
      tabs={{
        HIR: (
          <TextTabContent
            output={compilerOutput.hirOutput}
            kind={OutputKind.IR}
          ></TextTabContent>
        ),
        SSA: (
          <TextTabContent
            output={compilerOutput.ssaOutput}
            kind={OutputKind.IR}
          ></TextTabContent>
        ),
        EliminateRedundantPhi: (
          <TextTabContent
            output={compilerOutput.eliminateRedundantPhiOutput}
            kind={OutputKind.IR}
          ></TextTabContent>
        ),
        InferReferenceEffects: (
          <TextTabContent
            output={compilerOutput.inferReferenceEffectsOutput}
            kind={OutputKind.IR}
          ></TextTabContent>
        ),
        InferMutableRanges: (
          <TextTabContent
            output={compilerOutput.inferMutableRangesOutput}
            kind={OutputKind.IR}
          ></TextTabContent>
        ),
        LeaveSSA: (
          <TextTabContent
            output={compilerOutput.leaveSSAOutput}
            kind={OutputKind.IR}
          ></TextTabContent>
        ),
        JS: (
          <TextTabContent
            output={compilerOutput.codegenOutput}
            kind={OutputKind.JS}
          />
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
          lineNumbers: "off",
        }}
      />
    </div>
  );
}
