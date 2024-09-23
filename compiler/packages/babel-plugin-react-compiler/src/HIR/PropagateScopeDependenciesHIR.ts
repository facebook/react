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
  DependencyPath,
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
import {Iterable_some} from '../Utils/utils';
import {ReactiveScopeDependencyTreeHIR} from './DeriveMinimalDependenciesHIR';
import {printIdentifier} from './PrintHIR';
import {printDependency} from '../ReactiveScopes/PrintReactiveFunction';

export function propagateScopeDependenciesHIR(fn: HIRFunction): void {
  const usedOutsideDeclaringScope =
    findTemporariesUsedOutsideDeclaringScope(fn);
  const {temporaries, optionals, processedInstrsInOptional} =
    collectTemporariesSidemap(fn, usedOutsideDeclaringScope);

  const hoistablePropertyLoads = collectHoistablePropertyLoads(
    fn,
    temporaries,
    optionals,
  );

  const scopeDeps = collectDependencies(
    fn,
    usedOutsideDeclaringScope,
    temporaries,
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
  id: IdentifierId;
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
    return {
      id: storeLocal.lvalue.place.identifier.id,
      property: propertyLoad.value.property,
      propertyId: propertyLoad.lvalue.identifier.id,
      storeLocalInstrId,
      consequentGoto: consequentBlock.terminal.block,
    };
  }
  return null;
}

function matchOptionalAlternateBlock(
  terminal: BranchTerminal,
  blocks: ReadonlyMap<BlockId, BasicBlock>,
): IdentifierId {
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
  return alternate.instructions[1].value.lvalue.place.identifier.id;
}

/**
 * Result:
 * - deriveNonNullIdentifiers only needs the outermost (maximal) property load
 *
 * - getDeps logic needs
 *   1. the entire temporaries map. note that it doesn't suffice to return the
 *      maximal load because some PropertyLoad rvalues are used multiple times
 *      e.g. MethodCall callees
 *   2. either a list of branch terminals to ignore (test condition) or a list
 *      of instruction ids (LoadLocal, PropertyLoad, and test terminals)
 */
type ReadOptionalBlockResult = {
  // Track optional blocks to avoid outer calls into nested optionals
  seenOptionals: Set<BlockId>;

  // Identifiers to ignore when deriving dependencies
  // Note that we should be able to track BlockIds here
  // because we currently only match a block if it only consists of
  /**
   * -- base --
   * bbN:
   *  Optional test=bbM
   * bbM:
   *  LoadLocal | LoadGlobal
   *  (PropertyLoad <prev> )*
   *  BranchTerminal test=<prev>
   *
   * -- recursive --
   * bbN:
   *  Optional test=bbM
   * bbM:
   *  Optional ... fallthrough=bbO
   * bbO:
   *  Branch test=<id from bbM's StoreLocal> then=bbP
   * bbP:
   *  PropertyLoad <id from bbM's StoreLocal>
   *  StoreLocal <prev>
   */
  processedInstrsInOptional: Set<InstructionId>;

  innerProperties: Map<IdentifierId, ReactiveScopeDependency>;

  lastNonOptionalLoad: ReactiveScopeDependency | null;
};

//   (a.b)?.[consequent]
//   (a?.b)?.[consequent]  <-- chaining is diff than left to right, so.. no!
// Optional_t test=(Optional_f test=(Optional_t test=a load='b') load='c') load='d'
// 0. Optional_t test=a  load='b'
// 1. Optional_f test=$0 load='c'  <-- Optional_f means that this participates in the optional chain of the test (i.e. cond control flow) but does not start one
// 2. Optional_t test=$1 load='d'
//  a?.b.c?.d    --> .d never evaluated if a is nullish
function readOptionalBlockInner(
  optional: TBasicBlock<OptionalTerminal>,
  blocks: ReadonlyMap<BlockId, BasicBlock>,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
  result: ReadOptionalBlockResult,
): {consequent: IdentifierId; alternateBlock: BlockId} | null {
  // we should never encounter already seen nodes in the recursive case
  result.seenOptionals.add(optional.id);
  const maybeTest = blocks.get(optional.terminal.test)!;
  if (maybeTest.terminal.kind === 'optional') {
    // chained optional i.e. base=<inner>?.b or <inner>.b
    const testBlock = blocks.get(maybeTest.terminal.fallthrough)!;
    if (testBlock!.terminal.kind !== 'branch') {
      CompilerError.throwTodo({
        reason: `Unexpected terminal kind \`${testBlock.terminal.kind}\` for optional fallthrough block`,
        loc: maybeTest.terminal.loc,
      });
    }
    /**
     * Step 1:
     *   recurse into the inner optional expr and get the relevant StoreLocal
     *
     * Step 2:
     *   fallthrough of the inner optional should be a block with no instructions,
     *   terminating with Test($<temporary written to from StoreLocal>)
     */

    // maybeOptional is the base of the optional expression
    // If the base is a reorderable member expression / load, result.get(maybeOptional) represents it
    // Otherwise, the base is an opaque temporary and we cannot easily rewrite
    const innerOptional = readOptionalBlockInner(
      maybeTest as TBasicBlock<OptionalTerminal>,
      blocks,
      temporaries,
      result,
    );
    if (innerOptional == null) {
      return null;
    }
    if (testBlock.terminal.test.identifier.id !== innerOptional.consequent) {
      /**
       * Check that the inner optional is part of the same optional-chain as the
       * outer one. This is not guaranteed, e.g. given a(c?.d)?.d, we get
       *
       * bb0:
       *   Optional test=bb1
       * bb1:
       *   $0 = LoadLocal a
       *   Optional test=bb2 fallthrough=bb5 <-- start of optional chain for c?.d
       * bb2:
       *   ... (optional chain for c?.d)
       * ...
       * bb5:
       *   $1 = phi(c.d, undefined)
       *   $2 = Call $0($1)
       *   Branch $2 ...
       */
      CompilerError.throwTodo({
        reason: '[OptionalChainDeps] Support nested optional-chaining',
        description: `Value written to from inner optional ${innerOptional.consequent} (${printDependency(result.innerProperties.get(innerOptional.consequent)!)}), value tested by outer optional ${testBlock.terminal.test.identifier.id}`,
        loc: testBlock.terminal.loc,
      });
    }
    if (!optional.terminal.optional) {
      // even if this loads from this node is not hoistable, loads from its
      // parent might be
      //
      // For example, a MethodCall a?.b() translates to
      //
      // Optional optional=false
      //   Optional optional=true (test=a, cons=a.b)
      //   cons=a.b()
      // we want to track that a?.b is inferred to be non-null
      result.lastNonOptionalLoad = assertNonNull(
        result.innerProperties.get(innerOptional.consequent),
      );
    }
    const matchConsequentResult = matchOptionalTestBlock(
      testBlock.terminal,
      blocks,
    );

    if (matchConsequentResult) {
      if (
        matchConsequentResult.consequentGoto !== optional.terminal.fallthrough
      ) {
        CompilerError.throwTodo({
          reason: '[OptionalChainDeps] Unexpected optional goto-fallthrough',
          loc: optional.terminal.loc,
        });
      }
      CompilerError.invariant(
        innerOptional.alternateBlock === testBlock.terminal.alternate,
        {
          reason: '[OptionalChainDeps] Inconsistent optional alternate',
          loc: optional.terminal.loc,
        },
      );
      // only add known loads
      const baseObject = result.innerProperties.get(innerOptional.consequent)!;
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
      result.innerProperties.set(matchConsequentResult.id, load);
      // duplicate so that we overwrite the correct Property mapping in
      // temporaries for dependency calculation
      // TODO: store this in a separate map (to be read only in `getDependencies` logic)
      result.innerProperties.set(matchConsequentResult.propertyId, load);
      /**
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
       *   $5 = MethodCall $2.$4() <--- here we want to take a dep on $2 and $4!
       */
      result.processedInstrsInOptional.add(testBlock.terminal.id);
      result.processedInstrsInOptional.add(
        matchConsequentResult.storeLocalInstrId,
      );
      return {
        consequent: matchConsequentResult.id,
        alternateBlock: innerOptional.alternateBlock,
      };
    } else {
      // Optional chain not hoistable e.g.
      // a?.[0]
      return null;
    }
  } else if (maybeTest.terminal.kind === 'branch') {
    CompilerError.invariant(optional.terminal.optional, {
      reason:
        '[OptionalChainDeps] Expect base optional case to be always optional',
      loc: optional.terminal.loc,
    });
    // (instruction 0 -> test instruction)
    // Note that this might not be true when chaining value-block exprssions but let's keep it when developing
    // normal test cases
    //  (a ?? b)?.c
    CompilerError.invariant(maybeTest.instructions.length >= 1, {
      reason:
        '[OptionalChainDeps] Expected direct optional test branch (base case) to have at least two instructions',
      loc: maybeTest.terminal.loc,
    });
    /**
     * Step 1: Explicitly calculate base of load
     *
     * (REMOVED) replace this with a lookup from the temporary map

    const testValue = assertNonNull(maybeTest.instructions.at(-1)).lvalue
      .identifier;

    Ideally, we would be able to flatten base instructions out of optional blocks, but optional bases are currently
    within value blocks (which cannot be interrupted by scope boundaries).
    As such, the only dependencies we can hoist out of optional chains are property chains (with no other instructions)
     */

    let baseIdentifier: Identifier;
    let lastLval: IdentifierId;
    const path: DependencyPath = [];
    const seenLvals = new Set<IdentifierId>();

    if (maybeTest.instructions[0].value.kind === 'LoadLocal') {
      baseIdentifier = maybeTest.instructions[0].value.place.identifier;
      lastLval = maybeTest.instructions[0].lvalue.identifier.id;
      seenLvals.add(lastLval);
    } else {
      return null;
    }
    for (let i = 1; i < maybeTest.instructions.length; i++) {
      const instrVal = maybeTest.instructions[i].value;
      if (
        instrVal.kind === 'PropertyLoad' &&
        instrVal.object.identifier.id === lastLval
      ) {
        path.push({property: instrVal.property, optional: false});
        lastLval = maybeTest.instructions[i].lvalue.identifier.id;
        seenLvals.add(lastLval);
      } else {
        // not hoistable base case
        return null;
      }
    }
    CompilerError.invariant(
      maybeTest.terminal.test.identifier.id === lastLval,
      {
        reason: '[OptionalChainDeps] Unexpected lval',
        loc: maybeTest.terminal.loc,
      },
    );
    const matchConsequentResult = matchOptionalTestBlock(
      maybeTest.terminal,
      blocks,
    );
    if (matchConsequentResult) {
      CompilerError.invariant(
        matchConsequentResult.consequentGoto === optional.terminal.fallthrough,
        {
          reason: '[OptionalChainDeps] Unexpected optional goto-fallthrough',
          loc: optional.terminal.loc,
        },
      );
      const load = {
        identifier: baseIdentifier,
        path: [
          ...path,
          {
            property: matchConsequentResult.property,
            optional: optional.terminal.optional,
          },
        ],
      };
      result.innerProperties.set(matchConsequentResult.id, load);
      // duplicate so that we overwrite the correct Property mapping in
      // temporaries for dependency calculation
      result.innerProperties.set(matchConsequentResult.propertyId, load);
      result.processedInstrsInOptional.add(maybeTest.terminal.id);
      result.processedInstrsInOptional.add(
        matchConsequentResult.storeLocalInstrId,
      );
      matchOptionalAlternateBlock(maybeTest.terminal, blocks);
      return {
        consequent: matchConsequentResult.id,
        alternateBlock: maybeTest.terminal.alternate,
      };
    } else {
      // Optional chain not hoistable e.g.
      // a?.[0]
      return null;
    }
  } else {
    // might be some nested value-block e.g.
    // (a ?? b)?.c
    return null;
  }
}

function readOptionalBlock(
  optional: TBasicBlock<OptionalTerminal>,
  blocks: ReadonlyMap<BlockId, BasicBlock>,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
): ReadOptionalBlockResult {
  const result: ReadOptionalBlockResult = {
    seenOptionals: new Set(),
    processedInstrsInOptional: new Set(),
    innerProperties: new Map(),
    lastNonOptionalLoad: null,
  };

  readOptionalBlockInner(optional, blocks, temporaries, result);
  return result;
}

type HIRSidemap = {
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>;
  // Instructions to skip when processing dependencies
  processedInstrsInOptional: Set<InstructionId>;
  optionals: ReadonlyMap<BlockId, ReactiveScopeDependency>;
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
): HIRSidemap {
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

  const seen = new Set<BlockId>();
  const optionals = new Map<BlockId, ReactiveScopeDependency>();
  let processedInstrsInOptional = new Set<InstructionId>();
  for (const [_, block] of fn.body.blocks) {
    if (block.terminal.kind === 'optional' && !seen.has(block.id)) {
      const optionalBlockResult = readOptionalBlock(
        block as TBasicBlock<OptionalTerminal>,
        fn.body.blocks,
        temporaries,
      );
      for (const id of optionalBlockResult.seenOptionals) {
        seen.add(id);
      }
      if (optionalBlockResult) {
        /**
         * This is definitely a hack. We know that intermediate rvalues are used
         * only in the optional chain itself. If we mapped to the real identifierId,
         * it would (incorrectly) be considered an optional dependency.
         *
         * the phi is hte best way of expressing "the value that a optional chain evaluates to".
         * Instead of storing the precise value, we store a subset (a?.b.c().d -> a?.b)
         */

        // // // This means that the optional block is an outermost optional block
        // // const {consequent, alternate} = optionalBlockResult;
        // const optionalFallthrough = assertNonNull(
        //   fn.body.blocks.get(block.terminal.fallthrough),
        // );

        // if (optionalFallthrough.phis.size === 0) {
        //   // might have been DCE'd
        //   continue;
        // }
        // CompilerError.invariant(optionalFallthrough.phis.size === 1, {
        //   reason: 'Unexpected phi size',
        //   description: `Expected 1 found ${optionalFallthrough.phis.size}`,
        //   loc: block.terminal.loc,
        // });
        // // for (const phi of optionalFallthrough.phis) {
        // const phi = [...optionalFallthrough.phis][0];
        // const operands = [...phi.operands];
        // CompilerError.invariant(
        //   operands.length === 2 &&
        //     operands.some(([_, id]) => id.id === consequent) &&
        //     operands.some(([_, id]) => id.id === alternate),
        //   {
        //     reason: 'Unexpected phi operands',
        //     description: `Found ${printPhi(phi)}`,
        //     loc: block.terminal.loc,
        //   },
        // );
        // temporaries.set(phi.id.id, mostPreciseHoistable);

        // const mostPreciseHoistable = assertNonNull(
        //   [...optionalBlockResult.innerProperties.values()].at(-1),
        // );

        if (optionalBlockResult.lastNonOptionalLoad) {
          // It might be more precise to set the fallthrough id here, but it
          // should be same as value blocks cannot jump / have non-linear
          // control flow
          optionals.set(block.id, optionalBlockResult.lastNonOptionalLoad);
        }

        for (const [id, val] of optionalBlockResult.innerProperties) {
          temporaries.set(id, val);
        }

        let size = optionalBlockResult.processedInstrsInOptional.size;
        // Hacky: don't add the last processed instruction -- this is the rvalue
        // we need when adding a dependency!
        for (const id of optionalBlockResult.processedInstrsInOptional) {
          if (--size > 0) {
            processedInstrsInOptional.add(id);
          }
        }
      }
    }
  }
  return {temporaries, processedInstrsInOptional, optionals};
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
      // avoid visiting branch tests of optional blocks
      for (const place of eachTerminalOperand(block.terminal)) {
        context.visitOperand(place);
      }
    }
  }
  return context.deps;
}
