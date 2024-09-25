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
  BlockId,
  BasicBlock,
  TInstruction,
  OptionalTerminal,
  PropertyLoad,
  StoreLocal,
  BranchTerminal,
  TBasicBlock,
  GotoVariant,
} from './HIR';
import {
  assertNonNull,
  collectHoistablePropertyLoads,
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
import {arrayNonNulls, Iterable_some} from '../Utils/utils';
import {ReactiveScopeDependencyTreeHIR} from './DeriveMinimalDependenciesHIR';
import {printIdentifier, printInstruction} from './PrintHIR';

export function propagateScopeDependenciesHIR(fn: HIRFunction): void {
  const usedOutsideDeclaringScope =
    findTemporariesUsedOutsideDeclaringScope(fn);
  const temporaries = collectTemporariesSidemap(fn, usedOutsideDeclaringScope);
  const {
    temporariesReadInOptional,
    processedInstrsInOptional,
    hoistableObjects,
  } = collectOptionalChainSidemap(fn);

  const hoistablePropertyLoads = collectHoistablePropertyLoads(
    fn,
    temporaries,
    hoistableObjects,
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
     * Step 1:
     * Find hoistable accesses, given the basic block in which the scope
     * begins.
     */
    const hoistables = hoistablePropertyLoads.get(scope.id);
    CompilerError.invariant(hoistables != null, {
      reason: '[PropagateScopeDependencies] Scope not found in tracked blocks',
      loc: GeneratedSource,
    });
    const tree = new ReactiveScopeDependencyTreeHIR(
      [...hoistables.assumedNonNullObjects].map(o => o.dep),
    );

    /**
     * Step 2: Mark hoistable dependencies
     */

    for (const dep of deps) {
      tree.addDependency({...dep});
    }

    /**
     * Step 3: Derive minimal
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

function matchOptionalTestBlock(
  terminal: BranchTerminal,
  blocks: ReadonlyMap<BlockId, BasicBlock>,
): {
  consequentId: IdentifierId;
  property: string;
  propertyId: IdentifierId;
  storeLocalInstrId: InstructionId;
  consequentGoto: BlockId;
} | null {
  const consequentBlock = assertNonNull(blocks.get(terminal.consequent));
  if (
    consequentBlock.instructions.length === 2 &&
    consequentBlock.instructions[0].value.kind === 'PropertyLoad' &&
    consequentBlock.instructions[1].value.kind === 'StoreLocal'
  ) {
    const propertyLoad: TInstruction<PropertyLoad> = consequentBlock
      .instructions[0] as TInstruction<PropertyLoad>;
    const storeLocal: StoreLocal = consequentBlock.instructions[1].value;
    const storeLocalInstrId = consequentBlock.instructions[1].id;
    CompilerError.invariant(
      propertyLoad.value.object.identifier.id === terminal.test.identifier.id,
      {
        reason:
          '[OptionalChainDeps] Inconsistent optional chaining property load',
        description: `Test=${printIdentifier(terminal.test.identifier)} PropertyLoad base=${printIdentifier(propertyLoad.value.object.identifier)}`,
        loc: propertyLoad.loc,
      },
    );

    CompilerError.invariant(
      storeLocal.value.identifier.id === propertyLoad.lvalue.identifier.id,
      {
        reason: '[OptionalChainDeps] Unexpected storeLocal',
        loc: propertyLoad.loc,
      },
    );
    if (
      consequentBlock.terminal.kind !== 'goto' ||
      consequentBlock.terminal.variant !== GotoVariant.Break
    ) {
      return null;
    }
    assertOptionalAlternateBlock(terminal, blocks);
    return {
      consequentId: storeLocal.lvalue.place.identifier.id,
      property: propertyLoad.value.property,
      propertyId: propertyLoad.lvalue.identifier.id,
      storeLocalInstrId,
      consequentGoto: consequentBlock.terminal.block,
    };
  }
  return null;
}

function assertOptionalAlternateBlock(
  terminal: BranchTerminal,
  blocks: ReadonlyMap<BlockId, BasicBlock>,
): void {
  const alternate = assertNonNull(blocks.get(terminal.alternate));

  CompilerError.invariant(
    alternate.instructions.length === 2 &&
      alternate.instructions[0].value.kind === 'Primitive' &&
      alternate.instructions[1].value.kind === 'StoreLocal',
    {
      reason: 'Unexpected alternate structure',
      loc: terminal.loc,
    },
  );
}

type OptionalTraversalContext = {
  blocks: ReadonlyMap<BlockId, BasicBlock>;

  // Track optional blocks to avoid outer calls into nested optionals
  seenOptionals: Set<BlockId>;

  /**
   * When extracting dependencies in PropagateScopeDependencies, skip instructions already
   * processed in this pass.
   *
   * E.g. given a?.b
   * ```
   * bb0
   *   $0 = LoadLocal 'a'
   *   test $0 then=bb1         <- Avoid adding dependencies from these instructions, as
   * bb1                           the sidemap produced by readOptionalBlock already maps
   *   $1 = PropertyLoad $0.'b' <- $1 and $2 back to a?.b. Instead, we want to add a?.b
   *   StoreLocal $2 = $1       <- as a dependency when $1 or $2 are later used in either
   *                                 - an unhoistable expression within an outer optional
   *                                   block e.g. MethodCall
   *                                 - a phi node (if the entire optional value is hoistable)
   * ```
   *
   * Note that mapping blockIds to their evaluated dependency path does not
   * work, since values produced by inner optional chains may be referenced in
   * outer ones
   * ```
   * a?.b.c()
   *  ->
   * bb0
   *   $0 = LoadLocal 'a'
   *   test $0 then=bb1
   * bb1
   *   $1 = PropertyLoad $0.'b'
   *   StoreLocal $2 = $1
   *   goto bb2
   * bb2
   *   test $2 then=bb3
   * bb3:
   *   $3 = PropertyLoad $2.'c'
   *   StoreLocal $4 = $3
   *   goto bb4
   * bb4
   *   test $4 then=bb5
   * bb5:
   *   $5 = MethodCall $2.$4() <--- here, we want to take a dep on $2 and $4!
   * ```
   */
  processedInstrsInOptional: Set<InstructionId>;

  /**
   * Store the correct property mapping (e.g. `a?.b` instead of `a.b`) for
   * dependency calculation
   */
  temporariesReadInOptional: Map<IdentifierId, ReactiveScopeDependency>;
  hoistableObjects: Map<BlockId, ReactiveScopeDependency>;
};

/**
 * Traverse into the optional block and all transitively referenced blocks to
 * collect a sidemaps identifier and block ids -> optional chain dependencies.
 *
 * @returns the IdentifierId representing the optional block if the block and
 * all transitively referenced optionals precisely represent a chain of property
 * loads. If any part of the optional chain is not hoistable, returns null.
 */
function traverseOptionalBlock(
  optional: TBasicBlock<OptionalTerminal>,
  context: OptionalTraversalContext,
  outerAlternate: BlockId | null,
): IdentifierId | null {
  context.seenOptionals.add(optional.id);
  const maybeTest = context.blocks.get(optional.terminal.test)!;
  let test: BranchTerminal;
  let baseObject: ReactiveScopeDependency;
  if (maybeTest.terminal.kind === 'branch') {
    /**
     * Explicitly calculate base of load
     *
     * Optional base expressions are currently within value blocks which cannot
     * be interrupted by scope boundaries. As such, the only dependencies we can
     * hoist out of optional chains are property load chains with no intervening
     * instructions.
     *
     * Ideally, we would be able to flatten base instructions out of optional
     * blocks, but this would require changes to HIR.
     */
    CompilerError.invariant(optional.terminal.optional, {
      reason:
        '[OptionalChainDeps] Expect base optional case to be always optional',
      loc: optional.terminal.loc,
    });
    CompilerError.invariant(maybeTest.instructions.length >= 1, {
      reason:
        '[OptionalChainDeps] Expected direct optional test branch (base case) to have at least one instruction',
      loc: maybeTest.terminal.loc,
    });

    /**
     * Only match base expressions that are straightforward PropertyLoad chains
     */
    if (maybeTest.instructions[0].value.kind !== 'LoadLocal') {
      return null;
    }
    const path = maybeTest.instructions.slice(1).map((entry, i) => {
      const instrVal = entry.value;
      if (
        instrVal.kind === 'PropertyLoad' &&
        instrVal.object.identifier.id ===
          maybeTest.instructions[i].lvalue.identifier.id
      ) {
        return {property: instrVal.property, optional: false};
      } else {
        return null;
      }
    });
    if (!arrayNonNulls(path)) {
      return null;
    }
    CompilerError.invariant(
      maybeTest.terminal.test.identifier.id ===
        maybeTest.instructions.at(-1)!.lvalue.identifier.id,
      {
        reason: '[OptionalChainDeps] Unexpected test expression',
        loc: maybeTest.terminal.loc,
      },
    );
    baseObject = {
      identifier: maybeTest.instructions[0].value.place.identifier,
      path,
    };
    test = maybeTest.terminal;
  } else if (maybeTest.terminal.kind === 'optional') {
    /**
     * This is either
     * - a chained optional i.e. base=<inner_optional>?.b or <inner_optional>.b
     * - a optional base block with a separate nested optional-chain (e.g. a(c?.d)?.d)
     */
    const testBlock = context.blocks.get(maybeTest.terminal.fallthrough)!;
    if (testBlock!.terminal.kind !== 'branch') {
      /**
       * Fallthrough of the inner optional should be a block with no
       * instructions, terminating with Test($<temporary written to from
       * StoreLocal>)
       */
      CompilerError.throwTodo({
        reason: `Unexpected terminal kind \`${testBlock.terminal.kind}\` for optional fallthrough block`,
        loc: maybeTest.terminal.loc,
      });
    }
    /**
     * Recurse into inner optional blocks to collect inner optional-chain
     * expressions, regardless of whether we can match the outer one to a
     * PropertyLoad.
     */
    const innerOptional = traverseOptionalBlock(
      maybeTest as TBasicBlock<OptionalTerminal>,
      context,
      testBlock.terminal.alternate,
    );
    if (innerOptional == null) {
      return null;
    }

    /**
     * Check that the inner optional is part of the same optional-chain as the
     * outer one. This is not guaranteed, e.g. given a(c?.d)?.d
     * ```
     * bb0:
     *   Optional test=bb1
     * bb1:
     *   $0 = LoadLocal a               <-- part 1 of the outer optional-chaining base
     *   Optional test=bb2 fallth=bb5   <-- start of optional chain for c?.d
     * bb2:
     *   ... (optional chain for c?.d)
     * ...
     * bb5:
     *   $1 = phi(c.d, undefined)       <-- part 2 (continuation) of the outer optional-base
     *   $2 = Call $0($1)
     *   Branch $2 ...
     * ```
     */
    if (testBlock.terminal.test.identifier.id !== innerOptional) {
      mapOutermostOptionalPhi(
        maybeTest as TBasicBlock<OptionalTerminal>,
        innerOptional,
        context,
      );

      return null;
    }

    if (!optional.terminal.optional) {
      /**
       * If this is an non-optional load participating in an optional chain
       * (e.g. loading the `c` property in `a?.b.c`), record that PropertyLoads
       * from the inner optional value are hoistable.
       */
      context.hoistableObjects.set(
        optional.id,
        assertNonNull(context.temporariesReadInOptional.get(innerOptional)),
      );
    }
    baseObject = assertNonNull(
      context.temporariesReadInOptional.get(innerOptional),
    );
    test = testBlock.terminal;
    if (test.alternate === outerAlternate) {
      CompilerError.invariant(optional.instructions.length === 0, {
        reason:
          '[OptionalChainDeps] Unexpected instructions an inner optional block. ' +
          'This indicates that the compiler may be incorrectly concatenating two unrelated optional chains',
        description: `bb${optional.id}\n ${testBlock.id}\n${optional.instructions.map(printInstruction).join('\n')}`,
        loc: optional.terminal.loc,
      });
    }
  } else {
    CompilerError.throwTodo({
      reason:
        '[OptionalChainDeps] Unexpected terminal kind for optional test block',
      description: `Expected branch or optional, found ${maybeTest.terminal.kind}`,
      loc: maybeTest.terminal.loc,
    });
  }

  const matchConsequentResult = matchOptionalTestBlock(test, context.blocks);
  if (!matchConsequentResult) {
    // Optional chain consequent is not hoistable e.g. a?.[computed()]
    return null;
  }
  CompilerError.invariant(
    matchConsequentResult.consequentGoto === optional.terminal.fallthrough,
    {
      reason: '[OptionalChainDeps] Unexpected optional goto-fallthrough',
      description: `${matchConsequentResult.consequentGoto} != ${optional.terminal.fallthrough}`,
      loc: optional.terminal.loc,
    },
  );
  const load = {
    identifier: baseObject.identifier,
    path: [
      ...baseObject.path,
      {
        property: matchConsequentResult.property,
        optional: optional.terminal.optional,
      },
    ],
  };
  context.processedInstrsInOptional.add(
    matchConsequentResult.storeLocalInstrId,
  );
  context.processedInstrsInOptional.add(test.id);
  context.temporariesReadInOptional.set(
    matchConsequentResult.consequentId,
    load,
  );
  context.temporariesReadInOptional.set(matchConsequentResult.propertyId, load);
  return matchConsequentResult.consequentId;
}

type OptionalChainSidemap = {
  temporariesReadInOptional: ReadonlyMap<IdentifierId, ReactiveScopeDependency>;
  // Instructions to skip when processing dependencies
  processedInstrsInOptional: ReadonlySet<InstructionId>;
  hoistableObjects: ReadonlyMap<BlockId, ReactiveScopeDependency>;
};
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
 * Only map LoadLocal and PropertyLoad lvalues to their source if we know that
 * reordering the read (from the time-of-load to time-of-use) is valid.
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
function collectTemporariesSidemap(
  fn: HIRFunction,
  usedOutsideDeclaringScope: ReadonlySet<DeclarationId>,
): ReadonlyMap<IdentifierId, ReactiveScopeDependency> {
  const temporaries = new Map<IdentifierId, ReactiveScopeDependency>();
  for (const [_, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const {value, lvalue} = instr;
      const usedOutside = usedOutsideDeclaringScope.has(
        lvalue.identifier.declarationId,
      );

      if (value.kind === 'PropertyLoad' && !usedOutside) {
        const property = getProperty(
          value.object,
          value.property,
          false,
          temporaries,
        );
        temporaries.set(lvalue.identifier.id, property);
      } else if (
        value.kind === 'LoadLocal' &&
        lvalue.identifier.name == null &&
        value.place.identifier.name !== null &&
        !usedOutside
      ) {
        temporaries.set(lvalue.identifier.id, {
          identifier: value.place.identifier,
          path: [],
        });
      }
    }
  }
  return temporaries;
}

function mapOutermostOptionalPhi(
  optional: TBasicBlock<OptionalTerminal>,
  outermostConsequent: IdentifierId,
  context: OptionalTraversalContext,
): void {
  const fallthrough = assertNonNull(
    context.blocks.get(optional.terminal.fallthrough),
  );

  const matchingPhi = [...fallthrough.phis].find(phi =>
    [...phi.operands.values()].some(
      operand => operand.id === outermostConsequent,
    ),
  );
  if (matchingPhi != null) {
    context.temporariesReadInOptional.set(
      matchingPhi.id.id,
      assertNonNull(context.temporariesReadInOptional.get(outermostConsequent)),
    );
  }
}

function collectOptionalChainSidemap(fn: HIRFunction): OptionalChainSidemap {
  const context: OptionalTraversalContext = {
    blocks: fn.body.blocks,
    seenOptionals: new Set(),
    processedInstrsInOptional: new Set(),
    temporariesReadInOptional: new Map(),
    hoistableObjects: new Map(),
  };
  for (const [_, block] of fn.body.blocks) {
    if (
      block.terminal.kind === 'optional' &&
      !context.seenOptionals.has(block.id)
    ) {
      const optionalResult = traverseOptionalBlock(
        block as TBasicBlock<OptionalTerminal>,
        context,
        null,
      );
      if (optionalResult != null) {
        mapOutermostOptionalPhi(
          block as TBasicBlock<OptionalTerminal>,
          optionalResult,
          context,
        );
      }
    }
  }

  return {
    temporariesReadInOptional: context.temporariesReadInOptional,
    processedInstrsInOptional: context.processedInstrsInOptional,
    hoistableObjects: context.hoistableObjects,
  };
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
   * Records where a value was declared, and optionally, the scope where the value originated from.
   * This is later used to determine if a dependency should be added to a scope; if the current
   * scope we are visiting is the same scope where the value originates, it can't be a dependency
   * on itself.
   */
  declare(identifier: Identifier, decl: Decl): void {
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
  processedInstrsInOptional: ReadonlySet<InstructionId>,
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

    for (const instr of block.instructions) {
      if (!processedInstrsInOptional.has(instr.id)) {
        handleInstruction(instr, context);
      }
    }

    if (!processedInstrsInOptional.has(block.terminal.id)) {
      for (const place of eachTerminalOperand(block.terminal)) {
        context.visitOperand(place);
      }
    }
  }
  return context.deps;
}
