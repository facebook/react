/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import parserFlow from "prettier/parser-flow";
import prettier from "prettier/standalone";
import prettyFormat from "pretty-format";
import { SCCGraphSnapshot, ValGraphSnapshot } from "./DepGraph";

/**
 * N.B. we use string enum to ease the interop with untyped code.
 */
export enum OutputKind {
  IR = "DumpIR",
  CFG = "DumpCFG",
  ValGraph = "DumpValGraph",
  SCCGraph = "DumpSCCGraph",
  RedGraph = "DumpRedGraph",
  LIR = "DumpLIR",
  JS = "EmitJS",
}

/**
 * @returns if @param kind is syntactically valid JavaScript
 */
export function isSyntacticallyValidJS(kind: OutputKind) {
  return [OutputKind.IR, OutputKind.LIR, OutputKind.JS].includes(kind);
}

export interface CompilerOutputs {
  [OutputKind.IR]: string;
  [OutputKind.CFG]: string;
  [OutputKind.ValGraph]: ValGraphSnapshot[];
  [OutputKind.SCCGraph]: SCCGraphSnapshot[];
  [OutputKind.RedGraph]: SCCGraphSnapshot[];
  [OutputKind.LIR]: string;
  [OutputKind.JS]: string;
}

export function createCompilerOutputs(): CompilerOutputs {
  return {
    [OutputKind.IR]: "",
    [OutputKind.CFG]: "",
    [OutputKind.ValGraph]: [],
    [OutputKind.SCCGraph]: [],
    [OutputKind.RedGraph]: [],
    [OutputKind.LIR]: "",
    [OutputKind.JS]: "",
  };
}

export function isOutputKind(kind: string): kind is OutputKind {
  return Object.values(OutputKind).includes(kind as OutputKind);
}

export type PrettyCompilerOutputs = Record<OutputKind, string | undefined>;

export function stringifyCompilerOutputs(
  compilerOutputs: CompilerOutputs
): PrettyCompilerOutputs {
  const outputs: PrettyCompilerOutputs = {
    [OutputKind.IR]: undefined,
    [OutputKind.CFG]: undefined,
    [OutputKind.ValGraph]: undefined,
    [OutputKind.SCCGraph]: undefined,
    [OutputKind.RedGraph]: undefined,
    [OutputKind.LIR]: undefined,
    [OutputKind.JS]: undefined,
  };

  Object.entries(compilerOutputs).forEach(([outputKind, output]) => {
    if (isOutputKind(outputKind)) {
      if (isSyntacticallyValidJS(outputKind)) {
        invariant(
          typeof output === "string",
          "OutputKind that are JS must have string typed output."
        );
        if (output !== "") {
          try {
            outputs[outputKind] = prettier
              .format(output, {
                parser: "flow",
                plugins: [parserFlow],
              })
              .trim();
          } catch (e) {
            console.warn("Error formatting output:", e);
          }
        }
      } else if (outputKind === OutputKind.CFG) {
        invariant(typeof output === "string", "CFG output must be a string");
        outputs[outputKind] = output;
      } else {
        invariant(Array.isArray(output), "Graph outputs are arrays.");
        if (output.length > 0) {
          outputs[outputKind] = output
            .map((o: ValGraphSnapshot | SCCGraphSnapshot) =>
              prettyFormat(o.toMap())
            )
            .join("\n");
        }
      }
    }
  });

  return outputs;
}

export { ValGraphSnapshot as ValGraph };
export { SCCGraphSnapshot as SCCGraph };
