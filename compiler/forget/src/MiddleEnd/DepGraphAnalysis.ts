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
import { invariant } from "../CompilerError";
import { OutputKind } from "../CompilerOutputs";
import { BlockId, buildCFG, CFG } from "../ControlFlowGraph";
import * as DepGraph from "../DepGraph";
import * as IR from "../IR";
import { PassKind, PassName } from "../Pass";

/**
 * Dependency Graph Analysis.
 *
 * This pass
 * 1. first constructs a {@link DepGraph.ValGraph} upon {@link IR.Func}.
 * 2. then condences the collceted ValGraph into {@link DepGraph.SCCGraph}.
 * 3. finally reduces the dependency relations of SCCGraph in-place to a
 *    "invalidation table" via a topological iterative process.
 */
export default {
  name: PassName.DepGraphAnalysis,
  kind: PassKind.IRFunc as const,
  run,
};

function run(
  irFunc: IR.Func,
  func: NodePath<t.Function>,
  context: CompilerContext
) {
  const { outputKinds } = context.opts;

  const valGraph = irFunc.depGraph;
  populateValGraph(valGraph, irFunc);
  checkValGraph(valGraph);

  if (outputKinds.includes(OutputKind.ValGraph)) {
    context.outputs[OutputKind.ValGraph].push(valGraph.snapshot());
  }

  const sccGraph = valGraph.condense();

  if (outputKinds.includes(OutputKind.SCCGraph)) {
    context.outputs[OutputKind.SCCGraph].push(sccGraph.snapshot());
  }

  sccGraph.reduce();

  if (outputKinds.includes(OutputKind.RedGraph)) {
    context.outputs[OutputKind.RedGraph].push(sccGraph.snapshot());
  }
}

/**
 * Collect direct dependencies for the given @param irFunc and construct the
 * initial {@link DepGraph.ValGraph} according to syntax-directed rules.
 */
function populateValGraph(valGraph: DepGraph.ValGraph, irFunc: IR.Func) {
  // Create vertices for params.
  for (const param of irFunc.params) {
    visitValDefSite(param);
  }

  /**
   * Pass over ir function body.
   *
   * Note: Creating vertices for {@link IR.FuncTopLevel} will form cycles. Instead,
   * their dependencies can be computed over their defs and uses. We'll compute
   * them later in the BackEnd for the sake of code reorganization.
   */
  for (const topLevel of irFunc.body) {
    /**
     * Each topLevel may generate 0 or more {@link Vertex} for each of its
     * declarations, e.g. a VariableDeclaration may have multiple VarDeclarators.
     */
    for (const decl of topLevel.decls) {
      visitValDefSite(decl);
    }

    /**
     * Each topLevel will establish dependencies between its "uses".
     * For every mutable refs used in the statement, conservatively assume that
     * they may be mutated by (therefore, depends on) all other referenced vals:
     */
    for (const mutableUse of topLevel.mutableUses) {
      const mutableRefVertex = valGraph.getOrCreateVertex(mutableUse.val);
      for (const otherUse of topLevel.uses) {
        // ignore exprVal.
        if (IR.isExprVal(otherUse.val)) continue;
        // ignore itself.
        if (otherUse.val !== mutableUse.val) {
          mutableRefVertex.addDependency(otherUse.val);
        }
      }
    }

    /**
     * Each toplevel may have multiple JSX tree which will establish
     * parent-children dependencnies within the tree nodes.
     */
    topLevel.jsxTreeRoots.forEach(visitJSXTag);
    function visitJSXTag(jsxTagVal: IR.JSXTagVal) {
      const v = valGraph.getOrCreateVertex(jsxTagVal);
      for (const child of jsxTagVal.children) {
        v.addDependency(child);

        if (IR.isJSXTagVal(child)) {
          visitJSXTag(child);
        } else {
          visitValDefSite(child);
        }
      }
      return v;
    }
  }

  const cfg = buildCFG(irFunc);
  const cfgControlDependencies = computeCfgControlDeps(irFunc, cfg);
  for (const [blockId, controlDeps] of cfgControlDependencies) {
    if (controlDeps.size === 0) {
      continue;
    }
    const basicBlock = cfg.blocks.get(blockId)!;
    basicBlock.parents.forEach((parent) => {
      for (const dep of controlDeps) {
        for (const use of parent.uses) {
          valGraph.getOrCreateVertex(use.val).addDependency(dep);
        }
      }
    });
  }

  /**
   * Visit the defintion site of the given @param val to collect other
   * referenced identifiers appeared syntactically during its initialization
   * as its dependencies. Such informations are captured by constructing a
   * fragment of {@link DepGraph} around the vertex associated with this
   * @param value.
   * @returns the vertex associated with the @param val
   */
  function visitValDefSite(
    val: IR.BindingVal | IR.ExprVal
  ): DepGraph.ValVertex {
    const vertex = irFunc.depGraph.getOrCreateVertex(val);

    // Inputs e.g. states are always recomputed on every render so there is
    // no need to collect their dependencies. e.g. it's safe to ignore edge
    // `p -> x` for `[x, setX] = useState(p)`.
    if (IR.isInputVal(val)) {
      // However, only unstable inputs need to be tracked as "roots" because
      // there is no need to "diff" stable values.
      if (IR.isReactiveVal(val)) vertex.refineToReactiveInput();
    }

    // Note: For VariableDeclaration, the binding.path is already
    // narrowed to only its own definitional VariableDeclarator.
    irFunc.env.getRefsToDeclsFrom(val.ast.path).map((ref) => {
      // Don't add Inputs to each other
      if (IR.isInputVal(val) && IR.isInputVal(ref.val)) return;

      vertex.addDependency(ref.val);
    });

    return vertex;
  }
}

function checkValGraph(valGraph: DepGraph.ValGraph) {
  for (const [val, vertex] of valGraph.vertices) {
    if (IR.isReactiveVal(val)) {
      invariant(
        vertex.inputs.size === 1 && vertex.inputs.has(val),
        "Input vertices must only contain itself."
      );
    }
  }
}

export function computeCfgControlDeps(
  irFunc: IR.Func,
  cfg: CFG
): Map<BlockId, Set<IR.Val>> {
  const queue: Array<QueueEntry> = [
    { targetBlock: cfg.entry, dependencies: new Set() },
  ];
  const blockControlDeps: Map<BlockId, ControlDependencies> = new Map();
  while (queue.length !== 0) {
    const { targetBlock: blockId, dependencies: inputDeps } = queue.shift()!;
    let controlDeps = blockControlDeps.get(blockId) ?? null;
    if (controlDeps === null) {
      controlDeps = new ControlDependencies();
      controlDeps.addDependencies(inputDeps);
      blockControlDeps.set(blockId, controlDeps);
    } else {
      const hasChanges = controlDeps.addDependencies(inputDeps);
      if (!hasChanges) {
        continue;
      }
    }

    const nextDeps = controlDeps.getDependencies();

    const block = cfg.blocks.get(blockId)!;
    switch (block.terminal.kind) {
      case "if": {
        queue.push({
          targetBlock: block.terminal.consequent,
          dependencies: nextDeps,
        });
        queue.push({
          targetBlock: block.terminal.alternate,
          dependencies: nextDeps,
        });
        break;
      }
      case "switch": {
        for (const case_ of block.terminal.cases) {
          queue.push({
            targetBlock: case_.block,
            dependencies: nextDeps,
          });
        }
        break;
      }
      case "return":
      case "goto": {
        if (block.terminal.kind === "goto") {
          queue.push({
            targetBlock: block.terminal.block,
            dependencies: nextDeps,
          });
        }
        if (block.terminal.fallthrough !== null) {
          const { block: fallthroughBlock, tests } = block.terminal.fallthrough;
          (tests ?? []).forEach((test) => {
            irFunc.env.getRefsToDeclsFrom(test).forEach((ref) => {
              nextDeps.add(ref.val);
            });
          });
          queue.push({
            targetBlock: fallthroughBlock,
            dependencies: nextDeps,
          });
        }
        break;
      }
      case "throw": {
        break;
      }
      default: {
        assertExhaustive(block.terminal, "Unexpected terminal kind");
      }
    }
  }
  const finalDeps = new Map();
  for (const [blockId, controls] of blockControlDeps) {
    finalDeps.set(blockId, controls.getDependencies());
  }
  return finalDeps;
}

type QueueEntry = {
  /**
   * Block being transferred to.
   */
  targetBlock: BlockId;
  /**
   * "Control" dependencies which affect early returns or breaks that *may* prevent
   * the target block from being reached.
   */
  dependencies: Set<IR.Val>;
};

class ControlDependencies {
  #dependencies: Set<IR.Val> = new Set();

  addDependencies(deps: Set<IR.Val>): boolean {
    let hasChanges = false;
    for (const dep of deps) {
      if (!this.#dependencies.has(dep)) {
        hasChanges = true;
        this.#dependencies.add(dep);
      }
    }
    return hasChanges;
  }

  getDependencies(): Set<IR.Val> {
    return new Set([...this.#dependencies]);
  }
}
