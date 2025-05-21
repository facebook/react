import {
  Place,
  ReactiveScopeDependency,
  Identifier,
  makeInstructionId,
  InstructionKind,
  GeneratedSource,
  BlockId,
  makeTemporaryIdentifier,
  Effect,
  GotoVariant,
  HIR,
} from './HIR';
import {CompilerError} from '../CompilerError';
import {Environment} from './Environment';
import HIRBuilder from './HIRBuilder';
import {lowerValueToTemporary} from './BuildHIR';
import {printDependency} from '../ReactiveScopes/PrintReactiveFunction';

type DependencyInstructions = {
  place: Place;
  value: HIR;
  exitBlockId: BlockId;
};

export function buildDependencyInstructions(
  dep: ReactiveScopeDependency,
  env: Environment,
): DependencyInstructions {
  const builder = new HIRBuilder(env, {
    entryBlockKind: 'value',
  });
  let result: Place;
  if (dep.path.every(path => !path.optional)) {
    const last = writeNonOptionalDependency(dep, env, builder);
    result = {
      kind: 'Identifier',
      identifier: last,
      effect: Effect.Freeze,
      reactive: dep.reactive,
      loc: GeneratedSource,
    };
  } else {
    const last = writeOptionalDependency(
      dep.path.length - 1,
      dep,
      builder,
      null,
    );
    result = {
      kind: 'Identifier',
      identifier: last,
      effect: Effect.Freeze,
      reactive: dep.reactive,
      loc: GeneratedSource,
    };
  }

  const exitBlockId = builder.terminate(
    {
      kind: 'unsupported',
      loc: GeneratedSource,
      id: makeInstructionId(0),
    },
    null,
  );
  return {
    place: result,
    value: builder.build(),
    exitBlockId,
  };
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

function writeOptionalDependency(
  idx: number,
  dep: ReactiveScopeDependency,
  builder: HIRBuilder,
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
      testIdentifier = writeOptionalDependency(
        idx - 1,
        dep,
        builder,
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
