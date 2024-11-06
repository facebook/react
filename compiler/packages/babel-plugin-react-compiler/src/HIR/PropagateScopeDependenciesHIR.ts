import {
  ScopeId,
  HIRFunction,
  Place,
  Instruction,
  ReactiveScopeDependency,
  Identifier,
  ReactiveScope,
  isObjectMethodType,
  isRefValueType,
  isUseRefType,
  makeInstructionId,
  InstructionId,
  InstructionKind,
  GeneratedSource,
  DeclarationId,
  areEqualPaths,
  IdentifierId,
  Terminal,
} from './HIR';
import {
  collectHoistablePropertyLoads,
  keyByScopeId,
} from './CollectHoistablePropertyLoads';
import {
  ScopeBlockTraversal,
  eachInstructionOperand,
  eachInstructionValueOperand,
  eachPatternOperand,
  eachTerminalOperand,
} from './visitors';
import {Stack, empty} from '../Utils/Stack';
import {CompilerError} from '../CompilerError';
import {Iterable_some} from '../Utils/utils';
import {ReactiveScopeDependencyTreeHIR} from './DeriveMinimalDependenciesHIR';
import {collectOptionalChainSidemap} from './CollectOptionalChainDependencies';

export function propagateScopeDependenciesHIR(fn: HIRFunction): void {
  const usedOutsideDeclaringScope =
    findTemporariesUsedOutsideDeclaringScope(fn);
  const temporaries = collectTemporariesSidemap(fn, usedOutsideDeclaringScope);
  const {
    temporariesReadInOptional,
    processedInstrsInOptional,
    hoistableObjects,
  } = collectOptionalChainSidemap(fn);

  const hoistablePropertyLoads = keyByScopeId(
    fn,
    collectHoistablePropertyLoads(fn, temporaries, hoistableObjects),
  );

  const scopeDeps = collectDependencies(
    fn,
    usedOutsideDeclaringScope,
    new Map([...temporaries, ...temporariesReadInOptional]),
    processedInstrsInOptional,
  );

  /**
   * Derive the minimal set of hoistable dependencies for each scope.
   */
  for (const [scope, deps] of scopeDeps) {
    if (deps.length === 0) {
      continue;
    }

    /**
     * Step 1: Find hoistable accesses, given the basic block in which the scope
     * begins.
     */
    const hoistables = hoistablePropertyLoads.get(scope.id);
    CompilerError.invariant(hoistables != null, {
      reason: '[PropagateScopeDependencies] Scope not found in tracked blocks',
      loc: GeneratedSource,
    });
    /**
     * Step 2: Calculate hoistable dependencies.
     */
    const tree = new ReactiveScopeDependencyTreeHIR(
      [...hoistables.assumedNonNullObjects].map(o => o.fullPath),
    );
    for (const dep of deps) {
      tree.addDependency({...dep});
    }

    /**
     * Step 3: Reduce dependencies to a minimal set.
     */
    const candidates = tree.deriveMinimalDependencies();
    for (const candidateDep of candidates) {
      if (
        !Iterable_some(
          scope.dependencies,
          existingDep =>
            existingDep.identifier.declarationId ===
              candidateDep.identifier.declarationId &&
            areEqualPaths(existingDep.path, candidateDep.path),
        )
      )
        scope.dependencies.add(candidateDep);
    }
  }
}

function findTemporariesUsedOutsideDeclaringScope(
  fn: HIRFunction,
): ReadonlySet<DeclarationId> {
  /*
   * tracks all relevant LoadLocal and PropertyLoad lvalues
   * and the scope where they are defined
   */
  const declarations = new Map<DeclarationId, ScopeId>();
  const prunedScopes = new Set<ScopeId>();
  const scopeTraversal = new ScopeBlockTraversal();
  const usedOutsideDeclaringScope = new Set<DeclarationId>();

  function handlePlace(place: Place): void {
    const declaringScope = declarations.get(place.identifier.declarationId);
    if (
      declaringScope != null &&
      !scopeTraversal.isScopeActive(declaringScope) &&
      !prunedScopes.has(declaringScope)
    ) {
      // Declaring scope is not active === used outside declaring scope
      usedOutsideDeclaringScope.add(place.identifier.declarationId);
    }
  }

  function handleInstruction(instr: Instruction): void {
    const scope = scopeTraversal.currentScope;
    if (scope == null || prunedScopes.has(scope)) {
      return;
    }
    switch (instr.value.kind) {
      case 'LoadLocal':
      case 'LoadContext':
      case 'PropertyLoad': {
        declarations.set(instr.lvalue.identifier.declarationId, scope);
        break;
      }
      default: {
        break;
      }
    }
  }

  for (const [blockId, block] of fn.body.blocks) {
    scopeTraversal.recordScopes(block);
    const scopeStartInfo = scopeTraversal.blockInfos.get(blockId);
    if (scopeStartInfo?.kind === 'begin' && scopeStartInfo.pruned) {
      prunedScopes.add(scopeStartInfo.scope.id);
    }
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
  return usedOutsideDeclaringScope;
}

/**
 * @returns mapping of LoadLocal and PropertyLoad to the source of the load.
 * ```js
 * // source
 * foo(a.b);
 *
 * // HIR: a potential sidemap is {0: a, 1: a.b, 2: foo}
 * $0 = LoadLocal 'a'
 * $1 = PropertyLoad $0, 'b'
 * $2 = LoadLocal 'foo'
 * $3 = CallExpression $2($1)
 * ```
 * @param usedOutsideDeclaringScope is used to check the correctness of
 * reordering LoadLocal / PropertyLoad calls. We only track a LoadLocal /
 * PropertyLoad in the returned temporaries map if reordering the read (from the
 * time-of-load to time-of-use) is valid.
 *
 * If a LoadLocal or PropertyLoad instruction is within the reactive scope range
 * (a proxy for mutable range) of the load source, later instructions may
 * reassign / mutate the source value. Since it's incorrect to reorder these
 * load instructions to after their scope ranges, we also do not store them in
 * identifier sidemaps.
 *
 * Take this example (from fixture
 * `evaluation-order-mutate-call-after-dependency-load`)
 * ```js
 * // source
 * function useFoo(arg) {
 *   const arr = [1, 2, 3, ...arg];
 *   return [
 *     arr.length,
 *     arr.push(0)
 *   ];
 * }
 *
 * // IR pseudocode
 * scope @0 {
 *   $0 = arr = ArrayExpression [1, 2, 3, ...arg]
 *   $1 = arr.length
 *   $2 = arr.push(0)
 * }
 * scope @1 {
 *   $3 = ArrayExpression [$1, $2]
 * }
 * ```
 * Here, it's invalid for scope@1 to take `arr.length` as a dependency instead
 * of $1, as the evaluation of `arr.length` changes between instructions $1 and
 * $3. We do not track $1 -> arr.length in this case.
 */
export function collectTemporariesSidemap(
  fn: HIRFunction,
  usedOutsideDeclaringScope: ReadonlySet<DeclarationId>,
): ReadonlyMap<IdentifierId, ReactiveScopeDependency> {
  const temporaries = new Map();
  collectTemporariesSidemapImpl(
    fn,
    usedOutsideDeclaringScope,
    temporaries,
    false,
  );
  return temporaries;
}

/**
 * Recursive collect a sidemap of all `LoadLocal` and `PropertyLoads` with a
 * function and all nested functions.
 *
 * Note that IdentifierIds are currently unique, so we can use a single
 * Map<IdentifierId, ...> across all nested functions.
 */
function collectTemporariesSidemapImpl(
  fn: HIRFunction,
  usedOutsideDeclaringScope: ReadonlySet<DeclarationId>,
  temporaries: Map<IdentifierId, ReactiveScopeDependency>,
  isInnerFn: boolean,
): void {
  for (const [_, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const {value, lvalue} = instr;
      const usedOutside = usedOutsideDeclaringScope.has(
        lvalue.identifier.declarationId,
      );

      if (value.kind === 'PropertyLoad' && !usedOutside) {
        if (!isInnerFn || temporaries.has(value.object.identifier.id)) {
          /**
           * All dependencies of a inner / nested function must have a base
           * identifier from the outermost component / hook. This is because the
           * compiler cannot break an inner function into multiple granular
           * scopes.
           */
          const property = getProperty(
            value.object,
            value.property,
            false,
            temporaries,
          );
          temporaries.set(lvalue.identifier.id, property);
        }
      } else if (
        value.kind === 'LoadLocal' &&
        lvalue.identifier.name == null &&
        value.place.identifier.name !== null &&
        !usedOutside
      ) {
        if (
          !isInnerFn ||
          fn.context.some(
            context => context.identifier.id === value.place.identifier.id,
          )
        ) {
          temporaries.set(lvalue.identifier.id, {
            identifier: value.place.identifier,
            path: [],
          });
        }
      } else if (
        value.kind === 'FunctionExpression' ||
        value.kind === 'ObjectMethod'
      ) {
        collectTemporariesSidemapImpl(
          value.loweredFunc.func,
          usedOutsideDeclaringScope,
          temporaries,
          true,
        );
      }
    }
  }
}

function getProperty(
  object: Place,
  propertyName: string,
  optional: boolean,
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
      path: [{property: propertyName, optional}],
    };
  } else {
    property = {
      identifier: resolvedDependency.identifier,
      path: [...resolvedDependency.path, {property: propertyName, optional}],
    };
  }
  return property;
}

type Decl = {
  id: InstructionId;
  scope: Stack<ReactiveScope>;
};

class Context {
  #declarations: Map<DeclarationId, Decl> = new Map();
  #reassignments: Map<Identifier, Decl> = new Map();

  #scopes: Stack<ReactiveScope> = empty();
  // Reactive dependencies used in the current reactive scope.
  #dependencies: Stack<Array<ReactiveScopeDependency>> = empty();
  deps: Map<ReactiveScope, Array<ReactiveScopeDependency>> = new Map();

  #temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>;
  #temporariesUsedOutsideScope: ReadonlySet<DeclarationId>;

  /**
   * Tracks the traversal state. See Context.declare for explanation of why this
   * is needed.
   */
  inInnerFn: boolean = false;

  constructor(
    temporariesUsedOutsideScope: ReadonlySet<DeclarationId>,
    temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
  ) {
    this.#temporariesUsedOutsideScope = temporariesUsedOutsideScope;
    this.#temporaries = temporaries;
  }

  enterScope(scope: ReactiveScope): void {
    // Set context for new scope
    this.#dependencies = this.#dependencies.push([]);
    this.#scopes = this.#scopes.push(scope);
  }

  exitScope(scope: ReactiveScope, pruned: boolean): void {
    // Save dependencies we collected from the exiting scope
    const scopedDependencies = this.#dependencies.value;
    CompilerError.invariant(scopedDependencies != null, {
      reason: '[PropagateScopeDeps]: Unexpected scope mismatch',
      loc: scope.loc,
    });

    // Restore context of previous scope
    this.#scopes = this.#scopes.pop();
    this.#dependencies = this.#dependencies.pop();

    /*
     * Collect dependencies we recorded for the exiting scope and propagate
     * them upward using the same rules as normal dependency collection.
     * Child scopes may have dependencies on values created within the outer
     * scope, which necessarily cannot be dependencies of the outer scope.
     */
    for (const dep of scopedDependencies) {
      if (this.#checkValidDependency(dep)) {
        this.#dependencies.value?.push(dep);
      }
    }

    if (!pruned) {
      this.deps.set(scope, scopedDependencies);
    }
  }

  isUsedOutsideDeclaringScope(place: Place): boolean {
    return this.#temporariesUsedOutsideScope.has(
      place.identifier.declarationId,
    );
  }

  /*
   * Records where a value was declared, and optionally, the scope where the
   * value originated from. This is later used to determine if a dependency
   * should be added to a scope; if the current scope we are visiting is the
   * same scope where the value originates, it can't be a dependency on itself.
   *
   * Note that we do not track declarations or reassignments within inner
   * functions for the following reasons:
   *   - inner functions cannot be split by scope boundaries and are guaranteed
   *     to consume their own declarations
   *   - reassignments within inner functions are tracked as context variables,
   *     which already have extended mutable ranges to account for reassignments
   *   - *most importantly* it's currently simply incorrect to compare inner
   *     function instruction ids (tracked by `decl`) with outer ones (as stored
   *     by root identifier mutable ranges).
   */
  declare(identifier: Identifier, decl: Decl): void {
    if (this.inInnerFn) return;
    if (!this.#declarations.has(identifier.declarationId)) {
      this.#declarations.set(identifier.declarationId, decl);
    }
    this.#reassignments.set(identifier, decl);
  }

  // Checks if identifier is a valid dependency in the current scope
  #checkValidDependency(maybeDependency: ReactiveScopeDependency): boolean {
    // ref.current access is not a valid dep
    if (
      isUseRefType(maybeDependency.identifier) &&
      maybeDependency.path.at(0)?.property === 'current'
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
      this.#declarations.get(identifier.declarationId);
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
    return this.#scopes.find(state => state === scope);
  }

  get currentScope(): Stack<ReactiveScope> {
    return this.#scopes;
  }

  visitOperand(place: Place): void {
    /*
     * if this operand is a temporary created for a property load, try to resolve it to
     * the expanded Place. Fall back to using the operand as-is.
     */
    this.visitDependency(
      this.#temporaries.get(place.identifier.id) ?? {
        identifier: place.identifier,
        path: [],
      },
    );
  }

  visitProperty(object: Place, property: string, optional: boolean): void {
    const nextDependency = getProperty(
      object,
      property,
      optional,
      this.#temporaries,
    );
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
      maybeDependency.identifier.declarationId,
    );
    if (
      originalDeclaration !== undefined &&
      originalDeclaration.scope.value !== null
    ) {
      originalDeclaration.scope.each(scope => {
        if (
          !this.#isScopeActive(scope) &&
          !Iterable_some(
            scope.declarations.values(),
            decl =>
              decl.identifier.declarationId ===
              maybeDependency.identifier.declarationId,
          )
        ) {
          scope.declarations.set(maybeDependency.identifier.id, {
            identifier: maybeDependency.identifier,
            scope: originalDeclaration.scope.value!,
          });
        }
      });
    }

    if (this.#checkValidDependency(maybeDependency)) {
      this.#dependencies.value!.push(maybeDependency);
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
      !Iterable_some(
        currentScope.reassignments,
        identifier =>
          identifier.declarationId === place.identifier.declarationId,
      ) &&
      this.#checkValidDependency({identifier: place.identifier, path: []})
    ) {
      currentScope.reassignments.add(place.identifier);
    }
  }
}

function handleInstruction(instr: Instruction, context: Context): void {
  const {id, value, lvalue} = instr;
  if (value.kind === 'LoadLocal') {
    if (
      value.place.identifier.name === null ||
      lvalue.identifier.name !== null ||
      context.isUsedOutsideDeclaringScope(lvalue)
    ) {
      context.visitOperand(value.place);
    }
  } else if (value.kind === 'PropertyLoad') {
    if (context.isUsedOutsideDeclaringScope(lvalue)) {
      context.visitProperty(value.object, value.property, false);
    }
  } else if (value.kind === 'StoreLocal') {
    context.visitOperand(value.value);
    if (value.lvalue.kind === InstructionKind.Reassign) {
      context.visitReassignment(value.lvalue.place);
    }
    context.declare(value.lvalue.place.identifier, {
      id,
      scope: context.currentScope,
    });
  } else if (value.kind === 'DeclareLocal' || value.kind === 'DeclareContext') {
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
  } else if (value.kind === 'Destructure') {
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
  usedOutsideDeclaringScope: ReadonlySet<DeclarationId>,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
  processedInstrsInOptional: ReadonlySet<Instruction | Terminal>,
): Map<ReactiveScope, Array<ReactiveScopeDependency>> {
  const context = new Context(usedOutsideDeclaringScope, temporaries);

  for (const param of fn.params) {
    if (param.kind === 'Identifier') {
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

  const scopeTraversal = new ScopeBlockTraversal();

  for (const [blockId, block] of fn.body.blocks) {
    scopeTraversal.recordScopes(block);
    const scopeBlockInfo = scopeTraversal.blockInfos.get(blockId);
    if (scopeBlockInfo?.kind === 'begin') {
      context.enterScope(scopeBlockInfo.scope);
    } else if (scopeBlockInfo?.kind === 'end') {
      context.exitScope(scopeBlockInfo.scope, scopeBlockInfo?.pruned);
    }

    // Record referenced optional chains in phis
    for (const phi of block.phis) {
      for (const operand of phi.operands) {
        const maybeOptionalChain = temporaries.get(operand[1].identifier.id);
        if (maybeOptionalChain) {
          context.visitDependency(maybeOptionalChain);
        }
      }
    }
    for (const instr of block.instructions) {
      if (!processedInstrsInOptional.has(instr)) {
        handleInstruction(instr, context);
      }
    }

    if (!processedInstrsInOptional.has(block.terminal)) {
      for (const place of eachTerminalOperand(block.terminal)) {
        context.visitOperand(place);
      }
    }
  }
  return context.deps;
}
