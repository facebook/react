/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import generate from "@babel/generator";
import * as t from "@babel/types";
import MonacoEditor from "@monaco-editor/react";
import { type CompilerError } from "babel-plugin-react-forget";
import prettier from "prettier";
import prettierParserBabel from "prettier/parser-babel";
import { memo, useMemo, useState } from "react";
import { type Store } from "../../lib/stores";
import TabbedWindow from "../TabbedWindow";
import { monacoOptions } from "./monacoOptions";
const MemoizedOutput = memo(Output);

export default MemoizedOutput;

export type PrintedCompilerPipelineValue =
  | {
      kind: "ast";
      name: string;
      fnName: string | null;
      value: t.FunctionDeclaration;
    }
  | {
      kind: "hir";
      name: string;
      fnName: string | null;
      value: string;
    }
  | { kind: "reactive"; name: string; fnName: string | null; value: string };

export type CompilerOutput =
  | { kind: "ok"; results: Map<string, PrintedCompilerPipelineValue[]> }
  | {
      kind: "err";
      results: Map<string, PrintedCompilerPipelineValue[]>;
      error: CompilerError;
    };

type Props = {
  store: Store;
  compilerOutput: CompilerOutput;
};

function tabify(source: string, compilerOutput: CompilerOutput) {
  const tabs = new Map<string, React.ReactNode>();
  const reorderedTabs = new Map<string, React.ReactNode>();
  const concattedResults = new Map<string, string>();
  let topLevelFnDecls: Array<t.FunctionDeclaration> = [];
  // Concat all top level function declaration results into a single tab for each pass
  for (const [passName, results] of compilerOutput.results) {
    for (const result of results) {
      switch (result.kind) {
        case "hir": {
          const prev = concattedResults.get(result.name);
          const next = result.value;
          const identName = `function ${result.fnName}`;
          if (prev != null) {
            concattedResults.set(passName, `${prev}\n\n${identName}\n${next}`);
          } else {
            concattedResults.set(passName, `${identName}\n${next}`);
          }
          break;
        }
        case "reactive": {
          const prev = concattedResults.get(passName);
          const next = result.value;
          if (prev != null) {
            concattedResults.set(passName, `${prev}\n\n${next}`);
          } else {
            concattedResults.set(passName, next);
          }
          break;
        }
        case "ast":
          topLevelFnDecls.push(result.value);
          break;
        default: {
          throw new Error("Unexpected result kind");
        }
      }
    }
  }
  for (const [passName, text] of concattedResults) {
    tabs.set(passName, <TextTabContent output={text}></TextTabContent>);
  }
  // Ensure that JS and the JS source map come first
  if (topLevelFnDecls.length > 0) {
    // Make a synthetic Program so we can have a single AST with all the top level
    // FunctionDeclarations
    const ast = t.program(topLevelFnDecls);
    const { code, sourceMapUrl } = codegen(ast, source);
    reorderedTabs.set("JS", <TextTabContent output={code}></TextTabContent>);
    if (sourceMapUrl) {
      reorderedTabs.set(
        "SourceMap",
        <>
          <iframe
            src={sourceMapUrl}
            className="w-full h-96"
            title="Generated Code"
          />
        </>
      );
    }
  }
  tabs.forEach((tab, name) => {
    reorderedTabs.set(name, tab);
  });
  return reorderedTabs;
}

function codegen(
  ast: t.Program,
  source: string
): { code: any; sourceMapUrl: string | null } {
  const generated = generate(
    ast,
    { sourceMaps: true, sourceFileName: "input.js" },
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
  return { code: codegenOutput, sourceMapUrl };
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

function Output({ store, compilerOutput }: Props) {
  const [tabsOpen, setTabsOpen] = useState<Set<string>>(() => new Set());
  const tabs = useMemo(
    () => tabify(store.source, compilerOutput),
    [store.source, compilerOutput]
  );

  return (
    <>
      <TabbedWindow
        defaultTab="HIR"
        setTabsOpen={setTabsOpen}
        tabsOpen={tabsOpen}
        tabs={tabs}
      />
      {compilerOutput.kind === "err" ? (
        <div className="flex flex-wrap w-full absolute bottom-0 bg-white grow w-screen border-y border-grey-200 transition-all	ease-in">
          <div className="w-full p-4 basis-full border-b">
            <h2>COMPILER ERRORS</h2>
          </div>
          <pre
            className="p-4 basis-full text-red-600"
            style={{ maxHeight: "20vh", overflowY: "scroll" }}
          >
            {compilerOutput.error.toString()}
          </pre>
        </div>
      ) : null}
    </>
  );
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
