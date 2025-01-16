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
  InstructionValue,
  LoadContext,
  TInstruction,
  FunctionExpression,
  ObjectMethod,
  BlockId,
  makeTemporaryIdentifier,
  Effect,
  OptionalTerminal,
  TBasicBlock,
  ReactiveScopeTerminal,
  GotoVariant,
  PrunedScopeTerminal,
  ReactiveInstruction,
  ReactiveValue,
  ReactiveScopeBlock,
  PrunedReactiveScopeBlock,
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
import {
  collectOptionalChainSidemap,
  OptionalTraversalContext,
  traverseOptionalBlock,
} from './CollectOptionalChainDependencies';
import {Environment} from './Environment';
import HIRBuilder, {
  fixScopeAndIdentifierRanges,
  markInstructionIds,
  markPredecessors,
  reversePostorderBlocks,
} from './HIRBuilder';
import {lowerValueToTemporary} from './BuildHIR';
import {printDependency} from '../ReactiveScopes/PrintReactiveFunction';
import {NodePath} from '@babel/core';
import {printPlace} from './PrintHIR';

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
  const minimalDeps = new Map<ReactiveScope, Set<ReactiveScopeDependency>>();
  for (const [scope, deps] of scopeDeps) {
    if (deps.length === 0) {
      minimalDeps.set(scope, new Set());
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
    const dependencies = new Set<ReactiveScopeDependency>();
    for (const candidateDep of candidates) {
      if (
        !Iterable_some(
          dependencies,
          existingDep =>
            existingDep.identifier.declarationId ===
              candidateDep.identifier.declarationId &&
            areEqualPaths(existingDep.path, candidateDep.path),
        )
      )
        dependencies.add(candidateDep);
    }
    minimalDeps.set(scope, dependencies);
  }

  let changed = false;
  /**
   * Step 4: inject dependencies
   */
  for (const [_, {terminal}] of fn.body.blocks) {
    if (terminal.kind !== 'scope' && terminal.kind !== 'pruned-scope') {
      continue;
    }
    const scope = terminal.scope;
    const deps = minimalDeps.get(scope);
    if (deps == null || deps.size === 0) {
      continue;
    }
    writeScopeDependencies(terminal, deps, fn);
    changed = true;
  }

  if (changed) {
    /**
     * Step 5:
     * Fix scope and identifier ranges to account for renumbered instructions
     */
    reversePostorderBlocks(fn.body);
    markPredecessors(fn.body);
    markInstructionIds(fn.body);

    fixScopeAndIdentifierRanges(fn.body);
  }

  // Sanity check
  {
    for (const [scope, deps] of minimalDeps) {
      const checkedDeps = readScopeDependencies(fn, scope.id);
      CompilerError.invariant(checkedDeps != null, {
        reason: '[Rewrite] Cannot find scope dep when reading',
        loc: scope.loc,
      });
      CompilerError.invariant(checkedDeps.size === deps.size, {
        reason: '[Rewrite] non matching sizes when reading',
        description: `scopeId=${scope.id} deps=${[...deps].map(printDependency)} checkedDeps=${[...checkedDeps].map(printDependency)}`,
        loc: scope.loc,
      });
      label: for (const dep of deps) {
        for (const checkedDep of checkedDeps) {
          if (
            dep.identifier === checkedDep.identifier &&
            areEqualPaths(dep.path, checkedDep.path)
          ) {
            continue label;
          }
        }
        CompilerError.invariant(false, {
          reason:
            '[Rewrite] could not find match for dependency when re-reading',
          description: `${printDependency(dep)}`,
          loc: scope.loc,
        });
      }
    }
  }
}

function writeNonOptionalDependency(
  dep: ReactiveScopeDependency,
  env: Environment,
  builder: HIRBuilder,
): Identifier {
  const loc = dep.identifier.loc;
  let last: Identifier = makeTemporaryIdentifier(env.nextIdentifierId, loc);
  builder.push({
    lvalue: {
      identifier: last,
      kind: 'Identifier',
      effect: Effect.Mutate,
      reactive: dep.reactive,
      loc,
    },
    value: {
      kind: 'LoadLocal',
      place: {
        identifier: dep.identifier,
        kind: 'Identifier',
        effect: Effect.Freeze,
        reactive: dep.reactive,
        loc,
      },
      loc,
    },
    id: makeInstructionId(1),
    loc: loc,
  });

  for (const path of dep.path) {
    const next = makeTemporaryIdentifier(env.nextIdentifierId, loc);
    builder.push({
      lvalue: {
        identifier: next,
        kind: 'Identifier',
        effect: Effect.Mutate,
        reactive: dep.reactive,
        loc,
      },
      value: {
        kind: 'PropertyLoad',
        object: {
          identifier: last,
          kind: 'Identifier',
          effect: Effect.Freeze,
          reactive: dep.reactive,
          loc,
        },
        property: path.property,
        loc,
      },
      id: makeInstructionId(1),
      loc: loc,
    });
    last = next;
  }
  return last;
}

function writeScopeDependencies(
  terminal: ReactiveScopeTerminal | PrunedScopeTerminal,
  deps: Set<ReactiveScopeDependency>,
  fn: HIRFunction,
): void {
  const scopeDepBlock = fn.body.blocks.get(terminal.dependencies);

  CompilerError.invariant(scopeDepBlock != null, {
    reason: 'Expected nonnull scopeDepBlock',
    loc: terminal.loc,
  });
  CompilerError.invariant(
    scopeDepBlock.instructions.length === 0 &&
      scopeDepBlock.terminal.kind === 'goto' &&
      scopeDepBlock.terminal.block === terminal.block,
    {
      reason: 'Expected scope.dependencies to be a goto block',
      loc: terminal.loc,
    },
  );
  const builder = new HIRBuilder(fn.env, {
    entryBlockKind: 'value',
  });

  for (const dep of deps) {
    if (dep.path.every(path => !path.optional)) {
      const last = writeNonOptionalDependency(dep, fn.env, builder);
      terminal.scope.dependencies.push({
        kind: 'Identifier',
        identifier: last,
        effect: Effect.Freeze,
        reactive: dep.reactive,
        loc: GeneratedSource,
      });
    }
  }

  // Write all optional chaining deps
  for (const dep of deps) {
    if (!dep.path.every(path => !path.optional)) {
      const last = writeOptional(
        dep.path.length - 1,
        dep,
        builder,
        terminal,
        null,
      );
      terminal.scope.dependencies.push({
        kind: 'Identifier',
        identifier: last,
        effect: Effect.Freeze,
        reactive: dep.reactive,
        loc: GeneratedSource,
      });
    }
  }

  // Placeholder terminal for HIRBuilder (goto leads to block outside of that nested HIR)
  const lastBlockId = builder.terminate(
    {
      kind: 'return',
      value: {
        kind: 'Identifier',
        identifier: makeTemporaryIdentifier(
          fn.env.nextIdentifierId,
          GeneratedSource,
        ),
        effect: Effect.Freeze,
        loc: GeneratedSource,
        reactive: true,
      },
      loc: GeneratedSource,
      id: makeInstructionId(0),
    },
    null,
  );

  const dependenciesHIR = builder.build();
  for (const [id, block] of dependenciesHIR.blocks) {
    fn.body.blocks.set(id, block);
  }
  // Shouldn't be needed with RPO / removeUnreachableBlocks
  fn.body.blocks.delete(terminal.dependencies);
  terminal.dependencies = dependenciesHIR.entry;
  fn.body.blocks.get(lastBlockId)!.terminal = scopeDepBlock.terminal;
}

function writeOptional(
  idx: number,
  dep: ReactiveScopeDependency,
  builder: HIRBuilder,
  terminal: ReactiveScopeTerminal | PrunedScopeTerminal,
  parentAlternate: BlockId | null,
): Identifier {
  const env = builder.environment;
  CompilerError.invariant(
    idx >= 0 && !dep.path.slice(0, idx + 1).every(path => !path.optional),
    {
      reason: '[WriteOptional] Expected optional path',
      description: `${idx} ${printDependency(dep)}`,
      loc: GeneratedSource,
    },
  );
  const continuationBlock = builder.reserve(builder.currentBlockKind());
  const consequent = builder.reserve('value');

  const returnPlace: Place = {
    kind: 'Identifier',
    identifier: makeTemporaryIdentifier(env.nextIdentifierId, GeneratedSource),
    effect: Effect.Mutate,
    reactive: dep.reactive,
    loc: GeneratedSource,
  };

  let alternate;
  if (parentAlternate != null) {
    alternate = parentAlternate;
  } else {
    /**
     * Make outermost alternate block
     * $N = Primitive undefined
     * $M = StoreLocal $OptionalResult = $N
     * goto fallthrough
     */
    alternate = builder.enter('value', () => {
      const temp = lowerValueToTemporary(builder, {
        kind: 'Primitive',
        value: undefined,
        loc: GeneratedSource,
      });
      lowerValueToTemporary(builder, {
        kind: 'StoreLocal',
        lvalue: {kind: InstructionKind.Const, place: {...returnPlace}},
        value: {...temp},
        type: null,
        loc: GeneratedSource,
      });
      return {
        kind: 'goto',
        variant: GotoVariant.Break,
        block: continuationBlock.id,
        id: makeInstructionId(0),
        loc: GeneratedSource,
      };
    });
  }

  let testIdentifier: Identifier | null = null;
  const testBlock = builder.enter('value', () => {
    const firstOptional = dep.path.findIndex(path => path.optional);
    if (idx === firstOptional) {
      // Lower test block
      testIdentifier = writeNonOptionalDependency(
        {
          identifier: dep.identifier,
          reactive: dep.reactive,
          path: dep.path.slice(0, idx),
        },
        env,
        builder,
      );
    } else {
      testIdentifier = writeOptional(
        idx - 1,
        dep,
        builder,
        terminal,
        alternate,
      );
    }

    return {
      kind: 'branch',
      test: {
        identifier: testIdentifier,
        effect: Effect.Freeze,
        kind: 'Identifier',
        loc: GeneratedSource,
        reactive: dep.reactive,
      },
      consequent: consequent.id,
      alternate,
      id: makeInstructionId(0),
      loc: GeneratedSource,
      fallthrough: continuationBlock.id,
    };
  });

  CompilerError.invariant(testIdentifier !== null, {
    reason: 'Satisfy type checker',
    description: null,
    loc: null,
    suggestions: null,
  });

  builder.enterReserved(consequent, () => {
    CompilerError.invariant(testIdentifier !== null, {
      reason: 'Satisfy type checker',
      description: null,
      loc: null,
      suggestions: null,
    });

    const tmpConsequent = lowerValueToTemporary(builder, {
      kind: 'PropertyLoad',
      object: {
        identifier: testIdentifier,
        kind: 'Identifier',
        effect: Effect.Freeze,
        reactive: dep.reactive,
        loc: GeneratedSource,
      },
      property: dep.path[idx].property,
      loc: GeneratedSource,
    });
    lowerValueToTemporary(builder, {
      kind: 'StoreLocal',
      lvalue: {kind: InstructionKind.Const, place: {...returnPlace}},
      value: {...tmpConsequent},
      type: null,
      loc: GeneratedSource,
    });
    return {
      kind: 'goto',
      variant: GotoVariant.Break,
      block: continuationBlock.id,
      id: makeInstructionId(0),
      loc: GeneratedSource,
    };
  });
  builder.terminateWithContinuation(
    {
      kind: 'optional',
      optional: dep.path[idx].optional,
      test: testBlock,
      fallthrough: continuationBlock.id,
      id: makeInstructionId(0),
      loc: GeneratedSource,
    },
    continuationBlock,
  );

  return returnPlace.identifier;
}

export function readScopeDependencies(
  fn: HIRFunction,
  scope: ScopeId,
): Set<ReactiveScopeDependency> {
  for (const [_, {terminal}] of fn.body.blocks) {
    if (terminal.kind !== 'scope' && terminal.kind !== 'pruned-scope') {
      continue;
    }
    if (terminal.scope.id !== scope) {
      continue;
    }
    const temporaries = new Map<IdentifierId, ReactiveScopeDependency>();
    const context: OptionalTraversalContext = {
      currFn: fn,
      blocks: fn.body.blocks,
      seenOptionals: new Set(),
      processedInstrsInOptional: new Set(),
      temporariesReadInOptional: temporaries,
      hoistableObjects: new Map(),
    };
    /**
     * read all dependencies between scope and block
     */
    let work = terminal.dependencies;
    while (true) {
      const block = fn.body.blocks.get(work)!;
      for (const {lvalue, value} of block.instructions) {
        if (value.kind === 'LoadLocal') {
          temporaries.set(lvalue.identifier.id, {
            identifier: value.place.identifier,
            reactive: value.place.reactive,
            path: [],
          });
        } else if (value.kind === 'PropertyLoad') {
          const source = temporaries.get(value.object.identifier.id)!;
          temporaries.set(lvalue.identifier.id, {
            identifier: source.identifier,
            reactive: source.reactive,
            path: [...source.path, {property: value.property, optional: false}],
          });
        }
      }

      if (block.terminal.kind === 'optional') {
        traverseOptionalBlock(
          block as TBasicBlock<OptionalTerminal>,
          context,
          null,
        );
        work = block.terminal.fallthrough;
      } else {
        CompilerError.invariant(
          block.terminal.kind === 'goto' &&
            block.terminal.block === terminal.block,
          {
            reason: 'unexpected terminal',
            description: `kind: ${block.terminal.kind}`,
            loc: block.terminal.loc,
          },
        );
        break;
      }
    }

    const scopeOwnDependencies = new Set<ReactiveScopeDependency>();
    for (const dep of terminal.scope.dependencies) {
      const reactiveScopeDependency = temporaries.get(dep.identifier.id)!;
      CompilerError.invariant(reactiveScopeDependency != null, {
        reason: 'Expected dependency to be found',
        description: `${printPlace(dep)}`,
        loc: terminal.scope.loc,
      });
      scopeOwnDependencies.add(reactiveScopeDependency);
    }
    return scopeOwnDependencies;
  }
  CompilerError.invariant(false, {
    reason: 'Expected scope to be found',
    loc: GeneratedSource,
  });
}

function assertNonNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error('Expected nonnull value');
  }
  return value;
}

function _helperInstr(
  instr: ReactiveInstruction,
  sidemap: Map<IdentifierId, ReactiveScopeDependency>,
): void {
  const value = _helperValue(instr.value, sidemap);
  if (instr.lvalue != null) {
    sidemap.set(instr.lvalue.identifier.id, value);
  }
}
function _helperValue(
  instr: ReactiveValue,
  sidemap: Map<IdentifierId, ReactiveScopeDependency>,
): ReactiveScopeDependency {
  if (instr.kind === 'LoadLocal') {
    const base = sidemap.get(instr.place.identifier.id);
    if (base != null) {
      return base;
    } else {
      return {
        identifier: instr.place.identifier,
        reactive: instr.place.reactive,
        path: [],
      };
    }
  } else if (instr.kind === 'PropertyLoad') {
    const base = assertNonNull(sidemap.get(instr.object.identifier.id));
    return {
      identifier: base.identifier,
      reactive: base.reactive,
      path: [...base.path, {property: instr.property, optional: false}],
    };
  } else if (instr.kind === 'SequenceExpression') {
    for (const inner of instr.instructions) {
      _helperInstr(inner, sidemap);
    }
    return _helperValue(instr.value, sidemap);
  } else if (instr.kind === 'OptionalExpression') {
    const value = _helperValue(instr.value, sidemap);
    CompilerError.invariant(
      value.path.length > 0 && !value.path.at(-1)!.optional,
      {
        reason: 'Expected optional chain to be nonempty',
        loc: instr.loc,
      },
    );
    return {
      ...value,
      path: [
        ...value.path.slice(0, -1),
        {property: value.path.at(-1)!.property, optional: instr.optional},
      ],
    };
  }
  CompilerError.invariant(false, {
    reason: 'Unexpected value kind',
    description: instr.kind,
    loc: instr.loc,
  });
}

export function readScopeDependenciesRHIR(
  scopeBlock: ReactiveScopeBlock | PrunedReactiveScopeBlock,
): Map<Place, ReactiveScopeDependency> {
  const sidemap = new Map<IdentifierId, ReactiveScopeDependency>();
  for (const instr of scopeBlock.dependencyInstructions) {
    _helperInstr(instr.instruction, sidemap);
  }
  return new Map<Place, ReactiveScopeDependency>(
    scopeBlock.scope.dependencies.map(place => {
      return [place, assertNonNull(sidemap.get(place.identifier.id))];
    }),
  );
}

/**
 * Note: this only handles simple pruning i.e. deleting dependency entries,
 * not more complex rewrites such as truncating property paths.
 */
export function scopeDependenciesDCE(
  scopeBlock: ReactiveScopeBlock | PrunedReactiveScopeBlock,
): void {
  const usage = new Map<IdentifierId, IdentifierId | null>();
  for (const {
    instruction: {lvalue, value},
  } of scopeBlock.dependencyInstructions) {
    if (lvalue == null) {
      continue;
    }
    switch (value.kind) {
      case 'LoadLocal': {
        usage.set(lvalue.identifier.id, null);
        break;
      }
      case 'PropertyLoad': {
        usage.set(lvalue.identifier.id, value.object.identifier.id);
        break;
      }
      case 'OptionalExpression': {
        usage.set(lvalue.identifier.id, null);
        break;
      }
      default: {
        CompilerError.invariant(false, {
          reason: 'Unexpected value kind',
          description: value.kind,
          loc: value.loc,
        });
      }
    }
  }

  const notUsed = new Set(usage.keys());
  const seen = new Set();
  for (const {identifier} of scopeBlock.scope.dependencies) {
    let curr: IdentifierId | undefined | null = identifier.id;
    while (curr != null) {
      CompilerError.invariant(!seen.has(curr), {
        reason: 'infinite loop',
        loc: GeneratedSource,
      });
      notUsed.delete(curr);
      seen.add(curr);
      curr = usage.get(curr);
    }
  }
  /**
   * Remove unused instructions in place
   */
  let j = 0;
  for (let i = 0; i < scopeBlock.dependencyInstructions.length; i++) {
    const instr = scopeBlock.dependencyInstructions[i].instruction;
    if (instr.lvalue != null && !notUsed.has(instr.lvalue.identifier.id)) {
      scopeBlock.dependencyInstructions[j] =
        scopeBlock.dependencyInstructions[i];
      j++;
    }
  }
  scopeBlock.dependencyInstructions.length = j;
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
    null,
  );
  return temporaries;
}

function isLoadContextMutable(
  instrValue: InstructionValue,
  id: InstructionId,
): instrValue is LoadContext {
  if (instrValue.kind === 'LoadContext') {
    CompilerError.invariant(instrValue.place.identifier.scope != null, {
      reason:
        '[PropagateScopeDependencies] Expected all context variables to be assigned a scope',
      loc: instrValue.loc,
    });
    return id >= instrValue.place.identifier.scope.range.end;
  }
  return false;
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
  innerFnContext: {instrId: InstructionId} | null,
): void {
  for (const [_, block] of fn.body.blocks) {
    for (const {value, lvalue, id: origInstrId} of block.instructions) {
      const instrId =
        innerFnContext != null ? innerFnContext.instrId : origInstrId;
      const usedOutside = usedOutsideDeclaringScope.has(
        lvalue.identifier.declarationId,
      );

      if (value.kind === 'PropertyLoad' && !usedOutside) {
        if (
          innerFnContext == null ||
          temporaries.has(value.object.identifier.id)
        ) {
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
        (value.kind === 'LoadLocal' || isLoadContextMutable(value, instrId)) &&
        lvalue.identifier.name == null &&
        value.place.identifier.name !== null &&
        !usedOutside
      ) {
        if (
          innerFnContext == null ||
          fn.context.some(
            context => context.identifier.id === value.place.identifier.id,
          )
        ) {
          temporaries.set(lvalue.identifier.id, {
            identifier: value.place.identifier,
            reactive: value.place.reactive,
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
          innerFnContext ?? {instrId},
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
      reactive: object.reactive,
      path: [{property: propertyName, optional}],
    };
  } else {
    property = {
      identifier: resolvedDependency.identifier,
      reactive: resolvedDependency.reactive,
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
  #processedInstrsInOptional: ReadonlySet<Instruction | Terminal>;

  /**
   * Tracks the traversal state. See Context.declare for explanation of why this
   * is needed.
   */
  #innerFnContext: {outerInstrId: InstructionId} | null = null;

  constructor(
    temporariesUsedOutsideScope: ReadonlySet<DeclarationId>,
    temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
    processedInstrsInOptional: ReadonlySet<Instruction | Terminal>,
  ) {
    this.#temporariesUsedOutsideScope = temporariesUsedOutsideScope;
    this.#temporaries = temporaries;
    this.#processedInstrsInOptional = processedInstrsInOptional;
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
    if (this.#innerFnContext != null) return;
    if (!this.#declarations.has(identifier.declarationId)) {
      this.#declarations.set(identifier.declarationId, decl);
    }
    this.#reassignments.set(identifier, decl);
  }

  // Checks if identifier is a valid dependency in the current scope
  #checkValidDependency(maybeDependency: ReactiveScopeDependency): boolean {
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
        reactive: place.reactive,
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

    // ref.current access is not a valid dep
    if (
      isUseRefType(maybeDependency.identifier) &&
      maybeDependency.path.at(0)?.property === 'current'
    ) {
      maybeDependency = {
        identifier: maybeDependency.identifier,
        reactive: maybeDependency.reactive,
        path: [],
      };
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
      this.#checkValidDependency({
        identifier: place.identifier,
        reactive: place.reactive,
        path: [],
      })
    ) {
      currentScope.reassignments.add(place.identifier);
    }
  }
  enterInnerFn<T>(
    innerFn: TInstruction<FunctionExpression> | TInstruction<ObjectMethod>,
    cb: () => T,
  ): T {
    const prevContext = this.#innerFnContext;
    this.#innerFnContext = this.#innerFnContext ?? {outerInstrId: innerFn.id};
    const result = cb();
    this.#innerFnContext = prevContext;
    return result;
  }

  /**
   * Skip dependencies that are subexpressions of other dependencies. e.g. if a
   * dependency is tracked in the temporaries sidemap, it can be added at
   * site-of-use
   */
  isDeferredDependency(
    instr:
      | {kind: HIRValue.Instruction; value: Instruction}
      | {kind: HIRValue.Terminal; value: Terminal},
  ): boolean {
    return (
      this.#processedInstrsInOptional.has(instr.value) ||
      (instr.kind === HIRValue.Instruction &&
        this.#temporaries.has(instr.value.lvalue.identifier.id))
    );
  }
}
enum HIRValue {
  Instruction = 1,
  Terminal,
}

function handleInstruction(instr: Instruction, context: Context): void {
  const {id, value, lvalue} = instr;
  context.declare(lvalue.identifier, {
    id,
    scope: context.currentScope,
  });
  if (
    context.isDeferredDependency({kind: HIRValue.Instruction, value: instr})
  ) {
    return;
  }
  if (value.kind === 'PropertyLoad') {
    context.visitProperty(value.object, value.property, false);
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
}

function collectDependencies(
  fn: HIRFunction,
  usedOutsideDeclaringScope: ReadonlySet<DeclarationId>,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
  processedInstrsInOptional: ReadonlySet<Instruction | Terminal>,
): Map<ReactiveScope, Array<ReactiveScopeDependency>> {
  const context = new Context(
    usedOutsideDeclaringScope,
    temporaries,
    processedInstrsInOptional,
  );

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

  const handleFunction = (fn: HIRFunction): void => {
    for (const [blockId, block] of fn.body.blocks) {
      scopeTraversal.recordScopes(block);
      const scopeBlockInfo = scopeTraversal.blockInfos.get(blockId);
      if (scopeBlockInfo?.kind === 'begin') {
        context.enterScope(scopeBlockInfo.scope);
      } else if (scopeBlockInfo?.kind === 'end') {
        context.exitScope(scopeBlockInfo.scope, scopeBlockInfo.pruned);
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
        if (
          instr.value.kind === 'FunctionExpression' ||
          instr.value.kind === 'ObjectMethod'
        ) {
          context.declare(instr.lvalue.identifier, {
            id: instr.id,
            scope: context.currentScope,
          });
          /**
           * Recursively visit the inner function to extract dependencies there
           */
          const innerFn = instr.value.loweredFunc.func;
          context.enterInnerFn(
            instr as
              | TInstruction<FunctionExpression>
              | TInstruction<ObjectMethod>,
            () => {
              handleFunction(innerFn);
            },
          );
        } else {
          handleInstruction(instr, context);
        }
      }

      if (
        !context.isDeferredDependency({
          kind: HIRValue.Terminal,
          value: block.terminal,
        })
      ) {
        for (const place of eachTerminalOperand(block.terminal)) {
          context.visitOperand(place);
        }
      }
    }
  };

  handleFunction(fn);
  return context.deps;
}
