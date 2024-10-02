import {CompilerError} from '../CompilerError';
import {inRange} from '../ReactiveScopes/InferReactiveScopeVariables';
import {
  Set_equal,
  Set_filter,
  Set_intersect,
  Set_union,
  getOrInsertDefault,
} from '../Utils/utils';
import {
  BasicBlock,
  BlockId,
  DependencyPathEntry,
  GeneratedSource,
  HIRFunction,
  Identifier,
  IdentifierId,
  InstructionValue,
  ReactiveScopeDependency,
  ScopeId,
} from './HIR';

/**
 * Helper function for `PropagateScopeDependencies`. Uses control flow graph
 * analysis to determine which `Identifier`s can be assumed to be non-null
 * objects, on a per-block basis.
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
 * Note that we currently do NOT account for mutable / declaration range when
 * doing the CFG-based traversal, producing results that are technically
 * incorrect but filtered by PropagateScopeDeps (which only takes dependencies
 * on constructed value -- i.e. a scope's dependencies must have mutable ranges
 * ending earlier than the scope start).
 *
 * Take this example, this function will infer x.foo.bar as non-nullable for
 * bb0, via the intersection of bb1 & bb2 which in turn comes from bb3. This is
 * technically incorrect bb0 is before / during x's mutable range.
 * ```
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
 * ```
 *
 * @param fn
 * @param temporaries sidemap of identifier -> baseObject.a.b paths. Does not
 * contain optional chains.
 * @param hoistableFromOptionals sidemap of optionalBlock -> baseObject?.a
 * optional paths for which it's safe to evaluate non-optional loads (see
 * CollectOptionalChainDependencies).
 * @returns
 */
export function collectHoistablePropertyLoads(
  fn: HIRFunction,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
  hoistableFromOptionals: ReadonlyMap<BlockId, ReactiveScopeDependency>,
): ReadonlyMap<ScopeId, BlockInfo> {
  const registry = new PropertyPathRegistry();

  const nodes = collectNonNullsInBlocks(
    fn,
    temporaries,
    hoistableFromOptionals,
    registry,
  );
  propagateNonNull(fn, nodes, registry);

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
  assumedNonNullObjects: ReadonlySet<PropertyPathNode>;
};

/**
 * PropertyLoadRegistry data structure to dedupe property loads (e.g. a.b.c)
 * and make computing sets intersections simpler.
 */
type RootNode = {
  properties: Map<string, PropertyPathNode>;
  optionalProperties: Map<string, PropertyPathNode>;
  parent: null;
  // Recorded to make later computations simpler
  fullPath: ReactiveScopeDependency;
  hasOptional: boolean;
  root: IdentifierId;
};

type PropertyPathNode =
  | {
      properties: Map<string, PropertyPathNode>;
      optionalProperties: Map<string, PropertyPathNode>;
      parent: PropertyPathNode;
      fullPath: ReactiveScopeDependency;
      hasOptional: boolean;
    }
  | RootNode;

class PropertyPathRegistry {
  roots: Map<IdentifierId, RootNode> = new Map();

  getOrCreateIdentifier(identifier: Identifier): PropertyPathNode {
    /**
     * Reads from a statically scoped variable are always safe in JS,
     * with the exception of TDZ (not addressed by this pass).
     */
    let rootNode = this.roots.get(identifier.id);

    if (rootNode === undefined) {
      rootNode = {
        root: identifier.id,
        properties: new Map(),
        optionalProperties: new Map(),
        fullPath: {
          identifier,
          path: [],
        },
        hasOptional: false,
        parent: null,
      };
      this.roots.set(identifier.id, rootNode);
    }
    return rootNode;
  }

  static getOrCreatePropertyEntry(
    parent: PropertyPathNode,
    entry: DependencyPathEntry,
  ): PropertyPathNode {
    const map = entry.optional ? parent.optionalProperties : parent.properties;
    let child = map.get(entry.property);
    if (child == null) {
      child = {
        properties: new Map(),
        optionalProperties: new Map(),
        parent: parent,
        fullPath: {
          identifier: parent.fullPath.identifier,
          path: parent.fullPath.path.concat(entry),
        },
        hasOptional: parent.hasOptional || entry.optional,
      };
      map.set(entry.property, child);
    }
    return child;
  }

  getOrCreateProperty(n: ReactiveScopeDependency): PropertyPathNode {
    /**
     * We add ReactiveScopeDependencies according to instruction ordering,
     * so all subpaths of a PropertyLoad should already exist
     * (e.g. a.b is added before a.b.c),
     */
    let currNode = this.getOrCreateIdentifier(n.identifier);
    if (n.path.length === 0) {
      return currNode;
    }
    for (let i = 0; i < n.path.length - 1; i++) {
      currNode = PropertyPathRegistry.getOrCreatePropertyEntry(
        currNode,
        n.path[i],
      );
    }

    return PropertyPathRegistry.getOrCreatePropertyEntry(
      currNode,
      n.path.at(-1)!,
    );
  }
}

function getMaybeNonNullInInstruction(
  instr: InstructionValue,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
  registry: PropertyPathRegistry,
): PropertyPathNode | null {
  let path = null;
  if (instr.kind === 'PropertyLoad') {
    path = temporaries.get(instr.object.identifier.id) ?? {
      identifier: instr.object.identifier,
      path: [],
    };
  } else if (instr.kind === 'Destructure') {
    path = temporaries.get(instr.value.identifier.id) ?? null;
  } else if (instr.kind === 'ComputedLoad') {
    path = temporaries.get(instr.object.identifier.id) ?? null;
  }
  return path != null ? registry.getOrCreateProperty(path) : null;
}

function collectNonNullsInBlocks(
  fn: HIRFunction,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
  hoistableFromOptionals: ReadonlyMap<BlockId, ReactiveScopeDependency>,
  registry: PropertyPathRegistry,
): ReadonlyMap<BlockId, BlockInfo> {
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
  const knownNonNullIdentifiers = new Set<PropertyPathNode>();
  if (
    fn.fnType === 'Component' &&
    fn.params.length > 0 &&
    fn.params[0].kind === 'Identifier'
  ) {
    const identifier = fn.params[0].identifier;
    knownNonNullIdentifiers.add(registry.getOrCreateIdentifier(identifier));
  }
  const nodes = new Map<BlockId, BlockInfo>();
  for (const [_, block] of fn.body.blocks) {
    const assumedNonNullObjects = new Set<PropertyPathNode>(
      knownNonNullIdentifiers,
    );

    const maybeOptionalChain = hoistableFromOptionals.get(block.id);
    if (maybeOptionalChain != null) {
      assumedNonNullObjects.add(
        registry.getOrCreateProperty(maybeOptionalChain),
      );
    }
    for (const instr of block.instructions) {
      const maybeNonNull = getMaybeNonNullInInstruction(
        instr.value,
        temporaries,
        registry,
      );
      if (maybeNonNull != null) {
        const baseIdentifier = maybeNonNull.fullPath.identifier;
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
          baseIdentifier.mutableRange.end >
            baseIdentifier.mutableRange.start + 1 &&
          baseIdentifier.scope != null &&
          inRange(
            {
              id: instr.id,
            },
            baseIdentifier.scope.range,
          );
        if (
          !isMutableAtInstr ||
          knownImmutableIdentifiers.has(baseIdentifier.id)
        ) {
          assumedNonNullObjects.add(maybeNonNull);
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
  registry: PropertyPathRegistry,
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
        .map(n => assertNonNull(nodes.get(n)).assumedNonNullObjects),
    );

    const prevObjects = assertNonNull(nodes.get(nodeId)).assumedNonNullObjects;
    const mergedObjects = Set_union(prevObjects, neighborAccesses);
    reduceMaybeOptionalChains(mergedObjects, registry);

    assertNonNull(nodes.get(nodeId)).assumedNonNullObjects = mergedObjects;
    traversalState.set(nodeId, 'done');
    /**
     * Note that it's not sufficient to compare set sizes since
     * reduceMaybeOptionalChains may replace optional-chain loads with
     * unconditional loads. This could in turn change `assumedNonNullObjects` of
     * downstream blocks and backedges.
     */
    changed ||= !Set_equal(prevObjects, mergedObjects);
    return changed;
  }
  const traversalState = new Map<BlockId, 'done' | 'active'>();
  const reversedBlocks = [...fn.body.blocks];
  reversedBlocks.reverse();

  let changed;
  let i = 0;
  do {
    CompilerError.invariant(i++ < 100, {
      reason:
        '[CollectHoistablePropertyLoads] fixed point iteration did not terminate after 100 loops',
      loc: GeneratedSource,
    });

    changed = false;
    for (const [blockId] of fn.body.blocks) {
      const forwardChanged = recursivelyPropagateNonNull(
        blockId,
        'forward',
        traversalState,
      );
      changed ||= forwardChanged;
    }
    traversalState.clear();
    for (const [blockId] of reversedBlocks) {
      const backwardChanged = recursivelyPropagateNonNull(
        blockId,
        'backward',
        traversalState,
      );
      changed ||= backwardChanged;
    }
    traversalState.clear();
  } while (changed);
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

/**
 * Any two optional chains with different operations . vs ?. but the same set of
 * property strings paths de-duplicates.
 *
 * Intuitively: given <base>?.b, we know <base> to be either hoistable or not.
 * If unconditional reads from <base> are hoistable, we can replace all
 * <base>?.PROPERTY_STRING subpaths with <base>.PROPERTY_STRING
 */
function reduceMaybeOptionalChains(
  nodes: Set<PropertyPathNode>,
  registry: PropertyPathRegistry,
): void {
  let optionalChainNodes = Set_filter(nodes, n => n.hasOptional);
  if (optionalChainNodes.size === 0) {
    return;
  }
  let changed: boolean;
  do {
    changed = false;

    for (const original of optionalChainNodes) {
      let {identifier, path: origPath} = original.fullPath;
      let currNode: PropertyPathNode =
        registry.getOrCreateIdentifier(identifier);
      for (let i = 0; i < origPath.length; i++) {
        const entry = origPath[i];
        // If the base is known to be non-null, replace with a non-optional load
        const nextEntry: DependencyPathEntry =
          entry.optional && nodes.has(currNode)
            ? {property: entry.property, optional: false}
            : entry;
        currNode = PropertyPathRegistry.getOrCreatePropertyEntry(
          currNode,
          nextEntry,
        );
      }
      if (currNode !== original) {
        changed = true;
        optionalChainNodes.delete(original);
        optionalChainNodes.add(currNode);
        nodes.delete(original);
        nodes.add(currNode);
      }
    }
  } while (changed);
}
