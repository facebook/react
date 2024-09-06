import {CompilerError} from '../CompilerError';
import {inMutableRange} from '../ReactiveScopes/InferReactiveScopeVariables';
import {Set_intersect, Set_union, getOrInsertDefault} from '../Utils/utils';
import {
  BasicBlock,
  BlockId,
  DeclarationId,
  GeneratedSource,
  HIRFunction,
  Identifier,
  Place,
  ReactiveScopeDependency,
  ScopeId,
} from './HIR';

type CollectHoistablePropertyLoadsResult = {
  nodes: Map<ScopeId, BlockInfo>;
  temporaries: Map<Identifier, Identifier>;
  properties: Map<Identifier, ReactiveScopeDependency>;
};

export function collectHoistablePropertyLoads(
  fn: HIRFunction,
  usedOutsideDeclaringScope: Set<DeclarationId>,
): CollectHoistablePropertyLoadsResult {
  const sidemap = new TemporariesSideMap();

  const nodes = collectNodes(fn, usedOutsideDeclaringScope, sidemap);
  deriveNonNull(fn, nodes);

  const nodesKeyedByScopeId = new Map<ScopeId, BlockInfo>();
  for (const [_, block] of fn.body.blocks) {
    if (block.terminal.kind === 'scope') {
      nodesKeyedByScopeId.set(
        block.terminal.scope.id,
        nodes.get(block.terminal.block)!,
      );
    }
  }

  return {
    nodes: nodesKeyedByScopeId,
    temporaries: sidemap.temporaries,
    properties: sidemap.properties,
  };
}

export type BlockInfo = {
  block: BasicBlock;
  assumedNonNullObjects: Set<PropertyLoadNode>;
};

export function getProperty(
  object: Place,
  propertyName: string,
  temporaries: ReadonlyMap<Identifier, Identifier>,
  properties: ReadonlyMap<Identifier, ReactiveScopeDependency>,
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
  const resolvedObject = resolveTemporary(object, temporaries);
  const resolvedDependency = properties.get(resolvedObject);

  /**
   * (2) Push the last PropertyLoad
   * TODO(mofeiZ): understand optional chaining
   */
  let property: ReactiveScopeDependency;
  if (resolvedDependency == null) {
    property = {
      identifier: resolvedObject,
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
  temporaries: ReadonlyMap<Identifier, Identifier>,
): Identifier {
  return temporaries.get(place.identifier) ?? place.identifier;
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
    CompilerError.invariant(n.path.length > 0, {
      reason:
        '[CollectHoistablePropertyLoads] Expected property node, found root node',
      loc: GeneratedSource,
    });
    /**
     * We add ReactiveScopeDependencies according to instruction ordering,
     * so all subpaths of a PropertyLoad should already exist
     * (e.g. a.b is added before a.b.c),
     */
    let currNode = this.#getOrCreateRoot(n.identifier);
    for (let i = 0; i < n.path.length - 1; i++) {
      currNode = assertNonNull(currNode.properties.get(n.path[i].property));
    }

    return Tree.#getOrCreateProperty(currNode, n.path.at(-1)!.property);
  }
}

class TemporariesSideMap {
  temporaries: Map<Identifier, Identifier> = new Map();
  properties: Map<Identifier, ReactiveScopeDependency> = new Map();
  tree: Tree = new Tree();

  declareTemporary(from: Identifier, to: Identifier): void {
    this.temporaries.set(from, to);
  }

  declareProperty(from: Identifier, to: ReactiveScopeDependency): void {
    this.properties.set(from, to);
  }
}

function collectNodes(
  fn: HIRFunction,
  usedOutsideDeclaringScope: Set<DeclarationId>,
  c: TemporariesSideMap,
): Map<BlockId, BlockInfo> {
  const knownImmutableIdentifiers = new Set<Identifier>();
  if (fn.fnType === 'Component' || fn.fnType === 'Hook') {
    for (const p of fn.params) {
      if (p.kind === 'Identifier') {
        knownImmutableIdentifiers.add(p.identifier);
      }
    }
  }
  const nodes = new Map<BlockId, BlockInfo>();
  for (const [blockId, block] of fn.body.blocks) {
    const assumedNonNullObjects = new Set<PropertyLoadNode>();
    for (const instr of block.instructions) {
      const {value, lvalue} = instr;
      const usedOutside = usedOutsideDeclaringScope.has(
        lvalue.identifier.declarationId,
      );
      if (value.kind === 'PropertyLoad') {
        const property = getProperty(
          value.object,
          value.property,
          c.temporaries,
          c.properties,
        );
        if (!usedOutside) {
          c.declareProperty(lvalue.identifier, property);
        }
        const propertyNode = c.tree.getPropertyLoadNode(property);
        /**
         * Since this runs *after* buildReactiveScopeTerminals, identifier mutable ranges
         * are not valid with respect to current instruction id numbering.
         * We use attached reactive scope ranges as a proxy for mutable range, but this
         * is an overestimate as (1) scope ranges merge and align to form valid program
         * blocks and (2) passes like MemoizeFbtAndMacroOperands may assign scopes to
         * non-mutable identifiers.
         *
         * Due to current limitations of mutable range inference, there are edge cases in
         * which we infer known-immutable values (e.g. props or hook params) to have a
         * mutable range and scope.
         * (see `destructure-array-declaration-to-context-var` fixture)
         */
        const isMutableAtInstr =
          value.object.identifier.mutableRange.end >
            value.object.identifier.mutableRange.start + 1 &&
          value.object.identifier.scope != null &&
          inMutableRange(instr, value.object.identifier.scope.range);
        if (
          !isMutableAtInstr ||
          knownImmutableIdentifiers.has(propertyNode.fullPath.identifier)
        ) {
          let curr = propertyNode.parent;
          while (curr != null) {
            assumedNonNullObjects.add(curr);
            curr = curr.parent;
          }
        }
      } else if (value.kind === 'LoadLocal') {
        if (
          lvalue.identifier.name == null &&
          value.place.identifier.name !== null &&
          !usedOutside
        ) {
          c.declareTemporary(lvalue.identifier, value.place.identifier);
        }
      }
    }

    nodes.set(blockId, {
      block,
      assumedNonNullObjects,
    });
  }
  return nodes;
}

function deriveNonNull(fn: HIRFunction, nodes: Map<BlockId, BlockInfo>): void {
  const succ = new Map<BlockId, Set<BlockId>>();
  const terminalPreds = new Set<BlockId>();

  for (const [blockId, block] of fn.body.blocks) {
    for (const pred of block.preds) {
      const predVal = getOrInsertDefault(succ, pred, new Set());
      predVal.add(blockId);
    }
    if (block.terminal.kind === 'throw' || block.terminal.kind === 'return') {
      terminalPreds.add(blockId);
    }
  }

  function recursivelyDeriveNonNull(
    nodeId: BlockId,
    kind: 'succ' | 'pred',
    traversalState: Map<BlockId, 'active' | 'done'>,
    result: Map<BlockId, Set<PropertyLoadNode>>,
  ): boolean {
    if (traversalState.has(nodeId)) {
      return false;
    }
    traversalState.set(nodeId, 'active');

    const node = nodes.get(nodeId);
    if (node == null) {
      CompilerError.invariant(false, {
        reason: `Bad node ${nodeId}, kind: ${kind}`,
        loc: GeneratedSource,
      });
    }
    const neighbors = Array.from(
      kind === 'succ' ? (succ.get(nodeId) ?? []) : node.block.preds,
    );

    let changed = false;
    for (const pred of neighbors) {
      if (!traversalState.has(pred)) {
        const neighborChanged = recursivelyDeriveNonNull(
          pred,
          kind,
          traversalState,
          result,
        );
        changed ||= neighborChanged;
      }
    }
    /**
     * Active neighbors can be filtered out as we're solving for the following
     * relation.
     * X = Intersect(X_neighbors, X)
     * Non-active neighbors with no recorded results can occur due to backedges.
     * it's not safe to assume they can be filtered out (e.g. not intersected)
     */
    const neighborAccesses = Set_intersect([
      ...(Array.from(neighbors)
        .filter(n => traversalState.get(n) === 'done')
        .map(n => result.get(n) ?? new Set()) as Array<Set<PropertyLoadNode>>),
    ]);

    const prevSize = result.get(nodeId)?.size;
    result.set(nodeId, Set_union(node.assumedNonNullObjects, neighborAccesses));
    traversalState.set(nodeId, 'done');

    changed ||= prevSize !== result.get(nodeId)!.size;
    CompilerError.invariant(
      prevSize == null || prevSize <= result.get(nodeId)!.size,
      {
        reason: '[CollectHoistablePropertyLoads] Nodes shrank!',
        description: `${nodeId} ${kind} ${prevSize} ${
          result.get(nodeId)!.size
        }`,
        loc: GeneratedSource,
      },
    );
    return changed;
  }
  const fromEntry = new Map<BlockId, Set<PropertyLoadNode>>();
  const fromExit = new Map<BlockId, Set<PropertyLoadNode>>();
  let changed = true;
  const traversalState = new Map<BlockId, 'done' | 'active'>();
  const reversedBlocks = [...fn.body.blocks];
  reversedBlocks.reverse();
  let i = 0;

  while (changed) {
    i++;
    changed = false;
    for (const [blockId] of fn.body.blocks) {
      const changed_ = recursivelyDeriveNonNull(
        blockId,
        'pred',
        traversalState,
        fromEntry,
      );
      changed ||= changed_;
    }
    traversalState.clear();
    for (const [blockId] of reversedBlocks) {
      const changed_ = recursivelyDeriveNonNull(
        blockId,
        'succ',
        traversalState,
        fromExit,
      );
      changed ||= changed_;
    }
    traversalState.clear();
  }

  // TODO: I can't come up with a case that requires fixed-point iteration
  CompilerError.invariant(i === 2, {
    reason: 'require fixed-point iteration',
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
    node.assumedNonNullObjects = Set_union(
      assertNonNull(fromEntry.get(id)),
      assertNonNull(fromExit.get(id)),
    );
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
