/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { assertExhaustive } from "../Common/utils";
import type { CompilerContext } from "../CompilerContext";
import { OutputKind } from "../CompilerOutputs";
import { buildCFG, Terminal } from "../ControlFlowGraph";
import * as IR from "../IR";
import { PassKind, PassName } from "../Pass";
import { computeCfgControlDeps } from "./DepGraphAnalysis";

/**
 * Dump CFG
 */
export default {
  name: PassName.DumpCFG,
  kind: PassKind.IRFunc as const,
  run,
};

export function run(
  irFunc: IR.Func,
  func: NodePath<t.Function>,
  context: CompilerContext
) {
  if (context.opts.outputKinds.includes(OutputKind.CFG)) {
    const cfg = buildCFG(irFunc);
    const controlDeps = computeCfgControlDeps(irFunc, cfg);
    const output = [];
    output.push(`entry: bb${cfg.entry}`);
    const blockIds = Array.from(cfg.blocks.keys()).sort();
    for (const blockId of blockIds) {
      const { body, terminal, parents } = cfg.blocks.get(blockId)!;
      output.push("");
      output.push(`bb${blockId}:`);
      for (const stmt of body) {
        output.push("  " + String(stmt));
      }
      output.push("@parents:");
      for (const parent of parents) {
        let printed = String(parent.ast).trim();
        let limit = printed.indexOf("{");
        limit = limit === -1 ? 80 : Math.min(80, limit);
        output.push(
          `  ${parent.ast.node.loc?.start.line}:${
            parent.ast.node.loc?.start.column
          }: ${printed.substring(0, limit).trim()}${
            printed.length > limit ? "..." : ""
          }`
        );
      }
      output.push("@controls:");
      const deps = controlDeps.get(blockId)!;
      for (const dep of deps) {
        output.push(`  ${dep.toString()}`);
      }
      output.push("@terminal:");
      let terminalOutput = "";
      switch (terminal.kind) {
        case "return": {
          const retValue = terminal.value != null ? String(terminal.value) : "";
          terminalOutput = `return ${retValue}`;
          if (terminal.fallthrough !== null) {
            const { block: fallthroughBlock, tests } = terminal.fallthrough;
            terminalOutput = `${terminalOutput} fallthrough:bb${fallthroughBlock} tests=${(
              tests ?? []
            )
              .map((t) => String(t))
              .join(" && ")}`;
          }
          break;
        }
        case "goto": {
          terminalOutput = `goto bb${terminal.block}`;
          if (terminal.fallthrough !== null) {
            const { block: fallthroughBlock, tests } = terminal.fallthrough;
            terminalOutput = `${terminalOutput} fallthrough:bb${fallthroughBlock} tests=${(
              tests ?? ["<empty>"]
            )
              .map((t) => String(t))
              .join(" && ")}`;
          }
          break;
        }
        case "throw": {
          terminalOutput = "throw";
          break;
        }
        case "if": {
          terminalOutput = `if (${String(terminal.test)}) then:bb${
            terminal.consequent
          } else:bb${terminal.alternate}`;
          break;
        }
        case "switch": {
          const lines = [`switch (${String(terminal.test)})`];
          terminal.cases.forEach((case_) => {
            if (case_.test != null) {
              lines.push(`    case ${String(case_.test)}: bb${case_.block}`);
            } else {
              lines.push(`    default: bb${case_.block}`);
            }
          });
          terminalOutput = lines.join("\n");
          break;
        }
        default: {
          assertExhaustive(
            terminal,
            `Unexpected terminal kind '${(terminal as any as Terminal).kind}'`
          );
        }
      }
      output.push(`  ${terminalOutput}`);
    }
    context.outputs[OutputKind.CFG] = output.join("\n");
  }
}
