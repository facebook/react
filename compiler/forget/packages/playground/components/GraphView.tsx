import { graphviz, wasmFolder } from "@hpcc-js/wasm";
import {
  OutputKind,
  type CompilerOutputs,
} from "babel-plugin-react-forget-legacy";
import { memo, useEffect, useState } from "react";
import genDotProgram from "../lib/dotProgramGenerator";

/*
  Look for graphvizlib.wasm in the /public folder.
  It's recommended to put the WASM files along with the JS files.
  See https://github.com/hpcc-systems/hpcc-js-wasm/#contents.
*/
wasmFolder("/");

const MemoizedGraphView = memo(GraphView);

export default MemoizedGraphView;

function GraphView({
  graphs,
}: {
  graphs:
    | CompilerOutputs[OutputKind.ValGraph]
    | CompilerOutputs[OutputKind.SCCGraph]
    | CompilerOutputs[OutputKind.RedGraph];
}) {
  const [renderedGraphs, setRenderedGraphs] = useState<string[]>([]);

  useEffect(() => {
    async function generateGraph() {
      const svgs = [];
      for (const graph of graphs) {
        const svg = await graphviz.layout(genDotProgram(graph), "svg", "dot");
        svgs.push(svg);
      }
      setRenderedGraphs(svgs);
    }

    generateGraph();
  }, [graphs]);

  return (
    <>
      {renderedGraphs.map((graph, i) => (
        // TODO: Make an ID for each graph snapshot and use it as key here.
        <div dangerouslySetInnerHTML={{ __html: graph }} key={i} />
      ))}
    </>
  );
}
