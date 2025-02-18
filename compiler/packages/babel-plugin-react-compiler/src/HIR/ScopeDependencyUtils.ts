import {
  ScopeId,
  HIRFunction,
  Place,
  ReactiveScopeDependency,
  Identifier,
  makeInstructionId,
  InstructionKind,
  GeneratedSource,
  IdentifierId,
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
import {CompilerError} from '../CompilerError';
import {
  OptionalTraversalContext,
  traverseOptionalBlock,
} from './CollectOptionalChainDependencies';
import {Environment} from './Environment';
import HIRBuilder from './HIRBuilder';
import {lowerValueToTemporary} from './BuildHIR';
import {printDependency} from '../ReactiveScopes/PrintReactiveFunction';
import {printPlace} from './PrintHIR';

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

export function writeScopeDependencies(
  terminal: ReactiveScopeTerminal | PrunedScopeTerminal,
  deps: Set<ReactiveScopeDependency>,
  fn: HIRFunction,
): void {
  const scopeDepBlock = fn.body.blocks.get(terminal.dependencies);

  CompilerError.invariant(scopeDepBlock != null, {
    reason: 'Expected to find scope dependency block',
    loc: terminal.loc,
  });
  CompilerError.invariant(
    scopeDepBlock.instructions.length === 0 &&
      scopeDepBlock.terminal.kind === 'goto' &&
      scopeDepBlock.terminal.block === terminal.block,
    {
      reason: 'Expected scope.dependencies to be a goto block (invalid cfg)',
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

  // Placeholder terminal for HIRBuilder, to be later replaced by a `goto` to an outer block
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
  fn.body.blocks.delete(terminal.dependencies);

  /**
   * Connect the newly constructed inner HIR to the outer HIR
   */
  terminal.dependencies = dependenciesHIR.entry;
  // Rewire the replaceholder terminal to the correct goto
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
     * Step 1: read all instructions between within scope dependencies block(s)
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

    /**
     * Step 2: look up scope dependencies from the temporaries sidemap
     */
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

function readScopeDependenciesRHIRInstr(
  instr: ReactiveInstruction,
  sidemap: Map<IdentifierId, ReactiveScopeDependency>,
): void {
  const value = reacScopeDependenciesRHIRValue(instr.value, sidemap);
  if (instr.lvalue != null) {
    sidemap.set(instr.lvalue.identifier.id, value);
  }
}
function reacScopeDependenciesRHIRValue(
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
      readScopeDependenciesRHIRInstr(inner, sidemap);
    }
    return reacScopeDependenciesRHIRValue(instr.value, sidemap);
  } else if (instr.kind === 'OptionalExpression') {
    const value = reacScopeDependenciesRHIRValue(instr.value, sidemap);
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
    readScopeDependenciesRHIRInstr(instr.instruction, sidemap);
  }
  return new Map<Place, ReactiveScopeDependency>(
    scopeBlock.scope.dependencies.map(place => {
      return [place, assertNonNull(sidemap.get(place.identifier.id))];
    }),
  );
}

/**
 * Run DCE to delete instructions which are not used by any scope dependencies
 *
 * Note: this only handles simple pruning i.e. deleted dependency entries,
 * not more complex rewrites such as pruned or edited entries.
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
