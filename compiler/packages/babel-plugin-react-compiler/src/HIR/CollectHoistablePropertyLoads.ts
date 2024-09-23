import {CompilerError} from '../CompilerError';
import {inRange} from '../ReactiveScopes/InferReactiveScopeVariables';
import {Set_intersect, Set_union, getOrInsertDefault} from '../Utils/utils';
import {
  BasicBlock,
  BlockId,
  GeneratedSource,
  HIRFunction,
  Identifier,
  IdentifierId,
  InstructionId,
  ReactiveScopeDependency,
  ScopeId,
} from './HIR';

/**
 * Helper function for `PropagateScopeDependencies`.
 * Uses control flow graph analysis to determine which `Identifier`s can
 * be assumed to be non-null objects, on a per-block basis.
 *
 * Here is an example:
 * ```js
 * function useFoo(x, y, z) {
 *   // NOT safe to hoist PropertyLoads here
 *   if (...) {
 *     // safe to hoist loads from x
 *     read(x.a);
 *     return;
 *   }
 *   // safe to hoist loads from y, z
 *   read(y.b);
 *   if (...) {
 *     // safe to hoist loads from y, z
 *     read(z.a);
 *   } else {
 *     // safe to hoist loads from y, z
 *     read(z.b);
 *   }
 *   // safe to hoist loads from y, z
 *   return;
 * }
 * ```
 *
 * Note that we currently do NOT account for mutable / declaration range
 * when doing the CFG-based traversal, producing results that are technically
 * incorrect but filtered by PropagateScopeDeps (which only takes dependencies
 * on constructed value -- i.e. a scope's dependencies must have mutable ranges
 * ending earlier than the scope start).
 *
 * Take this example, this function will infer x.foo.bar as non-nullable for bb0,
 * via the intersection of bb1 & bb2 which in turn comes from bb3. This is technically
 * incorrect bb0 is before / during x's mutable range.
 *  bb0:
 *    const x = ...;
 *    if cond then bb1 else bb2
 *  bb1:
 *    ...
 *    goto bb3
 *  bb2:
 *    ...
 *    goto bb3:
 *  bb3:
 *    x.foo.bar
 */
export function collectHoistablePropertyLoads(
  fn: HIRFunction,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
): ReadonlyMap<ScopeId, BlockInfo> {
  const nodes = collectNonNullsInBlocks(fn, temporaries);
  propagateNonNull(fn, nodes);

  const nodesKeyedByScopeId = new Map<ScopeId, BlockInfo>();
  for (const [_, block] of fn.body.blocks) {
    if (block.terminal.kind === 'scope') {
      nodesKeyedByScopeId.set(
        block.terminal.scope.id,
        nodes.get(block.terminal.block)!,
      );
    }
  }

  return nodesKeyedByScopeId;
}

export type BlockInfo = {
  block: BasicBlock;
  assumedNonNullObjects: ReadonlySet<DedupedNode>;
};

/**
 * Tree data structure to dedupe property loads (e.g. a.b.c)
 * and make computing sets intersections simpler.
 */
type DedupedNode = {
  key: string;
  dep: ReactiveScopeDependency;
};
function depToKey(dep: ReactiveScopeDependency): string {
  let key = dep.identifier.id.toString();
  for (let path of dep.path) {
    if (path.optional) {
      key += ' ?. ' + path.property;
    } else {
      key += ' . ' + path.property;
    }
  }
  return key;
}
function findSuperpaths(
  match: ReactiveScopeDependency,
  nodes: Set<DedupedNode>,
): Set<DedupedNode> {
  const key = depToKey(match) + ' ';
  const result = new Set<DedupedNode>();

  for (const n of nodes) {
    if (n.key.startsWith(key)) {
      result.add(n);
    }
  }
  return result;
}

class DedupeMap {
  nodes: Map<string, DedupedNode> = new Map();

  getOrCreateIdentifier(id: Identifier): DedupedNode {
    const key = id.id.toString();
    let result = this.nodes.get(key);
    if (result != null) {
      return result;
    }
    result = {
      key,
      dep: {identifier: id, path: []},
    };
    this.nodes.set(key, result);
    return result;
  }
  getOrCreateProperty(dep: ReactiveScopeDependency): DedupedNode {
    const key = depToKey(dep);
    let result = this.nodes.get(key);
    if (result != null) {
      return result;
    }
    result = {
      key,
      dep,
    };
    this.nodes.set(key, result);
    return result;
  }
}

function pushPropertyLoadNode(
  node: DedupedNode,
  instrId: InstructionId,
  knownImmutableIdentifiers: Set<IdentifierId>,
  result: Set<DedupedNode>,
): void {
  const object = node.dep.identifier;
  /**
   * Since this runs *after* buildReactiveScopeTerminals, identifier mutable ranges
   * are not valid with respect to current instruction id numbering.
   * We use attached reactive scope ranges as a proxy for mutable range, but this
   * is an overestimate as (1) scope ranges merge and align to form valid program
   * blocks and (2) passes like MemoizeFbtAndMacroOperands may assign scopes to
   * non-mutable identifiers.
   *
   * See comment at top of function for why we track known immutable identifiers.
   */
  const isMutableAtInstr =
    object.mutableRange.end > object.mutableRange.start + 1 &&
    object.scope != null &&
    inRange({id: instrId}, object.scope.range);
  if (
    !isMutableAtInstr ||
    knownImmutableIdentifiers.has(node.dep.identifier.id)
  ) {
    result.add(node);
  }
}

function collectNonNullsInBlocks(
  fn: HIRFunction,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
): ReadonlyMap<BlockId, BlockInfo> {
  const tree = new DedupeMap();
  /**
   * Due to current limitations of mutable range inference, there are edge cases in
   * which we infer known-immutable values (e.g. props or hook params) to have a
   * mutable range and scope.
   * (see `destructure-array-declaration-to-context-var` fixture)
   * We track known immutable identifiers to reduce regressions (as PropagateScopeDeps
   * is being rewritten to HIR).
   */
  const knownImmutableIdentifiers = new Set<IdentifierId>();
  if (fn.fnType === 'Component' || fn.fnType === 'Hook') {
    for (const p of fn.params) {
      if (p.kind === 'Identifier') {
        knownImmutableIdentifiers.add(p.identifier.id);
      }
    }
  }
  /**
   * Known non-null objects such as functional component props can be safely
   * read from any block.
   */
  const knownNonNullIdentifiers = new Set<DedupedNode>();
  if (
    fn.env.config.enablePropagateDepsInHIR === 'enabled_with_optimizations' &&
    fn.fnType === 'Component' &&
    fn.params.length > 0 &&
    fn.params[0].kind === 'Identifier'
  ) {
    const identifier = fn.params[0].identifier;
    knownNonNullIdentifiers.add(tree.getOrCreateIdentifier(identifier));
  }
  const nodes = new Map<BlockId, BlockInfo>();
  for (const [_, block] of fn.body.blocks) {
    const assumedNonNullObjects = new Set<DedupedNode>(knownNonNullIdentifiers);

    nodes.set(block.id, {
      block,
      assumedNonNullObjects,
    });
    for (const phi of block.phis) {
      const source = temporaries.get(phi.id.id);
      if (source) {
        const propertyNode = tree.getOrCreateProperty(source);
        pushPropertyLoadNode(
          propertyNode,
          // TODO double check which instr id
          block.instructions.length > 0
            ? block.instructions[0].id
            : block.terminal.id,
          knownImmutableIdentifiers,
          assumedNonNullObjects,
        );
      }
    }
    for (const instr of block.instructions) {
      if (instr.value.kind === 'PropertyLoad') {
        const source = temporaries.get(instr.value.object.identifier.id) ?? {
          identifier: instr.value.object.identifier,
          path: [],
        };
        const propertyNode = tree.getOrCreateProperty(source);
        pushPropertyLoadNode(
          propertyNode,
          instr.id,
          knownImmutableIdentifiers,
          assumedNonNullObjects,
        );
      } else if (
        instr.value.kind === 'Destructure' &&
        fn.env.config.enablePropagateDepsInHIR === 'enabled_with_optimizations'
      ) {
        const source = instr.value.value.identifier.id;
        const sourceNode = temporaries.get(source);
        if (sourceNode != null) {
          pushPropertyLoadNode(
            tree.getOrCreateProperty(sourceNode),
            instr.id,
            knownImmutableIdentifiers,
            assumedNonNullObjects,
          );
        }
      } else if (
        instr.value.kind === 'ComputedLoad' &&
        fn.env.config.enablePropagateDepsInHIR === 'enabled_with_optimizations'
      ) {
        const source = instr.value.object.identifier.id;
        const sourceNode = temporaries.get(source);
        if (sourceNode != null) {
          pushPropertyLoadNode(
            tree.getOrCreateProperty(sourceNode),
            instr.id,
            knownImmutableIdentifiers,
            assumedNonNullObjects,
          );
        }
      }
    }
  }
  return nodes;
}

function propagateNonNull(
  fn: HIRFunction,
  nodes: ReadonlyMap<BlockId, BlockInfo>,
): void {
  const blockSuccessors = new Map<BlockId, Set<BlockId>>();
  const terminalPreds = new Set<BlockId>();

  for (const [blockId, block] of fn.body.blocks) {
    for (const pred of block.preds) {
      getOrInsertDefault(blockSuccessors, pred, new Set()).add(blockId);
    }
    if (block.terminal.kind === 'throw' || block.terminal.kind === 'return') {
      terminalPreds.add(blockId);
    }
  }

  /**
   * In the context of a control flow graph, the identifiers that a block
   * can assume are non-null can be calculated from the following:
   * X = Union(Intersect(X_neighbors), X)
   */
  function recursivelyPropagateNonNull(
    nodeId: BlockId,
    direction: 'forward' | 'backward',
    traversalState: Map<BlockId, 'active' | 'done'>,
    nonNullObjectsByBlock: Map<BlockId, ReadonlySet<DedupedNode>>,
  ): boolean {
    /**
     * Avoid re-visiting computed or currently active nodes, which can
     * occur when the control flow graph has backedges.
     */
    if (traversalState.has(nodeId)) {
      return false;
    }
    traversalState.set(nodeId, 'active');

    const node = nodes.get(nodeId);
    if (node == null) {
      CompilerError.invariant(false, {
        reason: `Bad node ${nodeId}, kind: ${direction}`,
        loc: GeneratedSource,
      });
    }
    const neighbors = Array.from(
      direction === 'backward'
        ? (blockSuccessors.get(nodeId) ?? [])
        : node.block.preds,
    );

    let changed = false;
    for (const pred of neighbors) {
      if (!traversalState.has(pred)) {
        const neighborChanged = recursivelyPropagateNonNull(
          pred,
          direction,
          traversalState,
          nonNullObjectsByBlock,
        );
        changed ||= neighborChanged;
      }
    }
    /**
     * Note that a predecessor / successor can only be active (status != 'done')
     * if it is a self-loop or other transitive cycle. Active neighbors can be
     * filtered out (i.e. not included in the intersection)
     * Example: self loop.
     *    X = Union(Intersect(X, ...X_other_neighbors), X)
     *
     * Example: transitive cycle through node Y, for some Y that is a
     * predecessor / successor of X.
     *    X = Union(
     *          Intersect(
     *            Union(Intersect(X, ...Y_other_neighbors), Y),
     *            ...X_neighbors
     *          ),
     *          X
     *        )
     *
     * Non-active neighbors with no recorded results can occur due to backedges.
     * it's not safe to assume they can be filtered out (e.g. not included in
     * the intersection)
     */
    const neighborAccesses = Set_intersect(
      Array.from(neighbors)
        .filter(n => traversalState.get(n) === 'done')
        .map(n => assertNonNull(nonNullObjectsByBlock.get(n))),
    );

    const prevObjects = assertNonNull(nonNullObjectsByBlock.get(nodeId));
    const newObjects = Set_union(prevObjects, neighborAccesses);

    nonNullObjectsByBlock.set(nodeId, newObjects);
    traversalState.set(nodeId, 'done');
    changed ||= prevObjects.size !== newObjects.size;
    return changed;
  }
  const fromEntry = new Map<BlockId, ReadonlySet<DedupedNode>>();
  const fromExit = new Map<BlockId, ReadonlySet<DedupedNode>>();
  for (const [blockId, blockInfo] of nodes) {
    fromEntry.set(blockId, blockInfo.assumedNonNullObjects);
    fromExit.set(blockId, blockInfo.assumedNonNullObjects);
  }
  const traversalState = new Map<BlockId, 'done' | 'active'>();
  const reversedBlocks = [...fn.body.blocks];
  reversedBlocks.reverse();

  let i = 0;
  let changed;
  do {
    i++;
    changed = false;
    for (const [blockId] of fn.body.blocks) {
      const forwardChanged = recursivelyPropagateNonNull(
        blockId,
        'forward',
        traversalState,
        fromEntry,
      );
      changed ||= forwardChanged;
    }
    traversalState.clear();
    for (const [blockId] of reversedBlocks) {
      const backwardChanged = recursivelyPropagateNonNull(
        blockId,
        'backward',
        traversalState,
        fromExit,
      );
      changed ||= backwardChanged;
    }
    traversalState.clear();
  } while (changed);

  /**
   * TODO: validate against meta internal code, then remove in future PR.
   * Currently cannot come up with a case that requires fixed-point iteration.
   */
  CompilerError.invariant(i <= 2, {
    reason: 'require fixed-point iteration',
    description: `#iterations = ${i}`,
    loc: GeneratedSource,
  });

  CompilerError.invariant(
    fromEntry.size === fromExit.size && fromEntry.size === nodes.size,
    {
      reason:
        'bad sizes after calculating fromEntry + fromExit ' +
        `${fromEntry.size} ${fromExit.size} ${nodes.size}`,
      loc: GeneratedSource,
    },
  );

  for (const [id, node] of nodes) {
    const assumedNonNullObjects = Set_union(
      assertNonNull(fromEntry.get(id)),
      assertNonNull(fromExit.get(id)),
    );
    node.assumedNonNullObjects = assumedNonNullObjects;
  }
}

export function assertNonNull<T extends NonNullable<U>, U>(
  value: T | null | undefined,
  source?: string,
): T {
  CompilerError.invariant(value != null, {
    reason: 'Unexpected null',
    description: source != null ? `(from ${source})` : null,
    loc: GeneratedSource,
  });
  return value;
}
