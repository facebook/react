/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerDiagnostic,
  CompilerError,
  ErrorSeverity,
  SourceLocation,
} from '..';
import {ErrorCategory} from '../CompilerError';
import {
  areEqualPaths,
  DependencyPath,
  FinishMemoize,
  HIRFunction,
  Identifier,
  IdentifierId,
  InstructionKind,
  LoadGlobal,
  Place,
  StartMemoize,
} from '../HIR';
import {printIdentifier} from '../HIR/PrintHIR';
import {
  eachInstructionLValue,
  eachInstructionValueLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {Result} from '../Utils/Result';

/**
 * Validates that existing manual memoization had exhaustive dependencies.
 * Memoization with missing or extra reactive dependencies is invalid React
 * and compilation can change behavior, causing a value to be computed more
 * or less times.
 */
export function validateExhaustiveDependencies(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const reactive = collectReactiveIdentifiersHIR(fn);

  const temporaries: Map<IdentifierId, Temporary> = new Map();
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    temporaries.set(place.identifier.id, {
      kind: 'Local',
      identifier: place.identifier,
      path: [],
      context: false,
      loc: place.loc,
    });
  }
  const error = new CompilerError();
  let startMemo: StartMemoize | null = null;

  function onStartMemoize(
    value: StartMemoize,
    dependencies: Set<Temporary>,
    locals: Set<IdentifierId>,
  ): void {
    CompilerError.invariant(startMemo == null, {
      reason: 'Unexpected nested memo calls',
      loc: value.loc,
    });
    startMemo = value;
    dependencies.clear();
    locals.clear();
  }
  function onFinishMemoize(
    value: FinishMemoize,
    dependencies: Set<Temporary>,
    locals: Set<IdentifierId>,
  ): void {
    CompilerError.invariant(
      startMemo != null && startMemo.manualMemoId === value.manualMemoId,
      {
        reason: 'Found FinishMemoize without corresponding StartMemoize',
        loc: value.loc,
      },
    );
    visitCandidateDependency(value.decl, temporaries, dependencies, locals);
    const inferred = [...dependencies];
    const matched: Set<Temporary> = new Set();
    // Validate that all manual dependencies belong there
    for (const dep of startMemo.deps ?? []) {
      if (dep.root.kind === 'Global') {
        const root = dep.root.identifierName;
        const match = inferred.find(
          d => d.kind === 'Global' && d.binding.name === root,
        );
        if (match == null) {
          error.pushDiagnostic(
            CompilerDiagnostic.create({
              category: ErrorCategory.PreserveManualMemo,
              severity: ErrorSeverity.InvalidReact,
              reason: 'Found unnecessary memoization dependency',
              description:
                'Adding unnecessary memoization dependencies can cause a value to recompute ' +
                'more often than necessary and change behavior. This memoization cannot be safely rewritten by the compiler.',
            }).withDetail({
              kind: 'error',
              message: 'Unnecessary dependency',
              loc: startMemo.loc,
            }),
          );
        } else {
          matched.add(match);
        }
      } else {
        if (!reactive.has(dep.root.value.identifier.id)) {
          continue;
        }
        const root = dep.root.value;
        const match = inferred.find(
          d =>
            d.kind === 'Local' &&
            d.identifier.id === root.identifier.id &&
            areEqualPaths(d.path, dep.path),
        );
        if (match == null) {
          error.pushDiagnostic(
            CompilerDiagnostic.create({
              category: ErrorCategory.PreserveManualMemo,
              severity: ErrorSeverity.InvalidReact,
              reason: 'Found unnecessary memoization dependency',
              description:
                'Adding unnecessary memoization dependencies can cause a value to recompute ' +
                'more often than necessary and change behavior. This memoization cannot be safely rewritten by the compiler.',
            }).withDetail({
              kind: 'error',
              message: 'Unnecessary dependency',
              loc: dep.root.value.loc,
            }),
          );
        } else {
          matched.add(match);
        }
      }
    }
    for (const dep of inferred) {
      if (
        matched.has(dep) ||
        dep.kind !== 'Local' ||
        !reactive.has(dep.identifier.id) ||
        Array.from(matched).some(x => isEqualTemporary(x, dep))
      ) {
        continue;
      }

      error.pushDiagnostic(
        CompilerDiagnostic.create({
          category: ErrorCategory.PreserveManualMemo,
          severity: ErrorSeverity.InvalidReact,
          reason: 'Found missing memoization dependency',
          description:
            'Missing dependencies can cause a value not to update when those inputs change, ' +
            'resulting in stale UI. This memoization cannot be safely rewritten by the compiler.',
        }).withDetail({
          kind: 'error',
          message: 'Missing dependency',
          loc: dep.loc,
        }),
      );
    }
    // TODO: validate that all inferred dependencies were in manual deps list too
    dependencies.clear();
    locals.clear();
    startMemo = null;
  }

  collectTemporaries(fn, temporaries, {onStartMemoize, onFinishMemoize});
  return error.asResult();
}

function visitCandidateDependency(
  place: Place,
  temporaries: Map<IdentifierId, Temporary>,
  dependencies: Set<Temporary>,
  locals: Set<IdentifierId>,
): void {
  const dep = temporaries.get(place.identifier.id);
  if (dep != null && !locals.has(place.identifier.id)) {
    if (dep.kind === 'Function') {
      dep.dependencies.forEach(x => dependencies.add(x));
    } else {
      dependencies.add(dep);
    }
  }
}

function collectTemporaries(
  fn: HIRFunction,
  temporaries: Map<IdentifierId, Temporary>,
  callbacks: {
    onStartMemoize: (
      startMemo: StartMemoize,
      dependencies: Set<Temporary>,
      locals: Set<IdentifierId>,
    ) => void;
    onFinishMemoize: (
      finishMemo: FinishMemoize,
      dependencies: Set<Temporary>,
      locals: Set<IdentifierId>,
    ) => void;
  } | null,
): Extract<Temporary, {kind: 'Function'}> {
  const locals: Set<IdentifierId> = new Set();
  const dependencies: Set<Temporary> = new Set();
  function visit(place: Place): void {
    visitCandidateDependency(place, temporaries, dependencies, locals);
  }
  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;
      switch (value.kind) {
        case 'LoadGlobal': {
          temporaries.set(lvalue.identifier.id, {
            kind: 'Global',
            binding: value.binding,
          });
          break;
        }
        case 'LoadContext':
        case 'LoadLocal': {
          const temp = temporaries.get(value.place.identifier.id);
          if (temp != null) {
            if (temp.kind === 'Local') {
              const local: Temporary = {...temp, loc: value.place.loc};
              temporaries.set(lvalue.identifier.id, local);
            } else {
              temporaries.set(lvalue.identifier.id, temp);
            }
          }
          break;
        }
        case 'DeclareLocal': {
          const local: Temporary = {
            kind: 'Local',
            identifier: value.lvalue.place.identifier,
            path: [],
            context: false,
            loc: value.lvalue.place.loc,
          };
          temporaries.set(value.lvalue.place.identifier.id, local);
          break;
        }
        case 'StoreLocal': {
          visit(value.value);
          if (value.lvalue.kind !== InstructionKind.Reassign) {
            const local: Temporary = {
              kind: 'Local',
              identifier: value.lvalue.place.identifier,
              path: [],
              context: false,
              loc: value.lvalue.place.loc,
            };
            temporaries.set(value.lvalue.place.identifier.id, local);
          }
          break;
        }
        case 'DeclareContext': {
          const local: Temporary = {
            kind: 'Local',
            identifier: value.lvalue.place.identifier,
            path: [],
            context: true,
            loc: value.lvalue.place.loc,
          };
          temporaries.set(value.lvalue.place.identifier.id, local);
          break;
        }
        case 'StoreContext': {
          visit(value.value);
          if (value.lvalue.kind !== InstructionKind.Reassign) {
            const local: Temporary = {
              kind: 'Local',
              identifier: value.lvalue.place.identifier,
              path: [],
              context: true,
              loc: value.lvalue.place.loc,
            };
            temporaries.set(value.lvalue.place.identifier.id, local);
          }
          break;
        }
        case 'Destructure': {
          visit(value.value);
          if (value.lvalue.kind !== InstructionKind.Reassign) {
            for (const lvalue of eachInstructionValueLValue(value)) {
              const local: Temporary = {
                kind: 'Local',
                identifier: lvalue.identifier,
                path: [],
                context: false,
                loc: lvalue.loc,
              };
              temporaries.set(lvalue.identifier.id, local);
            }
          }
          break;
        }
        case 'PropertyLoad': {
          const object = temporaries.get(value.object.identifier.id);
          if (object != null && object.kind === 'Local') {
            const local: Temporary = {
              kind: 'Local',
              identifier: object.identifier,
              context: object.context,
              path: [
                ...object.path,
                {optional: false, property: value.property},
              ],
              loc: value.loc,
            };
            temporaries.set(lvalue.identifier.id, local);
          }
          break;
        }
        case 'FunctionExpression':
        case 'ObjectMethod': {
          const functionDeps = collectTemporaries(
            value.loweredFunc.func,
            temporaries,
            null,
          );
          temporaries.set(lvalue.identifier.id, functionDeps);
          for (const dep of functionDeps.dependencies) {
            dependencies.add(dep);
          }
          break;
        }
        case 'StartMemoize': {
          const onStartMemoize = callbacks?.onStartMemoize;
          if (onStartMemoize != null) {
            onStartMemoize(value, dependencies, locals);
          }
          break;
        }
        case 'FinishMemoize': {
          const onFinishMemoize = callbacks?.onFinishMemoize;
          if (onFinishMemoize != null) {
            onFinishMemoize(value, dependencies, locals);
          }
          break;
        }
        default: {
          for (const operand of eachInstructionValueOperand(value)) {
            visit(operand);
          }
          for (const lvalue of eachInstructionLValue(instr)) {
            locals.add(lvalue.identifier.id);
          }
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      visit(operand);
    }
  }
  return {kind: 'Function', dependencies};
}

function _printTemporary(temporary: Temporary): string {
  switch (temporary.kind) {
    case 'Global': {
      return `Global ${temporary.binding.name} [${temporary.binding.kind}]`;
    }
    case 'Local': {
      return `Local${temporary.context ? ' (Context)' : ''}) ${printIdentifier(temporary.identifier)}${temporary.path.map(p => '.' + p.property + (p.optional ? '?' : '')).join('')}`;
    }
    case 'Function': {
      return `Function dependencies=[${Array.from(temporary.dependencies).map(_printTemporary).join(', ')}]`;
    }
  }
}

function isEqualTemporary(a: Temporary, b: Temporary): boolean {
  switch (a.kind) {
    case 'Function': {
      // TODO: ideally remove Function kind
      return false;
    }
    case 'Global': {
      return b.kind === 'Global' && a.binding.name === b.binding.name;
    }
    case 'Local': {
      return (
        b.kind === 'Local' &&
        a.identifier.id === b.identifier.id &&
        areEqualPaths(a.path, b.path)
      );
    }
  }
}

type Temporary =
  | {kind: 'Global'; binding: LoadGlobal['binding']}
  | {
      kind: 'Local';
      identifier: Identifier;
      path: DependencyPath;
      context: boolean;
      loc: SourceLocation;
    }
  | {kind: 'Function'; dependencies: Set<Temporary>};

function collectReactiveIdentifiersHIR(fn: HIRFunction): Set<IdentifierId> {
  const reactive = new Set<IdentifierId>();
  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      for (const lvalue of eachInstructionLValue(instr)) {
        if (lvalue.reactive) {
          reactive.add(lvalue.identifier.id);
        }
      }
      for (const operand of eachInstructionValueOperand(instr.value)) {
        if (operand.reactive) {
          reactive.add(operand.identifier.id);
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      if (operand.reactive) {
        reactive.add(operand.identifier.id);
      }
    }
  }
  return reactive;
}
