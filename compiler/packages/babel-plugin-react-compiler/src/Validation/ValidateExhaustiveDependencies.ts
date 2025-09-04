/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat from 'pretty-format';
import {CompilerDiagnostic, CompilerError, ErrorSeverity} from '..';
import {ErrorCategory} from '../CompilerError';
import {
  areEqualPaths,
  DependencyPath,
  HIRFunction,
  Identifier,
  IdentifierId,
  InstructionKind,
  LoadGlobal,
  makePropertyLiteral,
  Place,
  StartMemoize,
} from '../HIR';
import {
  printIdentifier,
  printManualMemoDependency,
  printPlace,
} from '../HIR/PrintHIR';
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
  const temporaries: Map<IdentifierId, Temporary> = new Map();
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    temporaries.set(place.identifier.id, {
      kind: 'Local',
      identifier: place.identifier,
      path: [],
      reactive: place.reactive,
    });
  }
  collectTemporaries(fn, temporaries);

  const dependencies = new Set<Temporary>();
  const locals = new Set<IdentifierId>();
  function visit(place: Place): void {
    const dep = temporaries.get(place.identifier.id);
    if (dep != null && !locals.has(place.identifier.id)) {
      if (dep.kind === 'Function') {
        dep.dependencies.forEach(x => dependencies.add(x));
      } else {
        dependencies.add(dep);
      }
    }
  }

  const error = new CompilerError();
  let startMemo: StartMemoize | null = null;
  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;
      switch (value.kind) {
        case 'StartMemoize': {
          CompilerError.invariant(startMemo == null, {
            reason: 'Unexpected nested memo calls',
            loc: value.loc,
          });
          startMemo = value;
          dependencies.clear();
          locals.clear();
          break;
        }
        case 'FinishMemoize': {
          CompilerError.invariant(
            startMemo != null && startMemo.manualMemoId === value.manualMemoId,
            {
              reason: 'Found FinishMemoize without corresponding StartMemoize',
              loc: value.loc,
            },
          );
          visit(value.decl);
          const inferred = [...dependencies];
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
                console.log(printManualMemoDependency(dep, false));
                console.log(printTemporary(match));
              }
            } else {
              if (!dep.root.value.reactive) {
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
                console.log(printManualMemoDependency(dep, false));
                console.log(inferred.map(printTemporary).join('\n'));
                console.log(
                  prettyFormat(
                    new Map(
                      [...temporaries].map(([k, v]) => [k, printTemporary(v)]),
                    ),
                  ),
                );
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
                console.log(printManualMemoDependency(dep, false));
                console.log(printTemporary(match));
              }
            }
          }
          // TODO: validate that all inferred dependencies were in manual deps list too
          dependencies.clear();
          locals.clear();
          startMemo = null;
          break;
        }
        default: {
          if (startMemo == null) {
            continue;
          }
          if (temporaries.has(lvalue.identifier.id)) {
            // This instruction produces a temporary, delay recording until the temporary is consumed
          } else {
            for (const operand of eachInstructionValueOperand(value)) {
              visit(operand);
            }
            for (const lvalue of eachInstructionLValue(instr)) {
              locals.add(lvalue.identifier.id);
            }
          }
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      visit(operand);
    }
  }
  return error.asResult();
}

function collectTemporaries(
  fn: HIRFunction,
  temporaries: Map<IdentifierId, Temporary>,
): Extract<Temporary, {kind: 'Function'}> {
  const locals: Set<IdentifierId> = new Set();
  const dependencies: Set<Temporary> = new Set();
  function visit(operand: Place): void {
    const temp = temporaries.get(operand.identifier.id);
    if (temp != null && !locals.has(operand.identifier.id)) {
      dependencies.add(temp);
    }
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
        case 'LoadLocal': {
          const temp = temporaries.get(value.place.identifier.id);
          if (temp != null) {
            temporaries.set(lvalue.identifier.id, temp);
          }
          break;
        }
        case 'DeclareLocal': {
          const local: Temporary = {
            kind: 'Local',
            identifier: value.lvalue.place.identifier,
            path: [],
            reactive: false, // TODO: need to know if the value is ultimately reactive (?)
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
              reactive: value.value.reactive,
            };
            temporaries.set(value.lvalue.place.identifier.id, local);
          }
          break;
        }
        case 'LoadContext': {
          const temp = temporaries.get(value.place.identifier.id);
          if (temp != null) {
            temporaries.set(lvalue.identifier.id, temp);
          }
          break;
        }
        case 'DeclareContext': {
          const local: Temporary = {
            kind: 'Context',
            identifier: value.lvalue.place.identifier,
          };
          temporaries.set(value.lvalue.place.identifier.id, local);
          break;
        }
        case 'StoreContext': {
          visit(value.value);
          if (value.lvalue.kind !== InstructionKind.Reassign) {
            const local: Temporary = {
              kind: 'Context',
              identifier: value.lvalue.place.identifier,
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
                reactive: value.value.reactive,
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
              path: [
                ...object.path,
                {optional: false, property: value.property},
              ],
              reactive: lvalue.reactive,
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
          );
          temporaries.set(lvalue.identifier.id, functionDeps);
          for (const dep of functionDeps.dependencies) {
            dependencies.add(dep);
          }
          break;
        }
        case 'StartMemoize':
        case 'FinishMemoize': {
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

function printTemporary(temporary: Temporary): string {
  switch (temporary.kind) {
    case 'Context': {
      return `Context ${printIdentifier(temporary.identifier)}`;
    }
    case 'Global': {
      return `Global ${temporary.binding.name} [${temporary.binding.kind}]`;
    }
    case 'Local': {
      return `Local ${printIdentifier(temporary.identifier)}${temporary.path.map(p => '.' + p.property + (p.optional ? '?' : '')).join('')} ${temporary.reactive ? '{reactive}' : ''}`;
    }
    case 'Function': {
      return `Function dependencies=[${Array.from(temporary.dependencies).map(printTemporary).join(', ')}]`;
    }
  }
}

type Temporary =
  | {kind: 'Global'; binding: LoadGlobal['binding']}
  | {
      kind: 'Local';
      identifier: Identifier;
      path: DependencyPath;
      reactive: boolean;
    }
  | {kind: 'Context'; identifier: Identifier}
  | {kind: 'Function'; dependencies: Set<Temporary>};
