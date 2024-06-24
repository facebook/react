import invariant from "invariant";
import {
  BasicBlock,
  BlockId,
  GeneratedSource,
  HIRFunction,
  Identifier,
  IdentifierId,
  Instruction,
  InstructionId,
  InstructionKind,
  Place,
  ReactiveScope,
  ReactiveScopeDependency,
  ScopeId,
  isObjectMethodType,
  isRefValueType,
  isUseRefType,
  makeInstructionId,
} from ".";
import { CompilerError } from "../CompilerError";
import { Set_intersect, Set_union, getOrInsertDefault } from "../Utils/utils";
import { printIdentifier } from "./PrintHIR";
import {
  eachInstructionOperand,
  eachInstructionValueOperand,
  eachPatternOperand,
  eachTerminalOperand,
} from "./visitors";
import { Stack, empty } from "../Utils/Stack";
import { ReactiveScopeDependencyTreeHIR as ReactiveScopeDependencyTree } from "./DeriveMinimalDependenciesHIR";
import { isMutable } from "../ReactiveScopes/InferReactiveScopeVariables";

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
  for (const res of [...result]) {
    let curr = loads.get(res);
    while (curr != null) {
      result.add(curr);
      curr = loads.get(curr);
    }
  }
  return result;
}

type DependencyRoot = {
  properties: Map<string, DependencyNode>;
  parent: null;
  root: Identifier;
};

export type DependencyNode =
  | {
      properties: Map<string, DependencyNode>;
      parent: DependencyNode;
    }
  | DependencyRoot;

export function llog(..._args: any): void {
  console.log(..._args);
}
class Tree {
  roots: Map<Identifier, DependencyRoot> = new Map();

  #getOrCreateRoot(identifier: Identifier): DependencyNode {
    // roots can always be accessed unconditionally in JS
    let rootNode = this.roots.get(identifier);

    if (rootNode === undefined) {
      rootNode = {
        root: identifier,
        properties: new Map(),
        parent: null,
      };
      this.roots.set(identifier, rootNode);
    }
    return rootNode;
  }

  static getOrMakeProperty(
    node: DependencyNode,
    property: string
  ): DependencyNode {
    let child = node.properties.get(property);
    if (child == null) {
      child = {
        properties: new Map(),
        parent: node,
      };
      node.properties.set(property, child);
    }
    return child;
  }

  add(n: ReactiveScopeDependency): DependencyNode {
    let currNode = this.#getOrCreateRoot(n.identifier);
    for (const property of n.path) {
      currNode = Tree.getOrMakeProperty(currNode, property);
    }
    return currNode;
  }
}

export type TNode = {
  blockId: BlockId;
  instrs: Set<InstructionId>;
  preds: Set<BlockId>;
  assumedNonNullObjects: Set<DependencyNode>;
  normalizedNonNullObjects: Set<DependencyNode>;
};

// Assumed non-null loads
export type TResult = {
  nodes: Map<BlockId, TNode>;
  temporaries: Map<Identifier, Identifier>;
  properties: Map<Identifier, ReactiveScopeDependency>;
};

class CollectResult {
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
  ): DependencyNode {
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

export function printDependencyNode(node: DependencyNode): string {
  let names: Array<string> = [];
  let curr: DependencyNode | null = node;
  while (curr != null) {
    if (curr.parent == null) {
      names.push(printIdentifier(curr.root));
    } else {
      let found = false;
      for (const [propName, propNode] of curr.parent.properties) {
        if (curr === propNode) {
          found = true;
          names.push(propName);
          break;
        }
      }
      CompilerError.invariant(found, {
        reason: "Could not find node in parent",
        loc: GeneratedSource,
      });
    }
    curr = curr.parent;
  }
  names.reverse();
  return names.join(".");
}

export function printBlockNode(node: TNode): string {
  return (
    "[" +
    [...node.normalizedNonNullObjects]
      .map((n) => {
        return printDependencyNode(n);
      })
      .join("  ") +
    "]"
  );
}

function collectNodes(
  fn: HIRFunction,
  functionExprRvals: Set<IdentifierId>,
  usedOutsideDeclaringScope: Set<IdentifierId>,
  c: CollectResult
): Map<BlockId, TNode> {
  const nodes = new Map<BlockId, TNode>();
  for (const [blockId, block] of fn.body.blocks) {
    const instrs = new Set<InstructionId>();
    const assumedNonNullObjects = new Set<DependencyNode>();
    for (const instr of block.instructions) {
      const { id, value, lvalue } = instr;
      instrs.add(id);
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
    }

    instrs.add(block.terminal.id);

    nodes.set(blockId, {
      blockId,
      instrs,
      preds: block.preds,
      assumedNonNullObjects,
      normalizedNonNullObjects: new Set(),
    });
  }
  return nodes;
}

export function assertNonNull<T extends NonNullable<U>, U>(
  value: T | null | undefined
): T {
  invariant(value != null, "Unexpected null");
  return value;
}

function deriveNonNull(fn: HIRFunction, nodes: Map<BlockId, TNode>): void {
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
    result: Map<BlockId, Set<DependencyNode>>
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
    // non-active neighbors with no recorded results can occur due to backedges.
    // it's not safe to assume they can be filtered out (e.g. not intersected)
    const neighborAccesses = Set_intersect([
      ...(Array.from(neighbors)
        .filter((n) => traversalState.get(n) !== "active")
        .map((n) => result.get(n) ?? new Set()) as Array<Set<DependencyNode>>),
    ]);

    const prevSize = result.get(nodeId)?.size;
    const prevPrinted = [...(result.get(nodeId) ?? [])].map(
      printDependencyNode
    );
    result.set(nodeId, Set_union(node.assumedNonNullObjects, neighborAccesses));
    traversalState.set(nodeId, "done");

    const newPrinted = [...(result.get(nodeId) ?? [])].map(printDependencyNode);
    // llog("  - ", nodeId, prevPrinted, newPrinted);

    changed ||= prevSize !== result.get(nodeId)!.size;
    invariant(
      prevSize == null || prevSize <= result.get(nodeId)!.size,
      "nodes shrank! " +
        `${nodeId} ${kind} ${prevSize} ${
          result.get(nodeId)!.size
        } ${prevPrinted}`
    );
    return changed;
  }
  const fromEntry = new Map<BlockId, Set<DependencyNode>>();
  const fromExit = new Map<BlockId, Set<DependencyNode>>();
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

function normalizeNonNull(nodes: Map<BlockId, TNode>): void {
  for (const {
    assumedNonNullObjects,
    normalizedNonNullObjects,
  } of nodes.values()) {
    outer: for (const node of assumedNonNullObjects) {
      for (const propertyNode of node.properties.values()) {
        if (assumedNonNullObjects.has(propertyNode)) {
          continue outer;
        }
      }
      normalizedNonNullObjects.add(node);
    }
  }
}

type TemporariesUsedOutsideDefiningScope = {
  /*
   * tracks all relevant temporary declarations (currently LoadLocal and PropertyLoad)
   * and the scope where they are defined
   */
  declarations: Map<IdentifierId, ScopeId>;
  // temporaries used outside of their defining scope
  usedOutsideDeclaringScope: Set<IdentifierId>;
};

function handlePlace(
  activeScopes: Array<ScopeId>,
  prunedScopes: Set<ScopeId>,
  state: TemporariesUsedOutsideDefiningScope,
  place: Place
): void {
  const declaringScope = state.declarations.get(place.identifier.id);
  if (
    declaringScope != null &&
    activeScopes.indexOf(declaringScope) === -1 &&
    !prunedScopes.has(declaringScope)
  ) {
    // Declaring scope is not active === used outside declaring scope
    state.usedOutsideDeclaringScope.add(place.identifier.id);
  }
}

function handleInstruction(
  activeScopes: Array<ScopeId>,
  prunedScopes: Set<ScopeId>,
  state: TemporariesUsedOutsideDefiningScope,
  instr: Instruction
): void {
  const scope = activeScopes.at(-1);
  if (scope === undefined || prunedScopes.has(scope)) {
    return;
  }
  switch (instr.value.kind) {
    case "LoadLocal":
    case "LoadContext":
    case "PropertyLoad": {
      state.declarations.set(instr.lvalue.identifier.id, scope);
      break;
    }
    default: {
      break;
    }
  }
}

class ScopeBlockTraversal<TContext, TState> {
  #blockMap: Map<
    BlockId,
    | {
        kind: "end";
        scope: ReactiveScope;
        pruned: boolean;
        state: TState;
      }
    | {
        kind: "begin";
        scope: ReactiveScope;
        pruned: boolean;
        fallthrough: BlockId;
      }
  > = new Map();
  #context: TContext;
  #enterCallback: (
    scope: ReactiveScope,
    pruned: boolean,
    context: TContext
  ) => TState;
  #exitCallback:
    | ((
        scope: ReactiveScope,
        pruned: boolean,
        context: TContext,
        state: TState
      ) => void)
    | null;
  activeScopes: Array<ScopeId> = [];
  prunedScopes: Set<ScopeId> = new Set();

  constructor(
    context: TContext,
    enter: (scope: ReactiveScope, pruned: boolean, context: TContext) => TState,
    exit:
      | ((
          scope: ReactiveScope,
          pruned: boolean,
          context: TContext,
          state: TState
        ) => void)
      | null
  ) {
    this.#context = context;
    this.#enterCallback = enter;
    this.#exitCallback = exit;
  }

  handleBlock(block: BasicBlock): void {
    const blockInfo = this.#blockMap.get(block.id);
    if (blockInfo != null) {
      this.#blockMap.delete(block.id);
      if (blockInfo.kind === "begin") {
        this.activeScopes.push(blockInfo.scope.id);
        const state = this.#enterCallback(
          blockInfo.scope,
          blockInfo.pruned,
          this.#context
        );

        this.#blockMap.set(blockInfo.fallthrough, {
          kind: "end",
          scope: blockInfo.scope,
          pruned: blockInfo.pruned,
          state,
        });
      } else {
        const top = this.activeScopes.at(-1);
        CompilerError.invariant(blockInfo.scope.id === top, {
          reason: "Expected matching scope fallthrough",
          loc: block.instructions[0]?.loc ?? block.terminal.id,
        });
        this.activeScopes.pop();
        this.#exitCallback?.(
          blockInfo.scope,
          blockInfo.pruned,
          this.#context,
          blockInfo.state
        );
      }
    }

    if (
      block.terminal.kind === "scope" ||
      block.terminal.kind === "pruned-scope"
    ) {
      const isPruned = block.terminal.kind === "pruned-scope";
      if (isPruned) {
        this.prunedScopes.add(block.terminal.scope.id);
      }
      this.#blockMap.set(block.terminal.block, {
        kind: "begin",
        scope: block.terminal.scope,
        pruned: isPruned,
        fallthrough: block.terminal.fallthrough,
      });
    }
  }
}

function findPromotedTemporaries(
  fn: HIRFunction,
  escapingTemporaries: TemporariesUsedOutsideDefiningScope
): void {
  const scopeTraversal = new ScopeBlockTraversal<void, void>(
    undefined,
    () => undefined,
    null
  );
  const activeScopes = scopeTraversal.activeScopes;
  const prunedScopes = scopeTraversal.prunedScopes;

  for (const [_, block] of fn.body.blocks) {
    // Handle scopes that begin or end at this block
    scopeTraversal.handleBlock(block);
    for (const instr of block.instructions) {
      for (const place of eachInstructionOperand(instr)) {
        handlePlace(activeScopes, prunedScopes, escapingTemporaries, place);
      }
      handleInstruction(activeScopes, prunedScopes, escapingTemporaries, instr);
    }

    for (const place of eachTerminalOperand(block.terminal)) {
      handlePlace(activeScopes, prunedScopes, escapingTemporaries, place);
    }
  }
}

type Decl = {
  id: InstructionId;
  scope: Stack<ReactiveScope>;
};

class Context {
  #temporariesUsedOutsideScope: Set<IdentifierId>;
  #declarations: Map<IdentifierId, Decl> = new Map();
  #reassignments: Map<Identifier, Decl> = new Map();
  // Reactive dependencies used in the current reactive scope.
  #dependencies: Array<ReactiveScopeDependency> = [];
  /*
   * We keep a sidemap for temporaries created by PropertyLoads, and do
   * not store any control flow (i.e. #inConditionalWithinScope) here.
   *  - a ReactiveScope (A) containing a PropertyLoad may differ from the
   *    ReactiveScope (B) that uses the produced temporary.
   *  - codegen will inline these PropertyLoads back into scope (B)
   */
  #nodes: Map<BlockId, TNode>;
  #properties: Map<Identifier, ReactiveScopeDependency>;
  #temporaries: Map<Identifier, Identifier>;
  #scopes: Stack<ReactiveScope> = empty();
  deps: Map<ReactiveScope, ReactiveScopeDependencyTree> = new Map();

  get properties(): Map<Identifier, ReactiveScopeDependency> {
    return this.#properties;
  }
  constructor(
    temporariesUsedOutsideScope: Set<IdentifierId>,
    nodes: Map<BlockId, TNode>,
    temporaries: Map<Identifier, Identifier>,
    properties: Map<Identifier, ReactiveScopeDependency>
  ) {
    this.#temporariesUsedOutsideScope = temporariesUsedOutsideScope;
    this.#temporaries = temporaries;
    this.#properties = properties;
    this.#nodes = nodes;
  }

  static enterScope(
    scope: ReactiveScope,
    pruned: boolean,
    context: Context
  ): { previousDeps: Array<ReactiveScopeDependency> } {
    // Save context of previous scope
    const previousDeps = context.#dependencies;

    /*
     * Set context for new scope
     */
    context.#dependencies = [];
    context.#scopes = context.#scopes.push(scope);
    return { previousDeps };
  }

  static exitScope(
    scope: ReactiveScope,
    pruned: boolean,
    context: Context,
    state: { previousDeps: Array<ReactiveScopeDependency> }
  ): void {
    const scopedDependencies = context.#dependencies;

    // Restore context of previous scope
    context.#scopes = context.#scopes.pop();
    context.#dependencies = state.previousDeps;

    /*
     * propagate dependencies upward using the same rules as normal dependency
     * collection. child scopes may have dependencies on values created within
     * the outer scope, which necessarily cannot be dependencies of the outer
     * scope
     */
    const tree = new ReactiveScopeDependencyTree();

    for (const dep of scopedDependencies) {
      if (context.#checkValidDependency(dep)) {
        context.#dependencies.push(dep);
      }
      // TODO remove optionalPath (we're not using this rn right?)
      tree.addDependency({ ...dep, optionalPath: [] });
    }

    let safeNonNulls: Set<DependencyNode> | null = null;
    const firstInstrId = scope.range.start;
    for (const [_blockId, node] of context.#nodes) {
      if (node.instrs.has(firstInstrId)) {
        safeNonNulls = node.normalizedNonNullObjects;
        break;
      }
    }
    CompilerError.invariant(safeNonNulls != null, {
      reason: "Instruction not found",
      loc: GeneratedSource,
    });

    for (const node of safeNonNulls) {
      let root: Identifier | null = null;
      const path: Array<string> = [];
      let curr: DependencyNode | null = node;
      while (curr != null) {
        if (curr.parent === null) {
          root = curr.root;
        } else {
          let found = false;
          for (const [propName, propNode] of curr.parent.properties) {
            if (curr === propNode) {
              found = true;
              path.unshift(propName);
            }
          }
          CompilerError.invariant(found, {
            reason: "Could not find node in parent",
            loc: GeneratedSource,
          });
        }
        curr = curr.parent;
      }
      tree.markNodesNonNull({
        identifier: assertNonNull(root),
        path,
        optionalPath: [],
      });
    }

    if (!pruned) {
      context.deps.set(scope, tree);
    }
  }

  isUsedOutsideDeclaringScope(place: Place): boolean {
    return this.#temporariesUsedOutsideScope.has(place.identifier.id);
  }

  /*
   * Records where a value was declared, and optionally, the scope where the value originated from.
   * This is later used to determine if a dependency should be added to a scope; if the current
   * scope we are visiting is the same scope where the value originates, it can't be a dependency
   * on itself.
   */
  declare(identifier: Identifier, decl: Decl): void {
    if (!this.#declarations.has(identifier.id)) {
      this.#declarations.set(identifier.id, decl);
    }
    this.#reassignments.set(identifier, decl);
  }

  resolveTemporary(place: Place): Identifier {
    return this.#temporaries.get(place.identifier) ?? place.identifier;
  }

  getProperty(object: Place, property: string): ReactiveScopeDependency {
    return this.#getProperty(object, property, false);
  }

  #getProperty(
    object: Place,
    property: string,
    _isConditional: boolean
  ): ReactiveScopeDependency {
    /**
     Example 1:
       $0 = LoadLocal x
       $1 = PropertyLoad $0.y
     resolvedObject = x, resolvedDependency = null

     Example 2:
       $0 = LoadLocal x
       $1 = PropertyLoad $0.y
       $2 = PropertyLoad $1.z
     resolvedObject = null, resolvedDependency = x.y

     Example 3:
       $0 = Call(...)
       $1 = PropertyLoad $0.y
     resolvedObject = null, resolvedDependency = null
     */
    const resolvedObject = this.resolveTemporary(object);
    const resolvedDependency = this.#properties.get(resolvedObject);
    let objectDependency: ReactiveScopeDependency;
    /*
     * (1) Create the base property dependency as either a LoadLocal (from a temporary)
     * or a deep copy of an existing property dependency.
     */
    if (resolvedDependency === undefined) {
      objectDependency = {
        identifier: resolvedObject,
        path: [],
      };
    } else {
      objectDependency = {
        identifier: resolvedDependency.identifier,
        path: [...resolvedDependency.path],
      };
    }

    objectDependency.path.push(property);
    return objectDependency;
  }

  // Checks if identifier is a valid dependency in the current scope
  #checkValidDependency(maybeDependency: ReactiveScopeDependency): boolean {
    // ref.current access is not a valid dep
    if (
      isUseRefType(maybeDependency.identifier) &&
      maybeDependency.path.at(0) === "current"
    ) {
      return false;
    }

    // ref value is not a valid dep
    if (isRefValueType(maybeDependency.identifier)) {
      return false;
    }

    /*
     * object methods are not deps because they will be codegen'ed back in to
     * the object literal.
     */
    if (isObjectMethodType(maybeDependency.identifier)) {
      return false;
    }

    const identifier = maybeDependency.identifier;
    /*
     * If this operand is used in a scope, has a dynamic value, and was defined
     * before this scope, then its a dependency of the scope.
     */
    const currentDeclaration =
      this.#reassignments.get(identifier) ??
      this.#declarations.get(identifier.id);
    const currentScope = this.currentScope.value;
    return (
      currentScope != null &&
      currentDeclaration !== undefined &&
      currentDeclaration.id < currentScope.range.start
    );
  }

  #isScopeActive(scope: ReactiveScope): boolean {
    if (this.#scopes === null) {
      return false;
    }
    return this.#scopes.find((state) => state === scope);
  }

  get currentScope(): Stack<ReactiveScope> {
    return this.#scopes;
  }

  visitOperand(place: Place): void {
    const resolved = this.resolveTemporary(place);
    /*
     * if this operand is a temporary created for a property load, try to resolve it to
     * the expanded Place. Fall back to using the operand as-is.
     */

    let dependency: ReactiveScopeDependency | null = null;
    if (resolved.name === null) {
      const propertyDependency = this.#properties.get(resolved);
      if (propertyDependency !== undefined) {
        dependency = { ...propertyDependency };
      }
    }
    // console.log(
    //   `resolving ${place.identifier.id} -> ${dependency ? printDependency(dependency) : ""}`
    // );
    this.visitDependency(
      dependency ?? {
        identifier: resolved,
        path: [],
      }
    );
  }

  visitProperty(object: Place, property: string): void {
    const nextDependency = this.#getProperty(object, property, false);
    // if (object.identifier.id === 32) {
    //   console.log(printDependency(nextDependency));
    // }
    this.visitDependency(nextDependency);
  }

  visitDependency(maybeDependency: ReactiveScopeDependency): void {
    /*
     * Any value used after its originally defining scope has concluded must be added as an
     * output of its defining scope. Regardless of whether its a const or not,
     * some later code needs access to the value. If the current
     * scope we are visiting is the same scope where the value originates, it can't be a dependency
     * on itself.
     */

    /*
     * if originalDeclaration is undefined here, then this is a free var
     *  (all other decls e.g. `let x;` should be initialized in BuildHIR)
     */
    const originalDeclaration = this.#declarations.get(
      maybeDependency.identifier.id
    );
    if (
      originalDeclaration !== undefined &&
      originalDeclaration.scope.value !== null
    ) {
      originalDeclaration.scope.each((scope) => {
        // console.log(
        //   `${maybeDependency.identifier.id}: active=${this.#isScopeActive(scope)}`
        // );
        if (!this.#isScopeActive(scope)) {
          scope.declarations.set(maybeDependency.identifier.id, {
            identifier: maybeDependency.identifier,
            scope: originalDeclaration.scope.value!,
          });
        }
      });
    }

    if (this.#checkValidDependency(maybeDependency)) {
      /*
       * Add info about this dependency to the existing tree
       * We do not try to join/reduce dependencies here due to missing info
       */
      // console.log("valid dependency", printDependency(maybeDependency));
      this.#dependencies.push(maybeDependency);
    }
  }

  /*
   * Record a variable that is declared in some other scope and that is being reassigned in the
   * current one as a {@link ReactiveScope.reassignments}
   */
  visitReassignment(place: Place): void {
    const currentScope = this.currentScope.value;
    if (
      currentScope != null &&
      !Array.from(currentScope.reassignments).some(
        (identifier) => identifier.id === place.identifier.id
      ) &&
      this.#checkValidDependency({ identifier: place.identifier, path: [] })
    ) {
      currentScope.reassignments.add(place.identifier);
    }
  }
}

export function collectNonNullObjects(
  fn: HIRFunction,
  usedOutsideDeclaringScope: Set<IdentifierId>
): TResult {
  const c = new CollectResult();
  const functionExprRvals = fn.env.config.enableTreatFunctionDepsAsConditional
    ? collectFunctionExpressionRValues(fn)
    : new Set<IdentifierId>();
  const nodes = collectNodes(
    fn,
    functionExprRvals,
    usedOutsideDeclaringScope,
    c
  );
  const result: TResult = {
    nodes,
    temporaries: c.temporaries,
    properties: c.properties,
  };

  deriveNonNull(fn, nodes);
  normalizeNonNull(nodes);

  return result;
}

function handleInstruction_(instr: Instruction, context: Context) {
  const { id, value, lvalue } = instr;
  // TODO: here, should we track global loads in temporaries?
  if (value.kind === "LoadLocal") {
    if (
      value.place.identifier.name === null ||
      lvalue.identifier.name !== null ||
      context.isUsedOutsideDeclaringScope(lvalue)
    ) {
      context.visitOperand(value.place);
    }
  } else if (value.kind === "PropertyLoad") {
    if (context.isUsedOutsideDeclaringScope(lvalue)) {
      // console.log("herehere", lvalue.identifier.id);
      context.visitProperty(value.object, value.property);
    } else {
      const nextDependency = context.getProperty(value.object, value.property);
      context.properties.set(lvalue.identifier, nextDependency);
    }
  } else if (value.kind === "StoreLocal") {
    context.visitOperand(value.value);
    if (value.lvalue.kind === InstructionKind.Reassign) {
      context.visitReassignment(value.lvalue.place);
    }
    context.declare(value.lvalue.place.identifier, {
      id,
      scope: context.currentScope,
    });
  } else if (value.kind === "DeclareLocal" || value.kind === "DeclareContext") {
    /*
     * Some variables may be declared and never initialized. We need
     * to retain (and hoist) these declarations if they are included
     * in a reactive scope. One approach is to simply add all `DeclareLocal`s
     * as scope declarations.
     */

    /*
     * We add context variable declarations here, not at `StoreContext`, since
     * context Store / Loads are modeled as reads and mutates to the underlying
     * variable reference (instead of through intermediate / inlined temporaries)
     */
    context.declare(value.lvalue.place.identifier, {
      id,
      scope: context.currentScope,
    });
  } else if (value.kind === "Destructure") {
    context.visitOperand(value.value);
    for (const place of eachPatternOperand(value.lvalue.pattern)) {
      if (value.lvalue.kind === InstructionKind.Reassign) {
        context.visitReassignment(place);
      }
      context.declare(place.identifier, {
        id,
        scope: context.currentScope,
      });
    }
  } else {
    for (const operand of eachInstructionValueOperand(value)) {
      context.visitOperand(operand);
    }
  }

  context.declare(lvalue.identifier, {
    id,
    scope: context.currentScope,
  });
}

export function propagateScopeDependenciesHIR(fn: HIRFunction): void {
  const escapingTemporaries: TemporariesUsedOutsideDefiningScope = {
    declarations: new Map(),
    usedOutsideDeclaringScope: new Set(),
  };
  // visitReactiveFunction(fn, new FindPromotedTemporaries(), escapingTemporaries);
  findPromotedTemporaries(fn, escapingTemporaries);
  const { nodes, temporaries, properties } = collectNonNullObjects(
    fn,
    escapingTemporaries.usedOutsideDeclaringScope
  );

  const context = new Context(
    escapingTemporaries.usedOutsideDeclaringScope,
    nodes,
    temporaries,
    new Map(
      [...properties.entries()].map(([key, val]) => [key, { ...val }]) as Array<
        [Identifier, ReactiveScopeDependency]
      >
    )
  );
  for (const param of fn.params) {
    if (param.kind === "Identifier") {
      context.declare(param.identifier, {
        id: makeInstructionId(0),
        scope: empty(),
      });
    } else {
      context.declare(param.place.identifier, {
        id: makeInstructionId(0),
        scope: empty(),
      });
    }
  }

  type ScopeTraversalContext = { previousDeps: Array<ReactiveScopeDependency> };
  const scopeTraversal = new ScopeBlockTraversal<
    Context,
    ScopeTraversalContext
  >(context, Context.enterScope, Context.exitScope);

  // TODO don't count optional load rvals as dep (e.g. collectOptionalLoadRValues(...))
  for (const [_, block] of fn.body.blocks) {
    // Handle scopes that begin or end at this block
    scopeTraversal.handleBlock(block);

    for (const instr of block.instructions) {
      handleInstruction_(instr, context);
    }
    for (const place of eachTerminalOperand(block.terminal)) {
      context.visitOperand(place);
    }
  }
  for (const [scope, depTree] of context.deps) {
    scope.dependencies = depTree.deriveMinimalDependencies();
  }
}
