/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import MonacoEditor from "@monaco-editor/react";
import {
  OutputKind,
  stringifyCompilerOutputs,
  type Diagnostic,
} from "babel-plugin-react-forget";
import clsx from "clsx";
import { memo, useEffect, useMemo, useState } from "react";
import compile from "../../lib/compilerDriver";
import {
  getSelectedFile,
  getVisualizedGraphKind,
  isGraph,
  isVisualizedGraph,
  type OutputTabKind,
  type Store,
} from "../../lib/stores";
import GraphView from "../GraphView";
import Preview from "../Preview";
import { monacoOptions } from "./monacoOptions";

const MemoizedOutput = memo(Output);

export default MemoizedOutput;

type Props = {
  store: Store;
  updateDiagnostics: (newDiags: Diagnostic[]) => void;
};

function Output({ store, updateDiagnostics }: Props) {
  const [selectedTab, setSelectedTab] = useState<OutputTabKind>("Preview");
  const { outputs, diagnostics } = useMemo(
    () => compile(getSelectedFile(store), store.compilerFlags),
    [store]
  );
  const prettyOutputs = useMemo(
    () => stringifyCompilerOutputs(outputs),
    [outputs]
  );
  const outputTabs = [
    ["Preview", "Preview"] as const,
    ...Object.entries(OutputKind),
  ];

  useEffect(() => {
    updateDiagnostics(diagnostics);
  }, [diagnostics, updateDiagnostics]);

  const outputContainer = () => {
    // Special-case Preview to keep it mounted, saving its state.
    if (selectedTab === "Preview") return null;
    if (isVisualizedGraph(selectedTab)) {
      const graphKind = getVisualizedGraphKind(selectedTab);
      return (
        <div className="w-full h-full overflow-auto">
          <GraphView graphs={outputs[graphKind]} />
        </div>
      );
    }
    return (
      <div className="w-full h-full">
        <MonacoEditor
          path={selectedTab}
          defaultLanguage="javascript"
          value={prettyOutputs[selectedTab] ?? "(Empty)"}
          options={{
            ...monacoOptions,
            readOnly: true,
          }}
        />
      </div>
    );
  };

  // TODO: Abstract into "TabbedWindow" component to reuse across input/output.
  // TODO: Add indicator that output tabs have overflowed as part of responsive design.
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-none overflow-x-auto border-b border-gray-200 h-9 no-scrollbar">
        {outputTabs.map(([outputName, outputKind], index) => {
          const isGraphViewSelected = selectedTab === `Visualized${outputKind}`;
          const isTextViewSelected = selectedTab === outputKind;
          const shouldDivide = index < outputTabs.length - 1;

          return (
            <div className="flex items-center h-full" key={outputName}>
              <div
                className={clsx(
                  "h-full border-b-2 border-white px-4 py-0.5 flex items-center",
                  {
                    "border-link": isTextViewSelected || isGraphViewSelected,
                  }
                )}
              >
                <button
                  disabled={isTextViewSelected}
                  onClick={() => setSelectedTab(outputKind)}
                  className="transition-colors duration-150 ease-in"
                >
                  {outputName}
                </button>
                {isGraph(outputKind) ? (
                  <button
                    title={`Visualize ${outputName}`}
                    onClick={() =>
                      setSelectedTab(
                        isGraphViewSelected
                          ? outputKind
                          : `Visualized${outputKind}`
                      )
                    }
                    className="flex-none pl-2 group"
                  >
                    <div
                      title={`Show visualized ${outputName}`}
                      className={clsx(
                        "px-1 text-sm font-medium tracking-wide uppercase rounded text-link bg-highlight whitespace-nowrap",
                        {
                          "bg-link text-highlight": isGraphViewSelected,
                        }
                      )}
                    >
                      Vis
                    </div>
                  </button>
                ) : null}
              </div>
              {shouldDivide && (
                <div className="w-[1px] h-[18px] border-gray-200 border-l mx-1" />
              )}
            </div>
          );
        })}
      </div>
      <div
        className={clsx("w-full h-full bg-card", {
          hidden: selectedTab !== "Preview",
        })}
      >
        <Preview store={store} />
      </div>
      {outputContainer()}
    </div>
  );
}
