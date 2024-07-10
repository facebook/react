import { CompilerError } from "../CompilerError";
import { isMutable } from "../ReactiveScopes/InferReactiveScopeVariables";
import { Set_intersect, Set_union, getOrInsertDefault } from "../Utils/utils";
import {
  BlockId,
  GeneratedSource,
  HIRFunction,
  Identifier,
  IdentifierId,
  InstructionId,
  Place,
  ReactiveScopeDependency,
  ScopeId,
} from "./HIR";

type CollectHoistablePropertyLoadsResult = {
  nodes: Map<BlockId, BlockInfo>;
  temporaries: Map<Identifier, Identifier>;
  properties: Map<Identifier, ReactiveScopeDependency>;
};

export function collectHoistablePropertyLoads(
  fn: HIRFunction,
  usedOutsideDeclaringScope: Set<IdentifierId>
): CollectHoistablePropertyLoadsResult {
  const result = new TemporariesSideMap();

  const functionExprRvals = fn.env.config.enableTreatFunctionDepsAsConditional
    ? collectFunctionExpressionRValues(fn)
    : new Set<IdentifierId>();
  const nodes = collectNodes(
    fn,
    functionExprRvals,
    usedOutsideDeclaringScope,
    result
  );
  deriveNonNull(fn, nodes);

  return {
    nodes,
    temporaries: result.temporaries,
    properties: result.properties,
  };
}

export type BlockInfo = {
  blockId: BlockId;
  scope: ScopeId | null;
  preds: Set<BlockId>;
  assumedNonNullObjects: Set<PropertyLoadNode>;
};

/**
 * Tree data structure to dedupe property loads (e.g. a.b.c)
 * and make computing sets and intersections simpler.
 */
type RootNode = {
  properties: Map<string, PropertyLoadNode>;
  parent: null;
  // Recorded to make later computations simpler
  fullPath: ReactiveScopeDependency;
  root: Identifier;
};

type PropertyLoadNode =
  | {
      properties: Map<string, PropertyLoadNode>;
      parent: PropertyLoadNode;
      fullPath: ReactiveScopeDependency;
    }
  | RootNode;

class Tree {
  roots: Map<Identifier, RootNode> = new Map();

  #getOrCreateRoot(identifier: Identifier): PropertyLoadNode {
    // roots can always be accessed unconditionally in JS
    let rootNode = this.roots.get(identifier);

    if (rootNode === undefined) {
      rootNode = {
        root: identifier,
        properties: new Map(),
        fullPath: {
          identifier,
          path: [],
        },
        parent: null,
      };
      this.roots.set(identifier, rootNode);
    }
    return rootNode;
  }

  static #getOrMakeProperty(
    node: PropertyLoadNode,
    property: string
  ): PropertyLoadNode {
    let child = node.properties.get(property);
    if (child == null) {
      child = {
        properties: new Map(),
        parent: node,
        fullPath: {
          identifier: node.fullPath.identifier,
          path: node.fullPath.path.concat([property]),
        },
      };
      node.properties.set(property, child);
    }
    return child;
  }

  add(n: ReactiveScopeDependency): PropertyLoadNode {
    let currNode = this.#getOrCreateRoot(n.identifier);
    // We add ReactiveScopeDependencies sequentially (e.g. a.b before a.b.c),
    // so subpaths should already exist.
    for (let i = 0; i < n.path.length - 1; i++) {
      currNode = assertNonNull(currNode.properties.get(n.path[i]));
    }

    currNode = Tree.#getOrMakeProperty(currNode, n.path.at(-1)!);
    return currNode;
  }
}

/**
 * We currently lower function expression dependencies inline before the
 * function expression instruction. This causes our HIR to deviate from
 * JS specs.
 *
 * For example, note that instructions 0-2 in the below HIR are incorrectly
 * hoisted.
 * ```js
 * // Input
 * function Component(props) {
 *   const fn = () => cond && read(props.a.b);
 *   // ...
 * }
 *
 * // HIR:
 * [0] $0 = LoadLocal "props"
 * [1] $1 = PropertyLoad $0, "a"
 * [2] $2 = PropertyLoad $1, "b"
 * [3] $3 = FunctionExpression deps=[$2] context=[$0] {
 *            ...
 *          }
 *
 * TODO: rewrite function expression deps
 */
function collectFunctionExpressionRValues(fn: HIRFunction): Set<IdentifierId> {
  const result = new Set<IdentifierId>();
  const loads = new Map<IdentifierId, IdentifierId>();

  for (const [_, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (instr.value.kind === "LoadLocal") {
        loads.set(instr.lvalue.identifier.id, instr.value.place.identifier.id);
      } else if (instr.value.kind === "PropertyLoad") {
        loads.set(instr.lvalue.identifier.id, instr.value.object.identifier.id);
      } else if (instr.value.kind === "FunctionExpression") {
        for (const dep of instr.value.loweredFunc.dependencies) {
          result.add(dep.identifier.id);
        }
      }
    }
  }

  // don't iterate newly added objects as optimization
  for (const res of result) {
    let curr = loads.get(res);
    while (curr != null) {
      result.add(curr);
      curr = loads.get(curr);
    }
  }
  return result;
}

class TemporariesSideMap {
  temporaries: Map<Identifier, Identifier> = new Map();
  properties: Map<Identifier, ReactiveScopeDependency> = new Map();
  tree: Tree = new Tree();

  declareTemporary(from: Identifier, to: Identifier): void {
    this.temporaries.set(from, to);
  }

  declareProperty(
    lvalue: Place,
    object: Place,
    propertyName: string,
    shouldDeclare: boolean
  ): PropertyLoadNode {
    // temporaries contains object if this is a property load chain from a named variable
    // Otherwise, there is a non-trivial expression
    const resolvedObject =
      this.temporaries.get(object.identifier) ?? object.identifier;

    const resolvedDependency = this.properties.get(resolvedObject);
    let property: ReactiveScopeDependency;
    if (resolvedDependency == null) {
      property = {
        identifier: resolvedObject,
        path: [propertyName],
      };
    } else {
      property = {
        identifier: resolvedDependency.identifier,
        path: [...resolvedDependency.path, propertyName],
      };
    }

    if (shouldDeclare) {
      this.properties.set(lvalue.identifier, property);
    }
    return this.tree.add(property);
  }
}

function collectNodes(
  fn: HIRFunction,
  functionExprRvals: Set<IdentifierId>,
  usedOutsideDeclaringScope: Set<IdentifierId>,
  c: TemporariesSideMap
): Map<BlockId, BlockInfo> {
  const nodes = new Map<BlockId, BlockInfo>();
  const scopeStartBlocks = new Map<BlockId, ScopeId>();
  for (const [blockId, block] of fn.body.blocks) {
    const assumedNonNullObjects = new Set<PropertyLoadNode>();
    for (const instr of block.instructions) {
      const { value, lvalue } = instr;
      const usedOutside = usedOutsideDeclaringScope.has(lvalue.identifier.id);
      if (value.kind === "PropertyLoad") {
        const propertyNode = c.declareProperty(
          lvalue,
          value.object,
          value.property,
          !usedOutside
        );
        if (
          !functionExprRvals.has(lvalue.identifier.id) &&
          !isMutable(instr, value.object)
        ) {
          let curr = propertyNode.parent;
          while (curr != null) {
            assumedNonNullObjects.add(curr);
            curr = curr.parent;
          }
        }
      } else if (value.kind === "LoadLocal") {
        if (
          lvalue.identifier.name == null &&
          value.place.identifier.name !== null &&
          !usedOutside
        ) {
          c.declareTemporary(lvalue.identifier, value.place.identifier);
        }
      }
      /**
       * Note that we do not record StoreLocals as this runs after ExitSSA.
       * As a result, an expression like `(a ?? b).c` is represented as two
       * StoreLocals to the same identifier id.
       */
    }

    if (
      block.terminal.kind === "scope" ||
      block.terminal.kind === "pruned-scope"
    ) {
      scopeStartBlocks.set(block.terminal.block, block.terminal.scope.id);
    }

    nodes.set(blockId, {
      blockId,
      scope: scopeStartBlocks.get(blockId) ?? null,
      preds: block.preds,
      assumedNonNullObjects,
    });
  }
  return nodes;
}

function deriveNonNull(fn: HIRFunction, nodes: Map<BlockId, BlockInfo>): void {
  // block -> successors sidemap
  const succ = new Map<BlockId, Set<BlockId>>();
  const terminalPreds = new Set<BlockId>();

  for (const [blockId, block] of fn.body.blocks) {
    for (const pred of block.preds) {
      const predVal = getOrInsertDefault(succ, pred, new Set());
      predVal.add(blockId);
    }
    if (block.terminal.kind === "throw" || block.terminal.kind === "return") {
      terminalPreds.add(blockId);
    }
  }

  function recursivelyDeriveNonNull(
    nodeId: BlockId,
    kind: "succ" | "pred",
    traversalState: Map<BlockId, "active" | "done">,
    result: Map<BlockId, Set<PropertyLoadNode>>
  ): boolean {
    if (traversalState.has(nodeId)) {
      return false;
    }
    traversalState.set(nodeId, "active");

    const node = nodes.get(nodeId);
    if (node == null) {
      CompilerError.invariant(false, {
        reason: `Bad node ${nodeId}, kind: ${kind}`,
        loc: GeneratedSource,
      });
    }
    const neighbors = Array.from(
      kind === "succ" ? succ.get(nodeId) ?? [] : node.preds
    );

    let changed = false;
    for (const pred of neighbors) {
      if (!traversalState.has(pred)) {
        const neighborChanged = recursivelyDeriveNonNull(
          pred,
          kind,
          traversalState,
          result
        );
        changed ||= neighborChanged;
      }
    }
    // active neighbors can be filtered out as we're solving for the following
    // relation.
    // X = Intersect(X_neighbors, X)
    // non-active neighbors with no recorded results can occur due to backedges.
    // it's not safe to assume they can be filtered out (e.g. not intersected)
    const neighborAccesses = Set_intersect([
      ...(Array.from(neighbors)
        .filter((n) => traversalState.get(n) !== "active")
        .map((n) => result.get(n) ?? new Set()) as Array<
        Set<PropertyLoadNode>
      >),
    ]);

    const prevSize = result.get(nodeId)?.size;
    // const prevPrinted = [...(result.get(nodeId) ?? [])].map(
    //   printDependencyNode
    // );
    result.set(nodeId, Set_union(node.assumedNonNullObjects, neighborAccesses));
    traversalState.set(nodeId, "done");

    // const newPrinted = [...(result.get(nodeId) ?? [])].map(printDependencyNode);
    // llog("  - ", nodeId, prevPrinted, newPrinted);

    changed ||= prevSize !== result.get(nodeId)!.size;
    CompilerError.invariant(
      prevSize == null || prevSize <= result.get(nodeId)!.size,
      {
        reason: "[CollectHoistablePropertyLoads] Nodes shrank!",
        description: `${nodeId} ${kind} ${prevSize} ${
          result.get(nodeId)!.size
        }`,
        loc: GeneratedSource,
      }
    );
    return changed;
  }
  const fromEntry = new Map<BlockId, Set<PropertyLoadNode>>();
  const fromExit = new Map<BlockId, Set<PropertyLoadNode>>();
  let changed = true;
  const traversalState = new Map<BlockId, "done" | "active">();
  const reversedBlocks = [...fn.body.blocks];
  reversedBlocks.reverse();
  let i = 0;

  while (changed) {
    i++;
    changed = false;
    for (const [blockId] of fn.body.blocks) {
      const changed_ = recursivelyDeriveNonNull(
        blockId,
        "pred",
        traversalState,
        fromEntry
      );
      changed ||= changed_;
    }
    traversalState.clear();
    for (const [blockId] of reversedBlocks) {
      const changed_ = recursivelyDeriveNonNull(
        blockId,
        "succ",
        traversalState,
        fromExit
      );
      changed ||= changed_;
    }
    traversalState.clear();
  }

  // TODO: I can't come up with a case that requires fixed-point iteration
  CompilerError.invariant(i === 2, {
    reason: "require fixed-point iteration",
    loc: GeneratedSource,
  });

  CompilerError.invariant(
    fromEntry.size === fromExit.size && fromEntry.size === nodes.size,
    {
      reason:
        "bad sizes after calculating fromEntry + fromExit " +
        `${fromEntry.size} ${fromExit.size} ${nodes.size}`,
      loc: GeneratedSource,
    }
  );

  for (const [id, node] of nodes) {
    node.assumedNonNullObjects = Set_union(
      assertNonNull(fromEntry.get(id)),
      assertNonNull(fromExit.get(id))
    );
  }
}

export function assertNonNull<T extends NonNullable<U>, U>(
  value: T | null | undefined,
  source?: string
): T {
  CompilerError.invariant(value != null, {
    reason: "Unexpected null",
    description: source != null ? `(from ${source})` : null,
    loc: GeneratedSource,
  });
  return value;
}
