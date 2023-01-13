/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import generate from "@babel/generator";
import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import MonacoEditor from "@monaco-editor/react";
import {
  printHIR,
  printReactiveFunction,
  run,
} from "babel-plugin-react-forget";
import prettier from "prettier";
import prettierParserBabel from "prettier/parser-babel";
import { memo, useMemo, useState } from "react";
import type { Store } from "../../lib/stores";
import TabbedWindow from "../TabbedWindow";
import { monacoOptions } from "./monacoOptions";
const MemoizedOutput = memo(Output);

export default MemoizedOutput;

type Props = {
  store: Store;
};

type CompilerError = string;

function parseFunctions(
  source: string
): Array<NodePath<t.FunctionDeclaration>> {
  try {
    const ast = parse(source, {
      plugins: ["typescript", "jsx"],
    });
    const items: Array<NodePath<t.FunctionDeclaration>> = [];
    traverse(ast, {
      FunctionDeclaration: {
        enter(nodePath) {
          items.push(nodePath);
        },
      },
    });
    return items;
  } catch (e) {
    return [];
  }
}

function compile(source: string): Map<string, React.ReactNode> | CompilerError {
  try {
    const astFunctions = parseFunctions(source);
    if (astFunctions.length === 0) {
      return "";
    }

    // TODO: Handle multiple functions
    const func = astFunctions[0];
    const tabs = new Map<string, React.ReactNode>();
    let ast: t.Function | null = null;
    for (const result of run(func)) {
      switch (result.kind) {
        case "ast": {
          ast = result.value;
          break;
        }
        case "hir": {
          const text = printHIR(result.value.body);
          tabs.set(
            result.name,
            <TextTabContent output={text}></TextTabContent>
          );
          break;
        }
        case "reactive": {
          const text = printReactiveFunction(result.value);
          tabs.set(
            result.name,
            <TextTabContent output={text}></TextTabContent>
          );
          break;
        }
        default: {
          throw new Error("Unexpected result kind");
        }
      }
    }
    // Ensure that JS and the JS source map come first
    const reorderedTabs = new Map();
    if (ast !== null) {
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
  } catch (e: any) {
    console.error(e);
    return e.toString();
  }
}

function codegen(
  ast: any,
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

// TODO(gsn: Update diagnostics ƒrom HIR output
function Output({ store }: Props) {
  const [tabsOpen, setTabsOpen] = useState<Set<string>>(() => new Set());
  const compilerOutput = useMemo(() => compile(store.source), [store.source]);

  if (typeof compilerOutput === "string") {
    if (compilerOutput === "") return <div></div>;
    return <div>error: ${compilerOutput}</div>;
  }

  return (
    <TabbedWindow
      defaultTab="HIR"
      setTabsOpen={setTabsOpen}
      tabsOpen={tabsOpen}
      tabs={compilerOutput}
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
