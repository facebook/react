import {
  IdentifierId,
  ScopeId,
  HIRFunction,
  Place,
  Instruction,
  ReactiveScopeDependency,
  BlockId,
  Identifier,
  ReactiveScope,
  isObjectMethodType,
  isRefValueType,
  isUseRefType,
  makeInstructionId,
  InstructionId,
  InstructionKind,
  GeneratedSource,
} from "./HIR";
import {
  BlockInfo,
  collectHoistablePropertyLoads,
} from "./CollectHoistablePropertyLoads";
import {
  NO_OP,
  ScopeBlockTraversal,
  eachInstructionOperand,
  eachInstructionValueOperand,
  eachPatternOperand,
  eachTerminalOperand,
} from "./visitors";
import { ReactiveScopeDependencyTreeHIR } from "./DeriveMinimalDependenciesHIR";
import { Stack, empty } from "../Utils/Stack";
import { CompilerError } from "../CompilerError";

export function llog(..._args: any): void {
  console.log(..._args);
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

function findPromotedTemporaries(
  fn: HIRFunction,
  {
    declarations,
    usedOutsideDeclaringScope,
  }: TemporariesUsedOutsideDefiningScope
): void {
  const prunedScopes = new Set<ScopeId>();
  const scopeTraversal = new ScopeBlockTraversal<null, null>(
    null,
    (scope, pruned) => {
      if (pruned) {
        prunedScopes.add(scope.id);
      }
      return null;
    },
    NO_OP
  );

  function handlePlace(place: Place): void {
    const declaringScope = declarations.get(place.identifier.id);
    if (
      declaringScope != null &&
      scopeTraversal.activeScopes.indexOf(declaringScope) === -1 &&
      !prunedScopes.has(declaringScope)
    ) {
      // Declaring scope is not active === used outside declaring scope
      usedOutsideDeclaringScope.add(place.identifier.id);
    }
  }

  function handleInstruction(instr: Instruction): void {
    const scope = scopeTraversal.activeScopes.at(-1);
    if (scope === undefined || prunedScopes.has(scope)) {
      return;
    }
    switch (instr.value.kind) {
      case "LoadLocal":
      case "LoadContext":
      case "PropertyLoad": {
        declarations.set(instr.lvalue.identifier.id, scope);
        break;
      }
      default: {
        break;
      }
    }
  }

  for (const [_, block] of fn.body.blocks) {
    scopeTraversal.handleBlock(block);
    for (const instr of block.instructions) {
      for (const place of eachInstructionOperand(instr)) {
        handlePlace(place);
      }
      handleInstruction(instr);
    }

    for (const place of eachTerminalOperand(block.terminal)) {
      handlePlace(place);
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
  #properties: Map<Identifier, ReactiveScopeDependency>;
  #temporaries: Map<Identifier, Identifier>;
  #scopes: Stack<ReactiveScope> = empty();
  deps: Map<ReactiveScope, Array<ReactiveScopeDependency>> = new Map();

  get properties(): Map<Identifier, ReactiveScopeDependency> {
    return this.#properties;
  }
  constructor(
    temporariesUsedOutsideScope: Set<IdentifierId>,
    temporaries: Map<Identifier, Identifier>,
    properties: Map<Identifier, ReactiveScopeDependency>
  ) {
    this.#temporariesUsedOutsideScope = temporariesUsedOutsideScope;
    this.#temporaries = temporaries;
    this.#properties = properties;
  }

  static enterScope(
    scope: ReactiveScope,
    _pruned: boolean,
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
     * Collect dependencies we recorded for the exiting scope and propagate
     * them upward using the same rules as normal dependency collection.
     * Child scopes may have dependencies on values created within the outer
     * scope, which necessarily cannot be dependencies of the outer scope.
     */
    for (const dep of scopedDependencies) {
      if (context.#checkValidDependency(dep)) {
        context.#dependencies.push(dep);
      }
    }

    if (!pruned) {
      context.deps.set(scope, scopedDependencies);
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
     * if originalDeclaration is undefined here, then this is not a local var
     * (all decls e.g. `let x;` should be initialized in BuildHIR)
     */
    const originalDeclaration = this.#declarations.get(
      maybeDependency.identifier.id
    );
    if (
      originalDeclaration !== undefined &&
      originalDeclaration.scope.value !== null
    ) {
      originalDeclaration.scope.each((scope) => {
        if (!this.#isScopeActive(scope)) {
          scope.declarations.set(maybeDependency.identifier.id, {
            identifier: maybeDependency.identifier,
            scope: originalDeclaration.scope.value!,
          });
        }
      });
    }

    if (this.#checkValidDependency(maybeDependency)) {
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

function handleInstruction(instr: Instruction, context: Context) {
  const { id, value, lvalue } = instr;
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

function collectDependencies(
  fn: HIRFunction,
  usedOutsideDeclaringScope: Set<IdentifierId>,
  temporaries: Map<Identifier, Identifier>,
  properties: Map<Identifier, ReactiveScopeDependency>
) {
  const context = new Context(
    usedOutsideDeclaringScope,
    temporaries,
    properties
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
      handleInstruction(instr, context);
    }
    for (const place of eachTerminalOperand(block.terminal)) {
      context.visitOperand(place);
    }
  }
  return context.deps;
}

/**
 * Compute the set of hoistable property reads.
 */
function recordHoistablePropertyReads(
  nodes: Map<BlockId, BlockInfo>,
  scopeId: ScopeId,
  tree: ReactiveScopeDependencyTreeHIR
): void {
  let nonNullObjects: Array<ReactiveScopeDependency> | null = null;
  for (const [_blockId, node] of nodes) {
    if (node.scope === scopeId) {
      nonNullObjects = [...node.assumedNonNullObjects].map((n) => n.fullPath);
      break;
    }
  }
  CompilerError.invariant(nonNullObjects != null, {
    reason: "[PropagateScopeDependencies] Scope not found in tracked blocks",
    loc: GeneratedSource,
  });

  for (const node of nonNullObjects) {
    tree.markNodesNonNull({
      ...node,
      optionalPath: [],
    });
  }
}

export function propagateScopeDependenciesHIR(fn: HIRFunction): void {
  const escapingTemporaries: TemporariesUsedOutsideDefiningScope = {
    declarations: new Map(),
    usedOutsideDeclaringScope: new Set(),
  };
  findPromotedTemporaries(fn, escapingTemporaries);
  const { nodes, temporaries, properties } = collectHoistablePropertyLoads(
    fn,
    escapingTemporaries.usedOutsideDeclaringScope
  );

  const scopeDeps = collectDependencies(
    fn,
    escapingTemporaries.usedOutsideDeclaringScope,
    temporaries,
    properties
  );

  /**
   * Derive the minimal set of hoistable dependencies for each scope.
   */
  for (const [scope, deps] of scopeDeps) {
    const tree = new ReactiveScopeDependencyTreeHIR();

    /**
     * Step 1: Add every dependency used by this scope (e.g. `a.b.c`)
     */
    for (const dep of deps) {
      tree.addDependency({ ...dep, optionalPath: [] });
    }
    /**
     * Step 2: Mark "hoistable" property reads, i.e. ones that will
     * unconditionally run, given the basic block in which the scope
     * begins.
     */
    recordHoistablePropertyReads(nodes, scope.id, tree);
    scope.dependencies = tree.deriveMinimalDependencies();
  }
}
