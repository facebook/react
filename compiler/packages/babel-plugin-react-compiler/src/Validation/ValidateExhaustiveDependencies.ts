/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat from 'pretty-format';
import {
  CompilerDiagnostic,
  CompilerError,
  ErrorSeverity,
  SourceLocation,
} from '..';
import {ErrorCategory} from '../CompilerError';
import {
  areEqualPaths,
  BlockId,
  DependencyPath,
  FinishMemoize,
  HIRFunction,
  Identifier,
  IdentifierId,
  InstructionKind,
  isSubPath,
  LoadGlobal,
  Place,
  StartMemoize,
} from '../HIR';
import {printIdentifier, printManualMemoDependency} from '../HIR/PrintHIR';
import {
  eachInstructionLValue,
  eachInstructionValueLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {Result} from '../Utils/Result';

const DEBUG = true;

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
    visitCandidateDependency(value.decl, temporaries, dependencies);
    const inferred: Array<Temporary> = [];
    for (const dep of dependencies) {
      if (inferred.find(x => isEqualTemporary(x, dep)) != null) {
        continue;
      }
      inferred.push(dep);
    }
    const matched: Set<Temporary> = new Set();
    // Validate that all manual dependencies belong there
    if (DEBUG) {
      console.log('manual');
      console.log(
        (startMemo.deps ?? [])
          .map(x => '  ' + printManualMemoDependency(x, false))
          .join('\n'),
      );
      console.log('inferred');
      console.log(inferred.map(x => '  ' + _printTemporary(x)).join('\n'));
    }
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
              message:
                'Unnecessary dependency' +
                ` ${printManualMemoDependency(dep, false)}`,
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
          const subpathMatch =
            dep.path.length !== 0
              ? inferred.find(d => {
                  d.kind === 'Local' &&
                    d.identifier.id === root.identifier.id &&
                    isSubPath(d.path, dep.path);
                })
              : null;
          if (subpathMatch != null) {
            error.pushDiagnostic(
              CompilerDiagnostic.create({
                category: ErrorCategory.PreserveManualMemo,
                severity: ErrorSeverity.InvalidReact,
                reason: 'Found imprecise memoization dependency',
                description:
                  'This dependency references a specific property of an object, but the logic depends on other properties. ',
              }).withDetail({
                kind: 'error',
                message:
                  'Imprecise dependency' +
                  ` ${printManualMemoDependency(dep, false)}`,
                loc: dep.root.value.loc,
              }),
            );
          } else {
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
                message:
                  'Unnecessary dependency' +
                  ` ${printManualMemoDependency(dep, false)}`,
                loc: dep.root.value.loc,
              }),
            );
          }
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

      matched.add(dep);
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
          message: 'Missing dependency' + ` ${_printTemporary(dep)}`,
          loc: dep.loc,
        }),
      );
    }
    // TODO: validate that all inferred dependencies were in manual deps list too
    dependencies.clear();
    locals.clear();
    startMemo = null;
  }

  collectTemporaries(fn, temporaries, {
    onStartMemoize,
    onFinishMemoize,
  });
  return error.asResult();
}

function visitCandidateDependency(
  place: Place,
  temporaries: Map<IdentifierId, Temporary>,
  dependencies: Set<Temporary>,
): void {
  const dep = temporaries.get(place.identifier.id);
  if (dep != null) {
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
  const optionals = findOptionalPlaces(fn);
  if (DEBUG) {
    console.log(prettyFormat(optionals));
  }
  const locals: Set<IdentifierId> = new Set();
  const dependencies: Set<Temporary> = new Set();
  function visit(place: Place): void {
    visitCandidateDependency(place, temporaries, dependencies);
  }
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      let deps: Array<Temporary> | null = null;
      for (const operand of phi.operands.values()) {
        const dep = temporaries.get(operand.identifier.id);
        if (dep == null) {
          continue;
        }
        if (deps == null) {
          deps = [dep];
        } else {
          deps.push(dep);
        }
      }
      if (deps == null) {
        continue;
      } else if (deps.length === 1) {
        temporaries.set(phi.place.identifier.id, deps[0]!);
      } else {
        temporaries.set(phi.place.identifier.id, {
          kind: 'Function',
          dependencies: new Set(deps),
        });
      }
    }

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
          if (locals.has(value.place.identifier.id)) {
            break;
          }
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
          locals.add(value.lvalue.place.identifier.id);
          break;
        }
        case 'StoreLocal': {
          if (value.lvalue.place.identifier.name == null) {
            const temp = temporaries.get(value.value.identifier.id);
            if (temp != null) {
              temporaries.set(value.lvalue.place.identifier.id, temp);
            }
            break;
          }
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
            locals.add(value.lvalue.place.identifier.id);
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
            locals.add(value.lvalue.place.identifier.id);
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
              locals.add(lvalue.identifier.id);
            }
          }
          break;
        }
        case 'PropertyLoad': {
          if (typeof value.property === 'number') {
            visit(value.object);
            break;
          }
          const object = temporaries.get(value.object.identifier.id);
          if (object != null && object.kind === 'Local') {
            const optional = optionals.get(value.object.identifier.id) ?? false;
            const local: Temporary = {
              kind: 'Local',
              identifier: object.identifier,
              context: object.context,
              path: [
                ...object.path,
                {
                  optional,
                  property: value.property,
                },
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
        case 'MethodCall': {
          // Ignore the method itself
          for (const operand of eachInstructionValueOperand(value)) {
            if (operand.identifier.id === value.property.identifier.id) {
              continue;
            }
            visit(operand);
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
      if (optionals.has(operand.identifier.id)) {
        continue;
      }
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
      return `Local${temporary.context ? ' (Context)' : ''} ${printIdentifier(temporary.identifier)}${temporary.path.map(p => (p.optional ? '?' : '') + '.' + p.property).join('')}`;
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

export function findOptionalPlaces(
  fn: HIRFunction,
): Map<IdentifierId, boolean> {
  const optionals = new Map<IdentifierId, boolean>();
  const visited: Set<BlockId> = new Set();
  for (const [, block] of fn.body.blocks) {
    if (visited.has(block.id)) {
      continue;
    }
    if (block.terminal.kind === 'optional') {
      visited.add(block.id);
      const optionalTerminal = block.terminal;
      let testBlock = fn.body.blocks.get(block.terminal.test)!;
      const queue: Array<boolean | null> = [block.terminal.optional];
      loop: while (true) {
        visited.add(testBlock.id);
        const terminal = testBlock.terminal;
        switch (terminal.kind) {
          case 'branch': {
            const isOptional = queue.pop();
            CompilerError.invariant(isOptional !== undefined, {
              reason:
                'Expected an optional value for each optional test condition',
              loc: terminal.test.loc,
            });
            if (isOptional != null) {
              optionals.set(terminal.test.identifier.id, isOptional);
            }
            if (terminal.fallthrough === optionalTerminal.fallthrough) {
              // found it
              const consequent = fn.body.blocks.get(terminal.consequent)!;
              const last = consequent.instructions.at(-1);
              if (last !== undefined && last.value.kind === 'StoreLocal') {
                if (isOptional != null) {
                  optionals.set(last.value.value.identifier.id, isOptional);
                }
              }
              break loop;
            } else {
              testBlock = fn.body.blocks.get(terminal.fallthrough)!;
            }
            break;
          }
          case 'optional': {
            queue.push(terminal.optional);
            testBlock = fn.body.blocks.get(terminal.test)!;
            break;
          }
          case 'logical':
          case 'ternary': {
            queue.push(null);
            testBlock = fn.body.blocks.get(terminal.test)!;
            break;
          }

          case 'sequence': {
            // Do we need sequence?? In any case, don't push to queue bc there is no corresponding branch terminal
            testBlock = fn.body.blocks.get(terminal.block)!;
            break;
          }
          default: {
            CompilerError.invariant(false, {
              reason: `Unexpected terminal in optional`,
              loc: terminal.loc,
            });
          }
        }
      }
      CompilerError.invariant(queue.length === 0, {
        reason:
          'Expected a matching number of conditional blocks and branch points',
        loc: block.terminal.loc,
      });
    }
  }
  return optionals;
}
