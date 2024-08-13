/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from '@babel/types';
import {createHmac} from 'crypto';
import {
  pruneHoistedContexts,
  pruneUnusedLValues,
  pruneUnusedLabels,
  renameVariables,
} from '.';
import {CompilerError, ErrorSeverity} from '../CompilerError';
import {Environment, EnvironmentConfig, ExternalFunction} from '../HIR';
import {
  ArrayPattern,
  BlockId,
  DeclarationId,
  GeneratedSource,
  Identifier,
  IdentifierId,
  InstructionKind,
  JsxAttribute,
  ObjectMethod,
  ObjectPropertyKey,
  Pattern,
  Place,
  PrunedReactiveScopeBlock,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveScopeBlock,
  ReactiveScopeDependency,
  ReactiveTerminal,
  ReactiveValue,
  SourceLocation,
  SpreadPattern,
  ValidIdentifierName,
  getHookKind,
  makeIdentifierName,
} from '../HIR/HIR';
import {printIdentifier, printPlace} from '../HIR/PrintHIR';
import {eachPatternOperand} from '../HIR/visitors';
import {Err, Ok, Result} from '../Utils/Result';
import {GuardKind} from '../Utils/RuntimeDiagnosticConstants';
import {assertExhaustive} from '../Utils/utils';
import {buildReactiveFunction} from './BuildReactiveFunction';
import {SINGLE_CHILD_FBT_TAGS} from './MemoizeFbtAndMacroOperandsInSameScope';
import {ReactiveFunctionVisitor, visitReactiveFunction} from './visitors';
import {ReactFunctionType} from '../HIR/Environment';

export const MEMO_CACHE_SENTINEL = 'react.memo_cache_sentinel';
export const EARLY_RETURN_SENTINEL = 'react.early_return_sentinel';

export type CodegenFunction = {
  type: 'CodegenFunction';
  id: t.Identifier | null;
  params: t.FunctionDeclaration['params'];
  body: t.BlockStatement;
  generator: boolean;
  async: boolean;
  loc: SourceLocation;

  /*
   * Compiler info for logging and heuristics
   * Number of memo slots (value passed to useMemoCache)
   */
  memoSlotsUsed: number;
  /*
   * Number of memo *blocks* (reactive scopes) regardless of
   * how many inputs/outputs each block has
   */
  memoBlocks: number;

  /**
   * Number of memoized values across all reactive scopes
   */
  memoValues: number;

  /**
   * The number of reactive scopes that were created but had to be discarded
   * because they contained hook calls.
   */
  prunedMemoBlocks: number;

  /**
   * The total number of values that should have been memoized but weren't
   * because they were part of a pruned memo block.
   */
  prunedMemoValues: number;

  outlined: Array<{
    fn: CodegenFunction;
    type: ReactFunctionType | null;
  }>;

  /**
   * This is true if the compiler has the lowered useContext calls.
   */
  hasLoweredContextAccess: boolean;
};

export function codegenFunction(
  fn: ReactiveFunction,
  {
    uniqueIdentifiers,
    fbtOperands,
  }: {
    uniqueIdentifiers: Set<string>;
    fbtOperands: Set<IdentifierId>;
  },
): Result<CodegenFunction, CompilerError> {
  const cx = new Context(
    fn.env,
    fn.id ?? '[[ anonymous ]]',
    uniqueIdentifiers,
    fbtOperands,
    null,
  );

  /**
   * Fast Refresh reuses component instances at runtime even as the source of the component changes.
   * The generated code needs to prevent values from one version of the code being reused after a code cange.
   * If HMR detection is enabled and we know the source code of the component, assign a cache slot to track
   * the source hash, and later, emit code to check for source changes and reset the cache on source changes.
   */
  let fastRefreshState: {
    cacheIndex: number;
    hash: string;
  } | null = null;
  if (
    fn.env.config.enableResetCacheOnSourceFileChanges &&
    fn.env.code !== null
  ) {
    const hash = createHmac('sha256', fn.env.code).digest('hex');
    fastRefreshState = {
      cacheIndex: cx.nextCacheIndex,
      hash,
    };
  }

  const compileResult = codegenReactiveFunction(cx, fn);
  if (compileResult.isErr()) {
    return compileResult;
  }
  const compiled = compileResult.unwrap();

  const hookGuard = fn.env.config.enableEmitHookGuards;
  if (hookGuard != null) {
    compiled.body = t.blockStatement([
      createHookGuard(
        hookGuard,
        compiled.body.body,
        GuardKind.PushHookGuard,
        GuardKind.PopHookGuard,
      ),
    ]);
  }

  const cacheCount = compiled.memoSlotsUsed;
  if (cacheCount !== 0) {
    const preface: Array<t.Statement> = [];

    // The import declaration for `useMemoCache` is inserted in the Babel plugin
    preface.push(
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(cx.synthesizeName('$')),
          t.callExpression(t.identifier(fn.env.useMemoCacheIdentifier), [
            t.numericLiteral(cacheCount),
          ]),
        ),
      ]),
    );
    if (fastRefreshState !== null) {
      // HMR detection is enabled, emit code to reset the memo cache on source changes
      const index = cx.synthesizeName('$i');
      preface.push(
        t.ifStatement(
          t.binaryExpression(
            '!==',
            t.memberExpression(
              t.identifier(cx.synthesizeName('$')),
              t.numericLiteral(fastRefreshState.cacheIndex),
              true,
            ),
            t.stringLiteral(fastRefreshState.hash),
          ),
          t.blockStatement([
            t.forStatement(
              t.variableDeclaration('let', [
                t.variableDeclarator(t.identifier(index), t.numericLiteral(0)),
              ]),
              t.binaryExpression(
                '<',
                t.identifier(index),
                t.numericLiteral(cacheCount),
              ),
              t.assignmentExpression(
                '+=',
                t.identifier(index),
                t.numericLiteral(1),
              ),
              t.blockStatement([
                t.expressionStatement(
                  t.assignmentExpression(
                    '=',
                    t.memberExpression(
                      t.identifier(cx.synthesizeName('$')),
                      t.identifier(index),
                      true,
                    ),
                    t.callExpression(
                      t.memberExpression(
                        t.identifier('Symbol'),
                        t.identifier('for'),
                      ),
                      [t.stringLiteral(MEMO_CACHE_SENTINEL)],
                    ),
                  ),
                ),
              ]),
            ),
            t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.memberExpression(
                  t.identifier(cx.synthesizeName('$')),
                  t.numericLiteral(fastRefreshState.cacheIndex),
                  true,
                ),
                t.stringLiteral(fastRefreshState.hash),
              ),
            ),
          ]),
        ),
      );
    }
    compiled.body.body.unshift(...preface);
  }

  const emitInstrumentForget = fn.env.config.enableEmitInstrumentForget;
  if (emitInstrumentForget != null && fn.id != null) {
    /*
     * Technically, this is a conditional hook call. However, we expect
     * __DEV__ and gating identifier to be runtime constants
     */
    let gating: t.Expression;
    if (
      emitInstrumentForget.gating != null &&
      emitInstrumentForget.globalGating != null
    ) {
      gating = t.logicalExpression(
        '&&',
        t.identifier(emitInstrumentForget.globalGating),
        t.identifier(emitInstrumentForget.gating.importSpecifierName),
      );
    } else if (emitInstrumentForget.gating != null) {
      gating = t.identifier(emitInstrumentForget.gating.importSpecifierName);
    } else {
      CompilerError.invariant(emitInstrumentForget.globalGating != null, {
        reason:
          'Bad config not caught! Expected at least one of gating or globalGating',
        loc: null,
        suggestions: null,
      });
      gating = t.identifier(emitInstrumentForget.globalGating);
    }
    const test: t.IfStatement = t.ifStatement(
      gating,
      t.expressionStatement(
        t.callExpression(
          t.identifier(emitInstrumentForget.fn.importSpecifierName),
          [t.stringLiteral(fn.id), t.stringLiteral(fn.env.filename ?? '')],
        ),
      ),
    );
    compiled.body.body.unshift(test);
  }

  const outlined: CodegenFunction['outlined'] = [];
  for (const {fn: outlinedFunction, type} of cx.env.getOutlinedFunctions()) {
    const reactiveFunction = buildReactiveFunction(outlinedFunction);
    pruneUnusedLabels(reactiveFunction);
    pruneUnusedLValues(reactiveFunction);
    pruneHoistedContexts(reactiveFunction);

    const identifiers = renameVariables(reactiveFunction);
    const codegen = codegenReactiveFunction(
      new Context(
        cx.env,
        reactiveFunction.id ?? '[[ anonymous ]]',
        identifiers,
        cx.fbtOperands,
      ),
      reactiveFunction,
    );
    if (codegen.isErr()) {
      return codegen;
    }
    outlined.push({fn: codegen.unwrap(), type});
  }
  compiled.outlined = outlined;

  return compileResult;
}

function codegenReactiveFunction(
  cx: Context,
  fn: ReactiveFunction,
): Result<CodegenFunction, CompilerError> {
  for (const param of fn.params) {
    if (param.kind === 'Identifier') {
      cx.temp.set(param.identifier.declarationId, null);
    } else {
      cx.temp.set(param.place.identifier.declarationId, null);
    }
  }

  const params = fn.params.map(param => convertParameter(param));
  const body: t.BlockStatement = codegenBlock(cx, fn.body);
  body.directives = fn.directives.map(d => t.directive(t.directiveLiteral(d)));
  const statements = body.body;
  if (statements.length !== 0) {
    const last = statements[statements.length - 1];
    if (last.type === 'ReturnStatement' && last.argument == null) {
      statements.pop();
    }
  }

  if (cx.errors.hasErrors()) {
    return Err(cx.errors);
  }

  const countMemoBlockVisitor = new CountMemoBlockVisitor(fn.env);
  visitReactiveFunction(fn, countMemoBlockVisitor, undefined);

  return Ok({
    type: 'CodegenFunction',
    loc: fn.loc,
    id: fn.id !== null ? t.identifier(fn.id) : null,
    params,
    body,
    generator: fn.generator,
    async: fn.async,
    memoSlotsUsed: cx.nextCacheIndex,
    memoBlocks: countMemoBlockVisitor.memoBlocks,
    memoValues: countMemoBlockVisitor.memoValues,
    prunedMemoBlocks: countMemoBlockVisitor.prunedMemoBlocks,
    prunedMemoValues: countMemoBlockVisitor.prunedMemoValues,
    outlined: [],
    hasLoweredContextAccess: fn.env.hasLoweredContextAccess,
  });
}

class CountMemoBlockVisitor extends ReactiveFunctionVisitor<void> {
  env: Environment;
  memoBlocks: number = 0;
  memoValues: number = 0;
  prunedMemoBlocks: number = 0;
  prunedMemoValues: number = 0;

  constructor(env: Environment) {
    super();
    this.env = env;
  }

  override visitScope(scopeBlock: ReactiveScopeBlock, state: void): void {
    this.memoBlocks += 1;
    this.memoValues += scopeBlock.scope.declarations.size;
    this.traverseScope(scopeBlock, state);
  }

  override visitPrunedScope(
    scopeBlock: PrunedReactiveScopeBlock,
    state: void,
  ): void {
    this.prunedMemoBlocks += 1;
    this.prunedMemoValues += scopeBlock.scope.declarations.size;
    this.traversePrunedScope(scopeBlock, state);
  }
}

function convertParameter(
  param: Place | SpreadPattern,
): t.Identifier | t.RestElement {
  if (param.kind === 'Identifier') {
    return convertIdentifier(param.identifier);
  } else {
    return t.restElement(convertIdentifier(param.place.identifier));
  }
}

class Context {
  env: Environment;
  fnName: string;
  #nextCacheIndex: number = 0;
  /**
   * Tracks which named variables have been declared to dedupe declarations,
   * so this uses DeclarationId instead of IdentifierId
   */
  #declarations: Set<DeclarationId> = new Set();
  temp: Temporaries;
  errors: CompilerError = new CompilerError();
  objectMethods: Map<IdentifierId, ObjectMethod> = new Map();
  uniqueIdentifiers: Set<string>;
  fbtOperands: Set<IdentifierId>;
  synthesizedNames: Map<string, ValidIdentifierName> = new Map();

  constructor(
    env: Environment,
    fnName: string,
    uniqueIdentifiers: Set<string>,
    fbtOperands: Set<IdentifierId>,
    temporaries: Temporaries | null = null,
  ) {
    this.env = env;
    this.fnName = fnName;
    this.uniqueIdentifiers = uniqueIdentifiers;
    this.fbtOperands = fbtOperands;
    this.temp = temporaries !== null ? new Map(temporaries) : new Map();
  }
  get nextCacheIndex(): number {
    return this.#nextCacheIndex++;
  }

  declare(identifier: Identifier): void {
    this.#declarations.add(identifier.declarationId);
  }

  hasDeclared(identifier: Identifier): boolean {
    return this.#declarations.has(identifier.declarationId);
  }

  synthesizeName(name: string): ValidIdentifierName {
    const previous = this.synthesizedNames.get(name);
    if (previous !== undefined) {
      return previous;
    }
    let validated = makeIdentifierName(name).value;
    let index = 0;
    while (this.uniqueIdentifiers.has(validated)) {
      validated = makeIdentifierName(`${name}${index++}`).value;
    }
    this.uniqueIdentifiers.add(validated);
    this.synthesizedNames.set(name, validated);
    return validated;
  }
}

function codegenBlock(cx: Context, block: ReactiveBlock): t.BlockStatement {
  const temp = new Map(cx.temp);
  const result = codegenBlockNoReset(cx, block);
  /*
   * Check that the block only added new temporaries and did not update the
   * value of any existing temporary
   */
  for (const [key, value] of cx.temp) {
    if (!temp.has(key)) {
      continue;
    }
    CompilerError.invariant(temp.get(key)! === value, {
      loc: null,
      reason: 'Expected temporary value to be unchanged',
      description: null,
      suggestions: null,
    });
  }
  cx.temp = temp;
  return result;
}

/*
 * Generates code for the block, without resetting the Context's temporary state.
 * This should not be used unless it is expected that temporaries from this block
 * can be referenced later, which is currently only true for sequence expressions
 * where the final `value` is expected to reference the temporary created in the
 * preceding instructions of the sequence.
 */
function codegenBlockNoReset(
  cx: Context,
  block: ReactiveBlock,
): t.BlockStatement {
  const statements: Array<t.Statement> = [];
  for (const item of block) {
    switch (item.kind) {
      case 'instruction': {
        const statement = codegenInstructionNullable(cx, item.instruction);
        if (statement !== null) {
          statements.push(statement);
        }
        break;
      }
      case 'pruned-scope': {
        const scopeBlock = codegenBlockNoReset(cx, item.instructions);
        statements.push(...scopeBlock.body);
        break;
      }
      case 'scope': {
        const temp = new Map(cx.temp);
        codegenReactiveScope(cx, statements, item.scope, item.instructions);
        cx.temp = temp;
        break;
      }
      case 'terminal': {
        const statement = codegenTerminal(cx, item.terminal);
        if (statement === null) {
          break;
        }
        if (item.label !== null && !item.label.implicit) {
          const block =
            statement.type === 'BlockStatement' && statement.body.length === 1
              ? statement.body[0]
              : statement;
          statements.push(
            t.labeledStatement(
              t.identifier(codegenLabel(item.label.id)),
              block,
            ),
          );
        } else if (statement.type === 'BlockStatement') {
          statements.push(...statement.body);
        } else {
          statements.push(statement);
        }
        break;
      }
      default: {
        assertExhaustive(
          item,
          `Unexpected item kind \`${(item as any).kind}\``,
        );
      }
    }
  }
  return t.blockStatement(statements);
}

function wrapCacheDep(cx: Context, value: t.Expression): t.Expression {
  if (cx.env.config.enableEmitFreeze != null) {
    // The import declaration for emitFreeze is inserted in the Babel plugin
    return t.conditionalExpression(
      t.identifier('__DEV__'),
      t.callExpression(
        t.identifier(cx.env.config.enableEmitFreeze.importSpecifierName),
        [value, t.stringLiteral(cx.fnName)],
      ),
      value,
    );
  } else {
    return value;
  }
}

function codegenReactiveScope(
  cx: Context,
  statements: Array<t.Statement>,
  scope: ReactiveScope,
  block: ReactiveBlock,
): void {
  const cacheStoreStatements: Array<t.Statement> = [];
  const cacheLoadStatements: Array<t.Statement> = [];
  const cacheLoads: Array<{
    name: t.Identifier;
    index: number;
    value: t.Expression;
  }> = [];
  const changeExpressions: Array<t.Expression> = [];
  const changeExpressionComments: Array<string> = [];
  const outputComments: Array<string> = [];
  for (const dep of scope.dependencies) {
    const index = cx.nextCacheIndex;
    changeExpressionComments.push(printDependencyComment(dep));
    const comparison = t.binaryExpression(
      '!==',
      t.memberExpression(
        t.identifier(cx.synthesizeName('$')),
        t.numericLiteral(index),
        true,
      ),
      codegenDependency(cx, dep),
    );

    if (cx.env.config.enableChangeVariableCodegen) {
      const changeIdentifier = t.identifier(cx.synthesizeName(`c_${index}`));
      statements.push(
        t.variableDeclaration('const', [
          t.variableDeclarator(changeIdentifier, comparison),
        ]),
      );
      changeExpressions.push(changeIdentifier);
    } else {
      changeExpressions.push(comparison);
    }
    /*
     * Adding directly to cacheStoreStatements rather than cacheLoads, because there
     * is no corresponding cacheLoadStatement for dependencies
     */
    cacheStoreStatements.push(
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(
            t.identifier(cx.synthesizeName('$')),
            t.numericLiteral(index),
            true,
          ),
          codegenDependency(cx, dep),
        ),
      ),
    );
  }
  let firstOutputIndex: number | null = null;
  for (const [, {identifier}] of scope.declarations) {
    const index = cx.nextCacheIndex;
    if (firstOutputIndex === null) {
      firstOutputIndex = index;
    }

    CompilerError.invariant(identifier.name != null, {
      reason: `Expected scope declaration identifier to be named`,
      description: `Declaration \`${printIdentifier(
        identifier,
      )}\` is unnamed in scope @${scope.id}`,
      loc: null,
      suggestions: null,
    });

    const name = convertIdentifier(identifier);
    outputComments.push(name.name);
    if (!cx.hasDeclared(identifier)) {
      statements.push(
        t.variableDeclaration('let', [t.variableDeclarator(name)]),
      );
    }
    cacheLoads.push({name, index, value: wrapCacheDep(cx, name)});
    cx.declare(identifier);
  }
  for (const reassignment of scope.reassignments) {
    const index = cx.nextCacheIndex;
    if (firstOutputIndex === null) {
      firstOutputIndex = index;
    }
    const name = convertIdentifier(reassignment);
    outputComments.push(name.name);
    cacheLoads.push({name, index, value: wrapCacheDep(cx, name)});
  }

  let testCondition = (changeExpressions as Array<t.Expression>).reduce(
    (acc: t.Expression | null, ident: t.Expression) => {
      if (acc == null) {
        return ident;
      }
      return t.logicalExpression('||', acc, ident);
    },
    null as t.Expression | null,
  );
  if (testCondition === null) {
    CompilerError.invariant(firstOutputIndex !== null, {
      reason: `Expected scope to have at least one declaration`,
      description: `Scope '@${scope.id}' has no declarations`,
      loc: null,
      suggestions: null,
    });
    testCondition = t.binaryExpression(
      '===',
      t.memberExpression(
        t.identifier(cx.synthesizeName('$')),
        t.numericLiteral(firstOutputIndex),
        true,
      ),
      t.callExpression(
        t.memberExpression(t.identifier('Symbol'), t.identifier('for')),
        [t.stringLiteral(MEMO_CACHE_SENTINEL)],
      ),
    );
  }

  if (cx.env.config.disableMemoizationForDebugging) {
    CompilerError.invariant(
      cx.env.config.enableChangeDetectionForDebugging == null,
      {
        reason: `Expected to not have both change detection enabled and memoization disabled`,
        description: `Incompatible config options`,
        loc: null,
      },
    );
    testCondition = t.logicalExpression(
      '||',
      testCondition,
      t.booleanLiteral(true),
    );
  }
  let computationBlock = codegenBlock(cx, block);

  let memoStatement;
  if (
    cx.env.config.enableChangeDetectionForDebugging != null &&
    changeExpressions.length > 0
  ) {
    const loc =
      typeof scope.loc === 'symbol'
        ? 'unknown location'
        : `(${scope.loc.start.line}:${scope.loc.end.line})`;
    const detectionFunction =
      cx.env.config.enableChangeDetectionForDebugging.importSpecifierName;
    const cacheLoadOldValueStatements: Array<t.Statement> = [];
    const changeDetectionStatements: Array<t.Statement> = [];
    const idempotenceDetectionStatements: Array<t.Statement> = [];

    for (const {name, index, value} of cacheLoads) {
      const loadName = cx.synthesizeName(`old$${name.name}`);
      const slot = t.memberExpression(
        t.identifier(cx.synthesizeName('$')),
        t.numericLiteral(index),
        true,
      );
      cacheStoreStatements.push(
        t.expressionStatement(t.assignmentExpression('=', slot, value)),
      );
      cacheLoadOldValueStatements.push(
        t.variableDeclaration('let', [
          t.variableDeclarator(t.identifier(loadName), slot),
        ]),
      );
      changeDetectionStatements.push(
        t.expressionStatement(
          t.callExpression(t.identifier(detectionFunction), [
            t.identifier(loadName),
            t.cloneNode(name, true),
            t.stringLiteral(name.name),
            t.stringLiteral(cx.fnName),
            t.stringLiteral('cached'),
            t.stringLiteral(loc),
          ]),
        ),
      );
      idempotenceDetectionStatements.push(
        t.expressionStatement(
          t.callExpression(t.identifier(detectionFunction), [
            t.cloneNode(slot, true),
            t.cloneNode(name, true),
            t.stringLiteral(name.name),
            t.stringLiteral(cx.fnName),
            t.stringLiteral('recomputed'),
            t.stringLiteral(loc),
          ]),
        ),
      );
      idempotenceDetectionStatements.push(
        t.expressionStatement(t.assignmentExpression('=', name, slot)),
      );
    }
    const condition = cx.synthesizeName('condition');
    const recomputationBlock = t.cloneNode(computationBlock, true);
    memoStatement = t.blockStatement([
      ...computationBlock.body,
      t.variableDeclaration('let', [
        t.variableDeclarator(t.identifier(condition), testCondition),
      ]),
      t.ifStatement(
        t.unaryExpression('!', t.identifier(condition)),
        t.blockStatement([
          ...cacheLoadOldValueStatements,
          ...changeDetectionStatements,
        ]),
      ),
      ...cacheStoreStatements,
      t.ifStatement(
        t.identifier(condition),
        t.blockStatement([
          ...recomputationBlock.body,
          ...idempotenceDetectionStatements,
        ]),
      ),
    ]);
  } else {
    for (const {name, index, value} of cacheLoads) {
      cacheStoreStatements.push(
        t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.memberExpression(
              t.identifier(cx.synthesizeName('$')),
              t.numericLiteral(index),
              true,
            ),
            value,
          ),
        ),
      );
      cacheLoadStatements.push(
        t.expressionStatement(
          t.assignmentExpression(
            '=',
            name,
            t.memberExpression(
              t.identifier(cx.synthesizeName('$')),
              t.numericLiteral(index),
              true,
            ),
          ),
        ),
      );
    }
    computationBlock.body.push(...cacheStoreStatements);
    memoStatement = t.ifStatement(
      testCondition,
      computationBlock,
      t.blockStatement(cacheLoadStatements),
    );
  }

  if (cx.env.config.enableMemoizationComments) {
    if (changeExpressionComments.length) {
      t.addComment(
        memoStatement,
        'leading',
        ` check if ${printDelimitedCommentList(
          changeExpressionComments,
          'or',
        )} changed`,
        true,
      );
      t.addComment(
        memoStatement,
        'leading',
        ` "useMemo" for ${printDelimitedCommentList(outputComments, 'and')}:`,
        true,
      );
    } else {
      t.addComment(
        memoStatement,
        'leading',
        ' cache value with no dependencies',
        true,
      );
      t.addComment(
        memoStatement,
        'leading',
        ` "useMemo" for ${printDelimitedCommentList(outputComments, 'and')}:`,
        true,
      );
    }
    if (computationBlock.body.length > 0) {
      t.addComment(
        computationBlock.body[0]!,
        'leading',
        ` Inputs changed, recompute`,
        true,
      );
    }
    if (cacheLoadStatements.length > 0) {
      t.addComment(
        cacheLoadStatements[0]!,
        'leading',
        ` Inputs did not change, use cached value`,
        true,
      );
    }
  }
  statements.push(memoStatement);

  const earlyReturnValue = scope.earlyReturnValue;
  if (earlyReturnValue !== null) {
    CompilerError.invariant(
      earlyReturnValue.value.name !== null &&
        earlyReturnValue.value.name.kind === 'named',
      {
        reason: `Expected early return value to be promoted to a named variable`,
        loc: earlyReturnValue.loc,
        description: null,
        suggestions: null,
      },
    );
    const name: ValidIdentifierName = earlyReturnValue.value.name.value;
    statements.push(
      t.ifStatement(
        t.binaryExpression(
          '!==',
          t.identifier(name),
          t.callExpression(
            t.memberExpression(t.identifier('Symbol'), t.identifier('for')),
            [t.stringLiteral(EARLY_RETURN_SENTINEL)],
          ),
        ),
        t.blockStatement([t.returnStatement(t.identifier(name))]),
      ),
    );
  }
}

function codegenTerminal(
  cx: Context,
  terminal: ReactiveTerminal,
): t.Statement | null {
  switch (terminal.kind) {
    case 'break': {
      if (terminal.targetKind === 'implicit') {
        return null;
      }
      return t.breakStatement(
        terminal.targetKind === 'labeled'
          ? t.identifier(codegenLabel(terminal.target))
          : null,
      );
    }
    case 'continue': {
      if (terminal.targetKind === 'implicit') {
        return null;
      }
      return t.continueStatement(
        terminal.targetKind === 'labeled'
          ? t.identifier(codegenLabel(terminal.target))
          : null,
      );
    }
    case 'for': {
      return t.forStatement(
        codegenForInit(cx, terminal.init),
        codegenInstructionValueToExpression(cx, terminal.test),
        terminal.update !== null
          ? codegenInstructionValueToExpression(cx, terminal.update)
          : null,
        codegenBlock(cx, terminal.loop),
      );
    }
    case 'for-in': {
      CompilerError.invariant(terminal.init.kind === 'SequenceExpression', {
        reason: `Expected a sequence expression init for for..in`,
        description: `Got \`${terminal.init.kind}\` expression instead`,
        loc: terminal.init.loc,
        suggestions: null,
      });
      if (terminal.init.instructions.length !== 2) {
        CompilerError.throwTodo({
          reason: 'Support non-trivial for..in inits',
          description: null,
          loc: terminal.init.loc,
          suggestions: null,
        });
      }
      const iterableCollection = terminal.init.instructions[0];
      const iterableItem = terminal.init.instructions[1];
      let lval: t.LVal;
      switch (iterableItem.value.kind) {
        case 'StoreLocal': {
          lval = codegenLValue(cx, iterableItem.value.lvalue.place);
          break;
        }
        case 'Destructure': {
          lval = codegenLValue(cx, iterableItem.value.lvalue.pattern);
          break;
        }
        default:
          CompilerError.invariant(false, {
            reason: `Expected a StoreLocal or Destructure to be assigned to the collection`,
            description: `Found ${iterableItem.value.kind}`,
            loc: iterableItem.value.loc,
            suggestions: null,
          });
      }
      let varDeclKind: 'const' | 'let';
      switch (iterableItem.value.lvalue.kind) {
        case InstructionKind.Const:
          varDeclKind = 'const' as const;
          break;
        case InstructionKind.Let:
          varDeclKind = 'let' as const;
          break;
        case InstructionKind.Reassign:
          CompilerError.invariant(false, {
            reason:
              'Destructure should never be Reassign as it would be an Object/ArrayPattern',
            description: null,
            loc: iterableItem.loc,
            suggestions: null,
          });
        case InstructionKind.Catch:
          CompilerError.invariant(false, {
            reason: 'Unexpected catch variable as for..in collection',
            description: null,
            loc: iterableItem.loc,
            suggestions: null,
          });
        case InstructionKind.HoistedConst:
          CompilerError.invariant(false, {
            reason: 'Unexpected HoistedConst variable in for..in collection',
            description: null,
            loc: iterableItem.loc,
            suggestions: null,
          });
        case InstructionKind.HoistedLet:
          CompilerError.invariant(false, {
            reason: 'Unexpected HoistedLet variable in for..in collection',
            description: null,
            loc: iterableItem.loc,
            suggestions: null,
          });
        default:
          assertExhaustive(
            iterableItem.value.lvalue.kind,
            `Unhandled lvalue kind: ${iterableItem.value.lvalue.kind}`,
          );
      }
      return t.forInStatement(
        /*
         * Special handling here since we only want the VariableDeclarators without any inits
         * This needs to be updated when we handle non-trivial ForOf inits
         */
        createVariableDeclaration(iterableItem.value.loc, varDeclKind, [
          t.variableDeclarator(lval, null),
        ]),
        codegenInstructionValueToExpression(cx, iterableCollection.value),
        codegenBlock(cx, terminal.loop),
      );
    }
    case 'for-of': {
      CompilerError.invariant(
        terminal.init.kind === 'SequenceExpression' &&
          terminal.init.instructions.length === 1 &&
          terminal.init.instructions[0].value.kind === 'GetIterator',
        {
          reason: `Expected a single-expression sequence expression init for for..of`,
          description: `Got \`${terminal.init.kind}\` expression instead`,
          loc: terminal.init.loc,
          suggestions: null,
        },
      );
      const iterableCollection = terminal.init.instructions[0].value;

      CompilerError.invariant(terminal.test.kind === 'SequenceExpression', {
        reason: `Expected a sequence expression test for for..of`,
        description: `Got \`${terminal.init.kind}\` expression instead`,
        loc: terminal.test.loc,
        suggestions: null,
      });
      if (terminal.test.instructions.length !== 2) {
        CompilerError.throwTodo({
          reason: 'Support non-trivial for..of inits',
          description: null,
          loc: terminal.init.loc,
          suggestions: null,
        });
      }
      const iterableItem = terminal.test.instructions[1];
      let lval: t.LVal;
      switch (iterableItem.value.kind) {
        case 'StoreLocal': {
          lval = codegenLValue(cx, iterableItem.value.lvalue.place);
          break;
        }
        case 'Destructure': {
          lval = codegenLValue(cx, iterableItem.value.lvalue.pattern);
          break;
        }
        default:
          CompilerError.invariant(false, {
            reason: `Expected a StoreLocal or Destructure to be assigned to the collection`,
            description: `Found ${iterableItem.value.kind}`,
            loc: iterableItem.value.loc,
            suggestions: null,
          });
      }
      let varDeclKind: 'const' | 'let';
      switch (iterableItem.value.lvalue.kind) {
        case InstructionKind.Const:
          varDeclKind = 'const' as const;
          break;
        case InstructionKind.Let:
          varDeclKind = 'let' as const;
          break;
        case InstructionKind.Reassign:
          CompilerError.invariant(false, {
            reason:
              'Destructure should never be Reassign as it would be an Object/ArrayPattern',
            description: null,
            loc: iterableItem.loc,
            suggestions: null,
          });
        case InstructionKind.Catch:
          CompilerError.invariant(false, {
            reason: 'Unexpected catch variable as for..of collection',
            description: null,
            loc: iterableItem.loc,
            suggestions: null,
          });
        case InstructionKind.HoistedConst:
          CompilerError.invariant(false, {
            reason: 'Unexpected HoistedConst variable in for..of collection',
            description: null,
            loc: iterableItem.loc,
            suggestions: null,
          });
        case InstructionKind.HoistedLet:
          CompilerError.invariant(false, {
            reason: 'Unexpected HoistedLet variable in for..of collection',
            description: null,
            loc: iterableItem.loc,
            suggestions: null,
          });
        default:
          assertExhaustive(
            iterableItem.value.lvalue.kind,
            `Unhandled lvalue kind: ${iterableItem.value.lvalue.kind}`,
          );
      }
      return t.forOfStatement(
        /*
         * Special handling here since we only want the VariableDeclarators without any inits
         * This needs to be updated when we handle non-trivial ForOf inits
         */
        createVariableDeclaration(iterableItem.value.loc, varDeclKind, [
          t.variableDeclarator(lval, null),
        ]),
        codegenInstructionValueToExpression(cx, iterableCollection),
        codegenBlock(cx, terminal.loop),
      );
    }
    case 'if': {
      const test = codegenPlaceToExpression(cx, terminal.test);
      const consequent = codegenBlock(cx, terminal.consequent);
      let alternate: t.Statement | null = null;
      if (terminal.alternate !== null) {
        const block = codegenBlock(cx, terminal.alternate);
        if (block.body.length !== 0) {
          alternate = block;
        }
      }
      return t.ifStatement(test, consequent, alternate);
    }
    case 'return': {
      const value = codegenPlaceToExpression(cx, terminal.value);
      if (value.type === 'Identifier' && value.name === 'undefined') {
        // Use implicit undefined
        return t.returnStatement();
      }
      return t.returnStatement(value);
    }
    case 'switch': {
      return t.switchStatement(
        codegenPlaceToExpression(cx, terminal.test),
        terminal.cases.map(case_ => {
          const test =
            case_.test !== null
              ? codegenPlaceToExpression(cx, case_.test)
              : null;
          const block = codegenBlock(cx, case_.block!);
          return t.switchCase(test, [block]);
        }),
      );
    }
    case 'throw': {
      return t.throwStatement(codegenPlaceToExpression(cx, terminal.value));
    }
    case 'do-while': {
      const test = codegenInstructionValueToExpression(cx, terminal.test);
      return t.doWhileStatement(test, codegenBlock(cx, terminal.loop));
    }
    case 'while': {
      const test = codegenInstructionValueToExpression(cx, terminal.test);
      return t.whileStatement(test, codegenBlock(cx, terminal.loop));
    }
    case 'label': {
      return codegenBlock(cx, terminal.block);
    }
    case 'try': {
      let catchParam = null;
      if (terminal.handlerBinding !== null) {
        catchParam = convertIdentifier(terminal.handlerBinding.identifier);
        cx.temp.set(terminal.handlerBinding.identifier.declarationId, null);
      }
      return t.tryStatement(
        codegenBlock(cx, terminal.block),
        t.catchClause(catchParam, codegenBlock(cx, terminal.handler)),
      );
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind \`${(terminal as any).kind}\``,
      );
    }
  }
}

function codegenInstructionNullable(
  cx: Context,
  instr: ReactiveInstruction,
): t.Statement | null {
  if (
    instr.value.kind === 'StoreLocal' ||
    instr.value.kind === 'StoreContext' ||
    instr.value.kind === 'Destructure' ||
    instr.value.kind === 'DeclareLocal' ||
    instr.value.kind === 'DeclareContext'
  ) {
    let kind: InstructionKind = instr.value.lvalue.kind;
    let lvalue: Place | Pattern;
    let value: t.Expression | null;
    if (instr.value.kind === 'StoreLocal') {
      kind = cx.hasDeclared(instr.value.lvalue.place.identifier)
        ? InstructionKind.Reassign
        : kind;
      lvalue = instr.value.lvalue.place;
      value = codegenPlaceToExpression(cx, instr.value.value);
    } else if (instr.value.kind === 'StoreContext') {
      lvalue = instr.value.lvalue.place;
      value = codegenPlaceToExpression(cx, instr.value.value);
    } else if (
      instr.value.kind === 'DeclareLocal' ||
      instr.value.kind === 'DeclareContext'
    ) {
      if (cx.hasDeclared(instr.value.lvalue.place.identifier)) {
        return null;
      }
      kind = instr.value.lvalue.kind;
      lvalue = instr.value.lvalue.place;
      value = null;
    } else {
      lvalue = instr.value.lvalue.pattern;
      let hasReassign = false;
      let hasDeclaration = false;
      for (const place of eachPatternOperand(lvalue)) {
        if (
          kind !== InstructionKind.Reassign &&
          place.identifier.name === null
        ) {
          cx.temp.set(place.identifier.declarationId, null);
        }
        const isDeclared = cx.hasDeclared(place.identifier);
        hasReassign ||= isDeclared;
        hasDeclaration ||= !isDeclared;
      }
      if (hasReassign && hasDeclaration) {
        CompilerError.invariant(false, {
          reason:
            'Encountered a destructuring operation where some identifiers are already declared (reassignments) but others are not (declarations)',
          description: null,
          loc: instr.loc,
          suggestions: null,
        });
      } else if (hasReassign) {
        kind = InstructionKind.Reassign;
      }
      value = codegenPlaceToExpression(cx, instr.value.value);
    }
    switch (kind) {
      case InstructionKind.Const: {
        CompilerError.invariant(instr.lvalue === null, {
          reason: `Const declaration cannot be referenced as an expression`,
          description: null,
          loc: instr.value.loc,
          suggestions: null,
        });
        return createVariableDeclaration(instr.loc, 'const', [
          t.variableDeclarator(codegenLValue(cx, lvalue), value),
        ]);
      }
      case InstructionKind.Let: {
        CompilerError.invariant(instr.lvalue === null, {
          reason: `Const declaration cannot be referenced as an expression`,
          description: null,
          loc: instr.value.loc,
          suggestions: null,
        });
        return createVariableDeclaration(instr.loc, 'let', [
          t.variableDeclarator(codegenLValue(cx, lvalue), value),
        ]);
      }
      case InstructionKind.Reassign: {
        CompilerError.invariant(value !== null, {
          reason: 'Expected a value for reassignment',
          description: null,
          loc: instr.value.loc,
          suggestions: null,
        });
        const expr = t.assignmentExpression(
          '=',
          codegenLValue(cx, lvalue),
          value,
        );
        if (instr.lvalue !== null) {
          if (instr.value.kind !== 'StoreContext') {
            cx.temp.set(instr.lvalue.identifier.declarationId, expr);
            return null;
          } else {
            // Handle chained reassignments for context variables
            const statement = codegenInstruction(cx, instr, expr);
            if (statement.type === 'EmptyStatement') {
              return null;
            }
            return statement;
          }
        } else {
          return createExpressionStatement(instr.loc, expr);
        }
      }
      case InstructionKind.Catch: {
        return t.emptyStatement();
      }
      case InstructionKind.HoistedLet: {
        CompilerError.invariant(false, {
          reason:
            'Expected HoistedLet to have been pruned in PruneHoistedContexts',
          description: null,
          loc: instr.loc,
          suggestions: null,
        });
      }
      case InstructionKind.HoistedConst: {
        CompilerError.invariant(false, {
          reason:
            'Expected HoistedConsts to have been pruned in PruneHoistedContexts',
          description: null,
          loc: instr.loc,
          suggestions: null,
        });
      }
      default: {
        assertExhaustive(kind, `Unexpected instruction kind \`${kind}\``);
      }
    }
  } else if (
    instr.value.kind === 'StartMemoize' ||
    instr.value.kind === 'FinishMemoize'
  ) {
    return null;
  } else if (instr.value.kind === 'Debugger') {
    return t.debuggerStatement();
  } else if (instr.value.kind === 'ObjectMethod') {
    CompilerError.invariant(instr.lvalue, {
      reason: 'Expected object methods to have a temp lvalue',
      loc: null,
      suggestions: null,
    });
    cx.objectMethods.set(instr.lvalue.identifier.id, instr.value);
    return null;
  } else {
    const value = codegenInstructionValue(cx, instr.value);
    const statement = codegenInstruction(cx, instr, value);
    if (statement.type === 'EmptyStatement') {
      return null;
    }
    return statement;
  }
}

function codegenForInit(
  cx: Context,
  init: ReactiveValue,
): t.Expression | t.VariableDeclaration | null {
  if (init.kind === 'SequenceExpression') {
    for (const instr of init.instructions) {
      if (instr.value.kind === 'DeclareContext') {
        CompilerError.throwTodo({
          reason: `Support for loops where the index variable is a context variable`,
          loc: instr.loc,
          description:
            instr.value.lvalue.place.identifier.name != null
              ? `\`${instr.value.lvalue.place.identifier.name.value}\` is a context variable`
              : null,
          suggestions: null,
        });
      }
    }

    const body = codegenBlock(
      cx,
      init.instructions.map(instruction => ({
        kind: 'instruction',
        instruction,
      })),
    ).body;
    const declarators: Array<t.VariableDeclarator> = [];
    let kind: 'let' | 'const' = 'const';
    body.forEach(instr => {
      CompilerError.invariant(
        instr.type === 'VariableDeclaration' &&
          (instr.kind === 'let' || instr.kind === 'const'),
        {
          reason: 'Expected a variable declaration',
          loc: init.loc,
          description: `Got ${instr.type}`,
          suggestions: null,
        },
      );
      if (instr.kind === 'let') {
        kind = 'let';
      }
      declarators.push(...instr.declarations);
    });
    CompilerError.invariant(declarators.length > 0, {
      reason: 'Expected a variable declaration',
      loc: init.loc,
      description: null,
      suggestions: null,
    });
    return t.variableDeclaration(kind, declarators);
  } else {
    return codegenInstructionValueToExpression(cx, init);
  }
}

function printDependencyComment(dependency: ReactiveScopeDependency): string {
  const identifier = convertIdentifier(dependency.identifier);
  let name = identifier.name;
  if (dependency.path !== null) {
    for (const path of dependency.path) {
      name += `.${path}`;
    }
  }
  return name;
}

function printDelimitedCommentList(
  items: Array<string>,
  finalCompletion: string,
): string {
  if (items.length === 2) {
    return items.join(` ${finalCompletion} `);
  } else if (items.length <= 1) {
    return items.join('');
  }

  let output = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    if (i < items.length - 2) {
      output.push(`${item}, `);
    } else if (i === items.length - 2) {
      output.push(`${item}, ${finalCompletion} `);
    } else {
      output.push(item);
    }
  }
  return output.join('');
}

function codegenDependency(
  cx: Context,
  dependency: ReactiveScopeDependency,
): t.Expression {
  let object: t.Expression = convertIdentifier(dependency.identifier);
  if (dependency.path !== null) {
    for (const path of dependency.path) {
      object = t.memberExpression(object, t.identifier(path));
    }
  }
  return object;
}

function withLoc<T extends (...args: Array<any>) => t.Node>(
  fn: T,
): (
  loc: SourceLocation | null | undefined,
  ...args: Parameters<T>
) => ReturnType<T> {
  return (
    loc: SourceLocation | null | undefined,
    ...args: Parameters<T>
  ): ReturnType<T> => {
    const node = fn(...args);
    if (loc != null && loc != GeneratedSource) {
      node.loc = loc;
    }
    return node as ReturnType<T>;
  };
}

const createBinaryExpression = withLoc(t.binaryExpression);
const createExpressionStatement = withLoc(t.expressionStatement);
const _createLabelledStatement = withLoc(t.labeledStatement);
const createVariableDeclaration = withLoc(t.variableDeclaration);
const _createWhileStatement = withLoc(t.whileStatement);
const createTaggedTemplateExpression = withLoc(t.taggedTemplateExpression);
const createLogicalExpression = withLoc(t.logicalExpression);
const createSequenceExpression = withLoc(t.sequenceExpression);
const createConditionalExpression = withLoc(t.conditionalExpression);
const createTemplateLiteral = withLoc(t.templateLiteral);
const createJsxNamespacedName = withLoc(t.jsxNamespacedName);
const createJsxElement = withLoc(t.jsxElement);
const createJsxAttribute = withLoc(t.jsxAttribute);
const createJsxIdentifier = withLoc(t.jsxIdentifier);
const createJsxExpressionContainer = withLoc(t.jsxExpressionContainer);
const createJsxText = withLoc(t.jsxText);
const createJsxClosingElement = withLoc(t.jsxClosingElement);
const createJsxOpeningElement = withLoc(t.jsxOpeningElement);
const createStringLiteral = withLoc(t.stringLiteral);

function createHookGuard(
  guard: ExternalFunction,
  stmts: Array<t.Statement>,
  before: GuardKind,
  after: GuardKind,
): t.TryStatement {
  function createHookGuardImpl(kind: number): t.ExpressionStatement {
    return t.expressionStatement(
      t.callExpression(t.identifier(guard.importSpecifierName), [
        t.numericLiteral(kind),
      ]),
    );
  }

  return t.tryStatement(
    t.blockStatement([createHookGuardImpl(before), ...stmts]),
    null,
    t.blockStatement([createHookGuardImpl(after)]),
  );
}

/**
 * Create a call expression.
 * If enableEmitHookGuards is set and the callExpression is a hook call,
 * the following transform will be made.
 * ```js
 * // source
 * useHook(arg1, arg2)
 *
 * // codegen
 * (() => {
 *   try {
 *     $dispatcherGuard(PUSH_EXPECT_HOOK);
 *     return useHook(arg1, arg2);
 *   } finally {
 *     $dispatcherGuard(POP_EXPECT_HOOK);
 *   }
 * })()
 * ```
 */
function createCallExpression(
  config: EnvironmentConfig,
  callee: t.Expression,
  args: Array<t.Expression | t.SpreadElement>,
  loc: SourceLocation | null,
  isHook: boolean,
): t.CallExpression {
  const callExpr = t.callExpression(callee, args);
  if (loc != null && loc != GeneratedSource) {
    callExpr.loc = loc;
  }

  const hookGuard = config.enableEmitHookGuards;
  if (hookGuard != null && isHook) {
    const iife = t.functionExpression(
      null,
      [],
      t.blockStatement([
        createHookGuard(
          hookGuard,
          [t.returnStatement(callExpr)],
          GuardKind.AllowHook,
          GuardKind.DisallowHook,
        ),
      ]),
    );
    return t.callExpression(iife, []);
  } else {
    return callExpr;
  }
}

type Temporaries = Map<DeclarationId, t.Expression | t.JSXText | null>;

function codegenLabel(id: BlockId): string {
  return `bb${id}`;
}

function codegenInstruction(
  cx: Context,
  instr: ReactiveInstruction,
  value: t.Expression | t.JSXText,
): t.Statement {
  if (t.isStatement(value)) {
    return value;
  }
  if (instr.lvalue === null) {
    return t.expressionStatement(convertValueToExpression(value));
  }
  if (instr.lvalue.identifier.name === null) {
    // temporary
    cx.temp.set(instr.lvalue.identifier.declarationId, value);
    return t.emptyStatement();
  } else {
    const expressionValue = convertValueToExpression(value);
    if (cx.hasDeclared(instr.lvalue.identifier)) {
      return createExpressionStatement(
        instr.loc,
        t.assignmentExpression(
          '=',
          convertIdentifier(instr.lvalue.identifier),
          expressionValue,
        ),
      );
    } else {
      return createVariableDeclaration(instr.loc, 'const', [
        t.variableDeclarator(
          convertIdentifier(instr.lvalue.identifier),
          expressionValue,
        ),
      ]);
    }
  }
}

function convertValueToExpression(
  value: t.JSXText | t.Expression,
): t.Expression {
  if (value.type === 'JSXText') {
    return createStringLiteral(value.loc, value.value);
  }
  return value;
}

function codegenInstructionValueToExpression(
  cx: Context,
  instrValue: ReactiveValue,
): t.Expression {
  const value = codegenInstructionValue(cx, instrValue);
  return convertValueToExpression(value);
}

function codegenInstructionValue(
  cx: Context,
  instrValue: ReactiveValue,
): t.Expression | t.JSXText {
  let value: t.Expression | t.JSXText;
  switch (instrValue.kind) {
    case 'ArrayExpression': {
      const elements = instrValue.elements.map(element => {
        if (element.kind === 'Identifier') {
          return codegenPlaceToExpression(cx, element);
        } else if (element.kind === 'Spread') {
          return t.spreadElement(codegenPlaceToExpression(cx, element.place));
        } else {
          return null;
        }
      });
      value = t.arrayExpression(elements);
      break;
    }
    case 'BinaryExpression': {
      const left = codegenPlaceToExpression(cx, instrValue.left);
      const right = codegenPlaceToExpression(cx, instrValue.right);
      value = createBinaryExpression(
        instrValue.loc,
        instrValue.operator,
        left,
        right,
      );
      break;
    }
    case 'UnaryExpression': {
      value = t.unaryExpression(
        instrValue.operator as 'throw', // todo
        codegenPlaceToExpression(cx, instrValue.value),
      );
      break;
    }
    case 'Primitive': {
      value = codegenValue(cx, instrValue.loc, instrValue.value);
      break;
    }
    case 'CallExpression': {
      if (cx.env.config.enableForest) {
        const callee = codegenPlaceToExpression(cx, instrValue.callee);
        const args = instrValue.args.map(arg => codegenArgument(cx, arg));
        value = t.callExpression(callee, args);
        if (instrValue.typeArguments != null) {
          value.typeArguments = t.typeParameterInstantiation(
            instrValue.typeArguments,
          );
        }
        break;
      }
      const isHook = getHookKind(cx.env, instrValue.callee.identifier) != null;
      const callee = codegenPlaceToExpression(cx, instrValue.callee);
      const args = instrValue.args.map(arg => codegenArgument(cx, arg));
      value = createCallExpression(
        cx.env.config,
        callee,
        args,
        instrValue.loc,
        isHook,
      );
      break;
    }
    case 'OptionalExpression': {
      const optionalValue = codegenInstructionValueToExpression(
        cx,
        instrValue.value,
      );
      switch (optionalValue.type) {
        case 'OptionalCallExpression':
        case 'CallExpression': {
          CompilerError.invariant(t.isExpression(optionalValue.callee), {
            reason: 'v8 intrinsics are validated during lowering',
            description: null,
            loc: optionalValue.callee.loc ?? null,
            suggestions: null,
          });
          value = t.optionalCallExpression(
            optionalValue.callee,
            optionalValue.arguments,
            instrValue.optional,
          );
          break;
        }
        case 'OptionalMemberExpression':
        case 'MemberExpression': {
          const property = optionalValue.property;
          CompilerError.invariant(t.isExpression(property), {
            reason: 'Private names are validated during lowering',
            description: null,
            loc: property.loc ?? null,
            suggestions: null,
          });
          value = t.optionalMemberExpression(
            optionalValue.object,
            property,
            optionalValue.computed,
            instrValue.optional,
          );
          break;
        }
        default: {
          CompilerError.invariant(false, {
            reason:
              'Expected an optional value to resolve to a call expression or member expression',
            description: `Got a \`${optionalValue.type}\``,
            loc: instrValue.loc,
            suggestions: null,
          });
        }
      }
      break;
    }
    case 'MethodCall': {
      const isHook =
        getHookKind(cx.env, instrValue.property.identifier) != null;
      const memberExpr = codegenPlaceToExpression(cx, instrValue.property);
      CompilerError.invariant(
        t.isMemberExpression(memberExpr) ||
          t.isOptionalMemberExpression(memberExpr),
        {
          reason:
            '[Codegen] Internal error: MethodCall::property must be an unpromoted + unmemoized MemberExpression. ' +
            `Got a \`${memberExpr.type}\``,
          description: null,
          loc: memberExpr.loc ?? null,
          suggestions: null,
        },
      );
      CompilerError.invariant(
        t.isNodesEquivalent(
          memberExpr.object,
          codegenPlaceToExpression(cx, instrValue.receiver),
        ),
        {
          reason:
            '[Codegen] Internal error: Forget should always generate MethodCall::property ' +
            'as a MemberExpression of MethodCall::receiver',
          description: null,
          loc: memberExpr.loc ?? null,
          suggestions: null,
        },
      );
      const args = instrValue.args.map(arg => codegenArgument(cx, arg));
      value = createCallExpression(
        cx.env.config,
        memberExpr,
        args,
        instrValue.loc,
        isHook,
      );
      break;
    }
    case 'NewExpression': {
      const callee = codegenPlaceToExpression(cx, instrValue.callee);
      const args = instrValue.args.map(arg => codegenArgument(cx, arg));
      value = t.newExpression(callee, args);
      break;
    }
    case 'ObjectExpression': {
      const properties = [];
      for (const property of instrValue.properties) {
        if (property.kind === 'ObjectProperty') {
          const key = codegenObjectPropertyKey(cx, property.key);

          switch (property.type) {
            case 'property': {
              const value = codegenPlaceToExpression(cx, property.place);
              properties.push(
                t.objectProperty(
                  key,
                  value,
                  property.key.kind === 'computed',
                  key.type === 'Identifier' &&
                    value.type === 'Identifier' &&
                    value.name === key.name,
                ),
              );
              break;
            }
            case 'method': {
              const method = cx.objectMethods.get(property.place.identifier.id);
              CompilerError.invariant(method, {
                reason: 'Expected ObjectMethod instruction',
                loc: null,
                suggestions: null,
              });
              const loweredFunc = method.loweredFunc;
              const reactiveFunction = buildReactiveFunction(loweredFunc.func);
              pruneUnusedLabels(reactiveFunction);
              pruneUnusedLValues(reactiveFunction);
              const fn = codegenReactiveFunction(
                new Context(
                  cx.env,
                  reactiveFunction.id ?? '[[ anonymous ]]',
                  cx.uniqueIdentifiers,
                  cx.fbtOperands,
                  cx.temp,
                ),
                reactiveFunction,
              ).unwrap();

              /*
               * ObjectMethod builder must be backwards compatible with older versions of babel.
               * https://github.com/babel/babel/blob/v7.7.4/packages/babel-types/src/definitions/core.js#L599-L603
               */
              const babelNode = t.objectMethod(
                'method',
                key,
                fn.params,
                fn.body,
                false,
              );
              babelNode.async = fn.async;
              babelNode.generator = fn.generator;
              properties.push(babelNode);
              break;
            }
            default:
              assertExhaustive(
                property.type,
                `Unexpected property type: ${property.type}`,
              );
          }
        } else {
          properties.push(
            t.spreadElement(codegenPlaceToExpression(cx, property.place)),
          );
        }
      }
      value = t.objectExpression(properties);
      break;
    }
    case 'JSXText': {
      value = createJsxText(instrValue.loc, instrValue.value);
      break;
    }
    case 'JsxExpression': {
      const attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute> = [];
      for (const attribute of instrValue.props) {
        attributes.push(codegenJsxAttribute(cx, attribute));
      }
      let tagValue =
        instrValue.tag.kind === 'Identifier'
          ? codegenPlaceToExpression(cx, instrValue.tag)
          : t.stringLiteral(instrValue.tag.name);
      let tag: t.JSXIdentifier | t.JSXNamespacedName | t.JSXMemberExpression;
      if (tagValue.type === 'Identifier') {
        tag = createJsxIdentifier(instrValue.tag.loc, tagValue.name);
      } else if (tagValue.type === 'MemberExpression') {
        tag = convertMemberExpressionToJsx(tagValue);
      } else {
        CompilerError.invariant(tagValue.type === 'StringLiteral', {
          reason: `Expected JSX tag to be an identifier or string, got \`${tagValue.type}\``,
          description: null,
          loc: tagValue.loc ?? null,
          suggestions: null,
        });
        if (tagValue.value.indexOf(':') >= 0) {
          const [namespace, name] = tagValue.value.split(':', 2);
          tag = createJsxNamespacedName(
            instrValue.tag.loc,
            createJsxIdentifier(instrValue.tag.loc, namespace),
            createJsxIdentifier(instrValue.tag.loc, name),
          );
        } else {
          tag = createJsxIdentifier(instrValue.loc, tagValue.value);
        }
      }
      let children;
      if (
        tagValue.type === 'StringLiteral' &&
        SINGLE_CHILD_FBT_TAGS.has(tagValue.value)
      ) {
        CompilerError.invariant(instrValue.children != null, {
          loc: instrValue.loc,
          reason: 'Expected fbt element to have children',
          suggestions: null,
          description: null,
        });
        children = instrValue.children.map(child =>
          codegenJsxFbtChildElement(cx, child),
        );
      } else {
        children =
          instrValue.children !== null
            ? instrValue.children.map(child => codegenJsxElement(cx, child))
            : [];
      }
      value = createJsxElement(
        instrValue.loc,
        createJsxOpeningElement(
          instrValue.openingLoc,
          tag,
          attributes,
          instrValue.children === null,
        ),
        instrValue.children !== null
          ? createJsxClosingElement(instrValue.closingLoc, tag)
          : null,
        children,
        instrValue.children === null,
      );
      break;
    }
    case 'JsxFragment': {
      value = t.jsxFragment(
        t.jsxOpeningFragment(),
        t.jsxClosingFragment(),
        instrValue.children.map(child => codegenJsxElement(cx, child)),
      );
      break;
    }
    case 'UnsupportedNode': {
      const node = instrValue.node;
      if (!t.isExpression(node)) {
        return node as any; // TODO handle statements, jsx fragments
      }
      value = node;
      break;
    }
    case 'PropertyStore': {
      value = t.assignmentExpression(
        '=',
        t.memberExpression(
          codegenPlaceToExpression(cx, instrValue.object),
          t.identifier(instrValue.property),
        ),
        codegenPlaceToExpression(cx, instrValue.value),
      );
      break;
    }
    case 'PropertyLoad': {
      const object = codegenPlaceToExpression(cx, instrValue.object);
      /*
       * We currently only lower single chains of optional memberexpr.
       * (See BuildHIR.ts for more detail.)
       */
      value = t.memberExpression(
        object,
        t.identifier(instrValue.property),
        undefined,
      );
      break;
    }
    case 'PropertyDelete': {
      value = t.unaryExpression(
        'delete',
        t.memberExpression(
          codegenPlaceToExpression(cx, instrValue.object),
          t.identifier(instrValue.property),
        ),
      );
      break;
    }
    case 'ComputedStore': {
      value = t.assignmentExpression(
        '=',
        t.memberExpression(
          codegenPlaceToExpression(cx, instrValue.object),
          codegenPlaceToExpression(cx, instrValue.property),
          true,
        ),
        codegenPlaceToExpression(cx, instrValue.value),
      );
      break;
    }
    case 'ComputedLoad': {
      const object = codegenPlaceToExpression(cx, instrValue.object);
      const property = codegenPlaceToExpression(cx, instrValue.property);
      value = t.memberExpression(object, property, true);
      break;
    }
    case 'ComputedDelete': {
      value = t.unaryExpression(
        'delete',
        t.memberExpression(
          codegenPlaceToExpression(cx, instrValue.object),
          codegenPlaceToExpression(cx, instrValue.property),
          true,
        ),
      );
      break;
    }
    case 'LoadLocal':
    case 'LoadContext': {
      value = codegenPlaceToExpression(cx, instrValue.place);
      break;
    }
    case 'FunctionExpression': {
      const loweredFunc = instrValue.loweredFunc.func;
      const reactiveFunction = buildReactiveFunction(loweredFunc);
      pruneUnusedLabels(reactiveFunction);
      pruneUnusedLValues(reactiveFunction);
      pruneHoistedContexts(reactiveFunction);
      const fn = codegenReactiveFunction(
        new Context(
          cx.env,
          reactiveFunction.id ?? '[[ anonymous ]]',
          cx.uniqueIdentifiers,
          cx.fbtOperands,
          cx.temp,
        ),
        reactiveFunction,
      ).unwrap();
      if (instrValue.type === 'ArrowFunctionExpression') {
        let body: t.BlockStatement | t.Expression = fn.body;
        if (body.body.length === 1 && loweredFunc.directives.length == 0) {
          const stmt = body.body[0]!;
          if (stmt.type === 'ReturnStatement' && stmt.argument != null) {
            body = stmt.argument;
          }
        }
        value = t.arrowFunctionExpression(fn.params, body, fn.async);
      } else {
        value = t.functionExpression(
          fn.id ??
            (instrValue.name != null ? t.identifier(instrValue.name) : null),
          fn.params,
          fn.body,
          fn.generator,
          fn.async,
        );
      }
      break;
    }
    case 'TaggedTemplateExpression': {
      value = createTaggedTemplateExpression(
        instrValue.loc,
        codegenPlaceToExpression(cx, instrValue.tag),
        t.templateLiteral([t.templateElement(instrValue.value)], []),
      );
      break;
    }
    case 'TypeCastExpression': {
      if (t.isTSType(instrValue.typeAnnotation)) {
        value = t.tsAsExpression(
          codegenPlaceToExpression(cx, instrValue.value),
          instrValue.typeAnnotation,
        );
      } else {
        value = t.typeCastExpression(
          codegenPlaceToExpression(cx, instrValue.value),
          t.typeAnnotation(instrValue.typeAnnotation),
        );
      }
      break;
    }
    case 'LogicalExpression': {
      value = createLogicalExpression(
        instrValue.loc,
        instrValue.operator,
        codegenInstructionValueToExpression(cx, instrValue.left),
        codegenInstructionValueToExpression(cx, instrValue.right),
      );
      break;
    }
    case 'ConditionalExpression': {
      value = createConditionalExpression(
        instrValue.loc,
        codegenInstructionValueToExpression(cx, instrValue.test),
        codegenInstructionValueToExpression(cx, instrValue.consequent),
        codegenInstructionValueToExpression(cx, instrValue.alternate),
      );
      break;
    }
    case 'SequenceExpression': {
      const body = codegenBlockNoReset(
        cx,
        instrValue.instructions.map(instruction => ({
          kind: 'instruction',
          instruction,
        })),
      ).body;
      const expressions = body.map(stmt => {
        if (stmt.type === 'ExpressionStatement') {
          return stmt.expression;
        } else {
          if (t.isVariableDeclaration(stmt)) {
            const declarator = stmt.declarations[0];
            cx.errors.push({
              reason: `(CodegenReactiveFunction::codegenInstructionValue) Cannot declare variables in a value block, tried to declare '${
                (declarator.id as t.Identifier).name
              }'`,
              severity: ErrorSeverity.Todo,
              loc: declarator.loc ?? null,
              suggestions: null,
            });
            return t.stringLiteral(`TODO handle ${declarator.id}`);
          } else {
            cx.errors.push({
              reason: `(CodegenReactiveFunction::codegenInstructionValue) Handle conversion of ${stmt.type} to expression`,
              severity: ErrorSeverity.Todo,
              loc: stmt.loc ?? null,
              suggestions: null,
            });
            return t.stringLiteral(`TODO handle ${stmt.type}`);
          }
        }
      });
      if (expressions.length === 0) {
        value = codegenInstructionValueToExpression(cx, instrValue.value);
      } else {
        value = createSequenceExpression(instrValue.loc, [
          ...expressions,
          codegenInstructionValueToExpression(cx, instrValue.value),
        ]);
      }
      break;
    }
    case 'TemplateLiteral': {
      value = createTemplateLiteral(
        instrValue.loc,
        instrValue.quasis.map(q => t.templateElement(q)),
        instrValue.subexprs.map(p => codegenPlaceToExpression(cx, p)),
      );
      break;
    }
    case 'LoadGlobal': {
      value = t.identifier(instrValue.binding.name);
      break;
    }
    case 'RegExpLiteral': {
      value = t.regExpLiteral(instrValue.pattern, instrValue.flags);
      break;
    }
    case 'MetaProperty': {
      value = t.metaProperty(
        t.identifier(instrValue.meta),
        t.identifier(instrValue.property),
      );
      break;
    }
    case 'Await': {
      value = t.awaitExpression(codegenPlaceToExpression(cx, instrValue.value));
      break;
    }
    case 'GetIterator': {
      value = codegenPlaceToExpression(cx, instrValue.collection);
      break;
    }
    case 'IteratorNext': {
      value = codegenPlaceToExpression(cx, instrValue.iterator);
      break;
    }
    case 'NextPropertyOf': {
      value = codegenPlaceToExpression(cx, instrValue.value);
      break;
    }
    case 'PostfixUpdate': {
      value = t.updateExpression(
        instrValue.operation,
        codegenPlaceToExpression(cx, instrValue.lvalue),
        false,
      );
      break;
    }
    case 'PrefixUpdate': {
      value = t.updateExpression(
        instrValue.operation,
        codegenPlaceToExpression(cx, instrValue.lvalue),
        true,
      );
      break;
    }
    case 'StoreLocal': {
      CompilerError.invariant(
        instrValue.lvalue.kind === InstructionKind.Reassign,
        {
          reason: `Unexpected StoreLocal in codegenInstructionValue`,
          description: null,
          loc: instrValue.loc,
          suggestions: null,
        },
      );
      value = t.assignmentExpression(
        '=',
        codegenLValue(cx, instrValue.lvalue.place),
        codegenPlaceToExpression(cx, instrValue.value),
      );
      break;
    }
    case 'StoreGlobal': {
      value = t.assignmentExpression(
        '=',
        t.identifier(instrValue.name),
        codegenPlaceToExpression(cx, instrValue.value),
      );
      break;
    }
    case 'ReactiveFunctionValue':
    case 'StartMemoize':
    case 'FinishMemoize':
    case 'Debugger':
    case 'DeclareLocal':
    case 'DeclareContext':
    case 'Destructure':
    case 'ObjectMethod':
    case 'StoreContext': {
      CompilerError.invariant(false, {
        reason: `Unexpected ${instrValue.kind} in codegenInstructionValue`,
        description: null,
        loc: instrValue.loc,
        suggestions: null,
      });
    }
    default: {
      assertExhaustive(
        instrValue,
        `Unexpected instruction value kind \`${(instrValue as any).kind}\``,
      );
    }
  }
  return value;
}

/**
 * Due to a bug in earlier Babel versions, JSX string attributes with double quotes, unicode characters, or special
 * control characters such as \n may be escaped unnecessarily. To avoid trigger this Babel bug, we use a
 * JsxExpressionContainer for such strings.
 *
 * u0000 to u001F: C0 control codes
 * u007F         : Delete character
 * u0080 to u009F: C1 control codes
 * u00A0 to uFFFF: All non-basic Latin characters
 * https://en.wikipedia.org/wiki/List_of_Unicode_characters#Control_codes
 */
const STRING_REQUIRES_EXPR_CONTAINER_PATTERN =
  /[\u{0000}-\u{001F}\u{007F}\u{0080}-\u{FFFF}]|"/u;
function codegenJsxAttribute(
  cx: Context,
  attribute: JsxAttribute,
): t.JSXAttribute | t.JSXSpreadAttribute {
  switch (attribute.kind) {
    case 'JsxAttribute': {
      let propName: t.JSXIdentifier | t.JSXNamespacedName;
      if (attribute.name.indexOf(':') === -1) {
        propName = createJsxIdentifier(attribute.place.loc, attribute.name);
      } else {
        const [namespace, name] = attribute.name.split(':', 2);
        propName = createJsxNamespacedName(
          attribute.place.loc,
          createJsxIdentifier(attribute.place.loc, namespace),
          createJsxIdentifier(attribute.place.loc, name),
        );
      }
      const innerValue = codegenPlaceToExpression(cx, attribute.place);
      let value;
      switch (innerValue.type) {
        case 'StringLiteral': {
          value = innerValue;
          if (
            STRING_REQUIRES_EXPR_CONTAINER_PATTERN.test(value.value) &&
            !cx.fbtOperands.has(attribute.place.identifier.id)
          ) {
            value = createJsxExpressionContainer(value.loc, value);
          }
          break;
        }
        default: {
          /*
           * NOTE JSXFragment is technically allowed as an attribute value per the spec
           * but many tools do not support this case. We emit fragments wrapped in an
           * expression container for compatibility purposes.
           * spec: https://github.com/facebook/jsx/blob/main/AST.md#jsx-attributes
           */
          value = createJsxExpressionContainer(attribute.place.loc, innerValue);
          break;
        }
      }
      return createJsxAttribute(attribute.place.loc, propName, value);
    }
    case 'JsxSpreadAttribute': {
      return t.jsxSpreadAttribute(
        codegenPlaceToExpression(cx, attribute.argument),
      );
    }
    default: {
      assertExhaustive(
        attribute,
        `Unexpected attribute kind \`${(attribute as any).kind}\``,
      );
    }
  }
}

const JSX_TEXT_CHILD_REQUIRES_EXPR_CONTAINER_PATTERN = /[<>&]/;
function codegenJsxElement(
  cx: Context,
  place: Place,
):
  | t.JSXText
  | t.JSXExpressionContainer
  | t.JSXSpreadChild
  | t.JSXElement
  | t.JSXFragment {
  const value = codegenPlace(cx, place);
  switch (value.type) {
    case 'JSXText': {
      if (JSX_TEXT_CHILD_REQUIRES_EXPR_CONTAINER_PATTERN.test(value.value)) {
        return createJsxExpressionContainer(
          place.loc,
          createStringLiteral(place.loc, value.value),
        );
      }
      return createJsxText(place.loc, value.value);
    }
    case 'JSXElement':
    case 'JSXFragment': {
      return value;
    }
    default: {
      return createJsxExpressionContainer(place.loc, value);
    }
  }
}

function codegenJsxFbtChildElement(
  cx: Context,
  place: Place,
):
  | t.JSXText
  | t.JSXExpressionContainer
  | t.JSXSpreadChild
  | t.JSXElement
  | t.JSXFragment {
  const value = codegenPlace(cx, place);
  switch (value.type) {
    // fbt:param only allows JSX element or expression container as children
    case 'JSXText':
    case 'JSXElement': {
      return value;
    }
    default: {
      return createJsxExpressionContainer(place.loc, value);
    }
  }
}

function convertMemberExpressionToJsx(
  expr: t.MemberExpression,
): t.JSXMemberExpression {
  CompilerError.invariant(expr.property.type === 'Identifier', {
    reason: 'Expected JSX member expression property to be a string',
    description: null,
    loc: expr.loc ?? null,
    suggestions: null,
  });
  const property = t.jsxIdentifier(expr.property.name);
  if (expr.object.type === 'Identifier') {
    return t.jsxMemberExpression(t.jsxIdentifier(expr.object.name), property);
  } else {
    CompilerError.invariant(expr.object.type === 'MemberExpression', {
      reason:
        'Expected JSX member expression to be an identifier or nested member expression',
      description: null,
      loc: expr.object.loc ?? null,
      suggestions: null,
    });
    const object = convertMemberExpressionToJsx(expr.object);
    return t.jsxMemberExpression(object, property);
  }
}

function codegenObjectPropertyKey(
  cx: Context,
  key: ObjectPropertyKey,
): t.Expression {
  switch (key.kind) {
    case 'string': {
      return t.stringLiteral(key.name);
    }
    case 'identifier': {
      return t.identifier(key.name);
    }
    case 'computed': {
      const expr = codegenPlace(cx, key.name);
      CompilerError.invariant(t.isExpression(expr), {
        reason: 'Expected object property key to be an expression',
        description: null,
        loc: key.name.loc,
        suggestions: null,
      });
      return expr;
    }
  }
}

function codegenArrayPattern(
  cx: Context,
  pattern: ArrayPattern,
): t.ArrayPattern {
  const hasHoles = !pattern.items.every(e => e.kind !== 'Hole');
  if (hasHoles) {
    const result = t.arrayPattern([]);
    /*
     * Older versions of babel have a validation bug fixed by
     * https://github.com/babel/babel/pull/10917
     * https://github.com/babel/babel/commit/e7b80a2cb93cf28010207fc3cdd19b4568ca35b9#diff-19b555d2f3904c206af406540d9df200b1e16befedb83ff39ebfcbd876f7fa8aL52
     *
     * Link to buggy older version (observe that elements must be PatternLikes here)
     * https://github.com/babel/babel/blob/v7.7.4/packages/babel-types/src/definitions/es2015.js#L50-L53
     *
     * Link to newer versions with correct validation (observe elements can be PatternLike | null)
     * https://github.com/babel/babel/blob/v7.23.0/packages/babel-types/src/definitions/core.ts#L1306-L1311
     */
    for (const item of pattern.items) {
      if (item.kind === 'Hole') {
        result.elements.push(null);
      } else {
        result.elements.push(codegenLValue(cx, item));
      }
    }
    return result;
  } else {
    return t.arrayPattern(
      pattern.items.map(item => {
        if (item.kind === 'Hole') {
          return null;
        }
        return codegenLValue(cx, item);
      }),
    );
  }
}

function codegenLValue(
  cx: Context,
  pattern: Pattern | Place | SpreadPattern,
): t.ArrayPattern | t.ObjectPattern | t.RestElement | t.Identifier {
  switch (pattern.kind) {
    case 'ArrayPattern': {
      return codegenArrayPattern(cx, pattern);
    }
    case 'ObjectPattern': {
      return t.objectPattern(
        pattern.properties.map(property => {
          if (property.kind === 'ObjectProperty') {
            const key = codegenObjectPropertyKey(cx, property.key);
            const value = codegenLValue(cx, property.place);
            return t.objectProperty(
              key,
              value,
              property.key.kind === 'computed',
              key.type === 'Identifier' &&
                value.type === 'Identifier' &&
                value.name === key.name,
            );
          } else {
            return t.restElement(codegenLValue(cx, property.place));
          }
        }),
      );
    }
    case 'Spread': {
      return t.restElement(codegenLValue(cx, pattern.place));
    }
    case 'Identifier': {
      return convertIdentifier(pattern.identifier);
    }
    default: {
      assertExhaustive(
        pattern,
        `Unexpected pattern kind \`${(pattern as any).kind}\``,
      );
    }
  }
}

function codegenValue(
  cx: Context,
  loc: SourceLocation,
  value: boolean | number | string | null | undefined,
): t.Expression {
  if (typeof value === 'number') {
    return t.numericLiteral(value);
  } else if (typeof value === 'boolean') {
    return t.booleanLiteral(value);
  } else if (typeof value === 'string') {
    return createStringLiteral(loc, value);
  } else if (value === null) {
    return t.nullLiteral();
  } else if (value === undefined) {
    return t.identifier('undefined');
  } else {
    assertExhaustive(value, 'Unexpected primitive value kind');
  }
}

function codegenArgument(
  cx: Context,
  arg: Place | SpreadPattern,
): t.Expression | t.SpreadElement {
  if (arg.kind === 'Identifier') {
    return codegenPlaceToExpression(cx, arg);
  } else {
    return t.spreadElement(codegenPlaceToExpression(cx, arg.place));
  }
}

function codegenPlaceToExpression(cx: Context, place: Place): t.Expression {
  const value = codegenPlace(cx, place);
  return convertValueToExpression(value);
}

function codegenPlace(cx: Context, place: Place): t.Expression | t.JSXText {
  let tmp = cx.temp.get(place.identifier.declarationId);
  if (tmp != null) {
    return tmp;
  }
  CompilerError.invariant(place.identifier.name !== null || tmp !== undefined, {
    reason: `[Codegen] No value found for temporary`,
    description: `Value for '${printPlace(
      place,
    )}' was not set in the codegen context`,
    loc: place.loc,
    suggestions: null,
  });
  const identifier = convertIdentifier(place.identifier);
  identifier.loc = place.loc as any;
  return identifier;
}

function convertIdentifier(identifier: Identifier): t.Identifier {
  CompilerError.invariant(
    identifier.name !== null && identifier.name.kind === 'named',
    {
      reason: `Expected temporaries to be promoted to named identifiers in an earlier pass`,
      loc: GeneratedSource,
      description: `identifier ${identifier.id} is unnamed`,
      suggestions: null,
    },
  );
  return t.identifier(identifier.name.value);
}
