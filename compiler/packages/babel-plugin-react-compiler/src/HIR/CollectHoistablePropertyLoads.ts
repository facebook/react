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
  Place,
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
  assumedNonNullObjects: ReadonlySet<PropertyLoadNode>;
};

export function getProperty(
  object: Place,
  propertyName: string,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
): ReactiveScopeDependency {
  /*
   * (1) Get the base object either from the temporary sidemap (e.g. a LoadLocal)
   * or a deep copy of an existing property dependency.
   *  Example 1:
   *    $0 = LoadLocal x
   *    $1 = PropertyLoad $0.y
   *  getProperty($0, ...) -> resolvedObject = x, resolvedDependency = null
   *
   *  Example 2:
   *    $0 = LoadLocal x
   *    $1 = PropertyLoad $0.y
   *    $2 = PropertyLoad $1.z
   *  getProperty($1, ...) -> resolvedObject = null, resolvedDependency = x.y
   *
   *  Example 3:
   *    $0 = Call(...)
   *    $1 = PropertyLoad $0.y
   *  getProperty($0, ...) -> resolvedObject = null, resolvedDependency = null
   */
  const resolvedDependency = temporaries.get(object.identifier.id);

  /**
   * (2) Push the last PropertyLoad
   * TODO(mofeiZ): understand optional chaining
   */
  let property: ReactiveScopeDependency;
  if (resolvedDependency == null) {
    property = {
      identifier: object.identifier,
      path: [{property: propertyName, optional: false}],
    };
  } else {
    property = {
      identifier: resolvedDependency.identifier,
      path: [
        ...resolvedDependency.path,
        {property: propertyName, optional: false},
      ],
    };
  }
  return property;
}

export function resolveTemporary(
  place: Place,
  temporaries: ReadonlyMap<IdentifierId, Identifier>,
): Identifier {
  return temporaries.get(place.identifier.id) ?? place.identifier;
}

/**
 * Tree data structure to dedupe property loads (e.g. a.b.c)
 * and make computing sets intersections simpler.
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

  getOrCreateRoot(identifier: Identifier): PropertyLoadNode {
    /**
     * Reads from a statically scoped variable are always safe in JS,
     * with the exception of TDZ (not addressed by this pass).
     */
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

  static #getOrCreateProperty(
    node: PropertyLoadNode,
    property: string,
  ): PropertyLoadNode {
    let child = node.properties.get(property);
    if (child == null) {
      child = {
        properties: new Map(),
        parent: node,
        fullPath: {
          identifier: node.fullPath.identifier,
          path: node.fullPath.path.concat([{property, optional: false}]),
        },
      };
      node.properties.set(property, child);
    }
    return child;
  }

  getPropertyLoadNode(n: ReactiveScopeDependency): PropertyLoadNode {
    /**
     * We add ReactiveScopeDependencies according to instruction ordering,
     * so all subpaths of a PropertyLoad should already exist
     * (e.g. a.b is added before a.b.c),
     */
    let currNode = this.getOrCreateRoot(n.identifier);
    if (n.path.length === 0) {
      return currNode;
    }
    for (let i = 0; i < n.path.length - 1; i++) {
      currNode = assertNonNull(currNode.properties.get(n.path[i].property));
    }

    return Tree.#getOrCreateProperty(currNode, n.path.at(-1)!.property);
  }
}

function pushPropertyLoadNode(
  loadSource: Identifier,
  loadSourceNode: PropertyLoadNode,
  instrId: InstructionId,
  knownImmutableIdentifiers: Set<IdentifierId>,
  result: Set<PropertyLoadNode>,
): void {
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
    loadSource.mutableRange.end > loadSource.mutableRange.start + 1 &&
    loadSource.scope != null &&
    inRange({id: instrId}, loadSource.scope.range);
  if (
    !isMutableAtInstr ||
    knownImmutableIdentifiers.has(loadSourceNode.fullPath.identifier.id)
  ) {
    let curr: PropertyLoadNode | null = loadSourceNode;
    while (curr != null) {
      result.add(curr);
      curr = curr.parent;
    }
  }
}

function collectNonNullsInBlocks(
  fn: HIRFunction,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
): ReadonlyMap<BlockId, BlockInfo> {
  const tree = new Tree();
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
  const knownNonNullIdentifiers = new Set<PropertyLoadNode>();
  if (
    fn.fnType === 'Component' &&
    fn.params.length > 0 &&
    fn.params[0].kind === 'Identifier'
  ) {
    const identifier = fn.params[0].identifier;
    knownNonNullIdentifiers.add(tree.getOrCreateRoot(identifier));
  }
  const nodes = new Map<BlockId, BlockInfo>();
  for (const [_, block] of fn.body.blocks) {
    const assumedNonNullObjects = new Set<PropertyLoadNode>(
      knownNonNullIdentifiers,
    );
    for (const instr of block.instructions) {
      if (instr.value.kind === 'PropertyLoad') {
        const source = temporaries.get(instr.value.object.identifier.id) ?? {
          identifier: instr.value.object.identifier,
          path: [],
        };
        pushPropertyLoadNode(
          instr.value.object.identifier,
          tree.getPropertyLoadNode(source),
          instr.id,
          knownImmutableIdentifiers,
          assumedNonNullObjects,
        );
      } else if (instr.value.kind === 'Destructure') {
        const source = instr.value.value.identifier.id;
        const sourceNode = temporaries.get(source);
        if (sourceNode != null) {
          pushPropertyLoadNode(
            instr.value.value.identifier,
            tree.getPropertyLoadNode(sourceNode),
            instr.id,
            knownImmutableIdentifiers,
            assumedNonNullObjects,
          );
        }
      } else if (instr.value.kind === 'ComputedLoad') {
        const source = instr.value.object.identifier.id;
        const sourceNode = temporaries.get(source);
        if (sourceNode != null) {
          pushPropertyLoadNode(
            instr.value.object.identifier,
            tree.getPropertyLoadNode(sourceNode),
            instr.id,
            knownImmutableIdentifiers,
            assumedNonNullObjects,
          );
        }
      }
    }

    nodes.set(block.id, {
      block,
      assumedNonNullObjects,
    });
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
    nonNullObjectsByBlock: Map<BlockId, ReadonlySet<PropertyLoadNode>>,
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
  const fromEntry = new Map<BlockId, ReadonlySet<PropertyLoadNode>>();
  const fromExit = new Map<BlockId, ReadonlySet<PropertyLoadNode>>();
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

function assertNonNull<T extends NonNullable<U>, U>(
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
