/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TabbedWindow from "../TabbedWindow";
import MonacoEditor from "@monaco-editor/react";
import {
  CompilerOutputs,
  OutputKind,
  stringifyCompilerOutputs,
  type Diagnostic,
} from "babel-plugin-react-forget";
import { memo, useEffect, useMemo } from "react";
import compile from "../../lib/compilerDriver";
import type { Store } from "../../lib/stores";
import GraphView from "../GraphView";
import { monacoOptions } from "./monacoOptions";
import HIRTabContent from "./HIRTabContent";

const MemoizedOutput = memo(Output);

export default MemoizedOutput;

type Props = {
  store: Store;
  updateDiagnostics: (newDiags: Diagnostic[]) => void;
};

function Output({ store, updateDiagnostics }: Props) {
  const { outputs, diagnostics } = useMemo(
    () => compile(store.source, store.compilerFlags),
    [store]
  );
  useEffect(() => {
    updateDiagnostics(diagnostics);
  }, [diagnostics, updateDiagnostics]);
  return (
    <TabbedWindow
      defaultTab="HIR"
      tabs={{
        IR: <TextTabContent outputs={outputs} kind={OutputKind.IR} />,
        HIR: <HIRTabContent source={store.source} />,
        CFG: <TextTabContent outputs={outputs} kind={OutputKind.CFG} />,
        ValGraph: (
          <GraphTabContent outputs={outputs} kind={OutputKind.ValGraph} />
        ),
        SCCGraph: (
          <GraphTabContent outputs={outputs} kind={OutputKind.SCCGraph} />
        ),
        RedGraph: (
          <GraphTabContent outputs={outputs} kind={OutputKind.RedGraph} />
        ),
        LIR: <TextTabContent outputs={outputs} kind={OutputKind.LIR} />,
        JS: <TextTabContent outputs={outputs} kind={OutputKind.JS} />,
      }}
    />
  );
}

function TextTabContent({
  outputs,
  kind,
}: {
  outputs: CompilerOutputs;
  kind: OutputKind;
}) {
  const prettyOutputs = useMemo(
    () => stringifyCompilerOutputs(outputs),
    [outputs]
  );

  return (
    <div className="w-full h-full">
      <MonacoEditor
        path={kind}
        defaultLanguage="javascript"
        value={prettyOutputs[kind] ?? "(Empty)"}
        options={{
          ...monacoOptions,
          readOnly: true,
        }}
      />
    </div>
  );
}

function GraphTabContent({
  outputs,
  kind,
}: {
  outputs: CompilerOutputs;
  kind: OutputKind.ValGraph | OutputKind.SCCGraph | OutputKind.RedGraph;
}) {
  return (
    <div className="w-full h-full overflow-auto">
      <GraphView graphs={outputs[kind]} />
    </div>
  );
}
