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
  CompilerSuggestionOperation,
  SourceLocation,
} from '..';
import {CompilerSuggestion, ErrorCategory} from '../CompilerError';
import {
  areEqualPaths,
  BlockId,
  DependencyPath,
  FinishMemoize,
  HIRFunction,
  Identifier,
  IdentifierId,
  InstructionKind,
  isPrimitiveType,
  isStableType,
  isSubPath,
  isSubPathIgnoringOptionals,
  isUseRefType,
  LoadGlobal,
  ManualMemoDependency,
  Place,
  StartMemoize,
} from '../HIR';
import {
  eachInstructionLValue,
  eachInstructionValueLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {Result} from '../Utils/Result';
import {retainWhere} from '../Utils/utils';

const DEBUG = false;

/**
 * Validates that existing manual memoization is exhaustive and does not
 * have extraneous dependencies. The goal of the validation is to ensure
 * that auto-memoization will not substantially change the behavior of
 * the program:
 * - If the manual dependencies were non-exhaustive (missing important deps)
 *   then auto-memoization will include those dependencies, and cause the
 *   value to update *more* frequently.
 * - If the manual dependencies had extraneous deps, then auto memoization
 *   will remove them and cause the value to update *less* frequently.
 *
 * The implementation compares the manual dependencies against the values
 * actually used within the memoization function
 * - For each value V referenced in the memo function, either:
 *   - If the value is non-reactive *and* a known stable type, then the
 *     value may optionally be specified as an exact dependency.
 *   - Otherwise, report an error unless there is a manual dependency that will
 *     invalidate whenever V invalidates. If `x.y.z` is referenced, there must
 *     be a manual dependency for `x.y.z`, `x.y`, or `x`. Note that we assume
 *     no interior mutability, ie we assume that any changes to inner paths must
 *     always cause the other path to change as well.
 * - Any dependencies that do not correspond to a value referenced in the memo
 *   function are considered extraneous and throw an error
 *
 * ## TODO: Invalid, Complex Deps
 *
 * Handle cases where the user deps were not simple identifiers + property chains.
 * We try to detect this in ValidateUseMemo but we miss some cases. The problem
 * is that invalid forms can be value blocks or function calls that don't get
 * removed by DCE, leaving a structure like:
 *
 * StartMemoize
 * t0 = <value to memoize>
 * ...non-DCE'd code for manual deps...
 * FinishMemoize decl=t0
 *
 * When we go to compute the dependencies, we then think that the user's manual dep
 * logic is part of what the memo computation logic.
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
    dependencies: Set<InferredDependency>,
    locals: Set<IdentifierId>,
  ): void {
    CompilerError.simpleInvariant(startMemo == null, {
      reason: 'Unexpected nested memo calls',
      loc: value.loc,
    });
    startMemo = value;
    dependencies.clear();
    locals.clear();
  }
  function onFinishMemoize(
    value: FinishMemoize,
    dependencies: Set<InferredDependency>,
    locals: Set<IdentifierId>,
  ): void {
    CompilerError.simpleInvariant(
      startMemo != null && startMemo.manualMemoId === value.manualMemoId,
      {
        reason: 'Found FinishMemoize without corresponding StartMemoize',
        loc: value.loc,
      },
    );
    visitCandidateDependency(value.decl, temporaries, dependencies, locals);
    const inferred: Array<InferredDependency> = Array.from(dependencies);
    // Sort dependencies by name and path, with shorter/non-optional paths first
    inferred.sort((a, b) => {
      if (a.kind === 'Global' && b.kind == 'Global') {
        return a.binding.name.localeCompare(b.binding.name);
      } else if (a.kind == 'Local' && b.kind == 'Local') {
        CompilerError.simpleInvariant(
          a.identifier.name != null &&
            a.identifier.name.kind === 'named' &&
            b.identifier.name != null &&
            b.identifier.name.kind === 'named',
          {
            reason: 'Expected dependencies to be named variables',
            loc: a.loc,
          },
        );
        if (a.identifier.id !== b.identifier.id) {
          return a.identifier.name.value.localeCompare(b.identifier.name.value);
        }
        if (a.path.length !== b.path.length) {
          // if a's path is shorter this returns a negative, sorting a first
          return a.path.length - b.path.length;
        }
        for (let i = 0; i < a.path.length; i++) {
          const aProperty = a.path[i];
          const bProperty = b.path[i];
          const aOptional = aProperty.optional ? 0 : 1;
          const bOptional = bProperty.optional ? 0 : 1;
          if (aOptional !== bOptional) {
            // sort non-optionals first
            return aOptional - bOptional;
          } else if (aProperty.property !== bProperty.property) {
            return String(aProperty.property).localeCompare(
              String(bProperty.property),
            );
          }
        }
        return 0;
      } else {
        const aName =
          a.kind === 'Global' ? a.binding.name : a.identifier.name?.value;
        const bName =
          b.kind === 'Global' ? b.binding.name : b.identifier.name?.value;
        if (aName != null && bName != null) {
          return aName.localeCompare(bName);
        }
        return 0;
      }
    });
    // remove redundant inferred dependencies
    retainWhere(inferred, (dep, ix) => {
      const match = inferred.findIndex(prevDep => {
        return (
          isEqualTemporary(prevDep, dep) ||
          (prevDep.kind === 'Local' &&
            dep.kind === 'Local' &&
            prevDep.identifier.id === dep.identifier.id &&
            isSubPath(prevDep.path, dep.path))
        );
      });
      // only retain entries that don't have a prior match
      return match === -1 || match >= ix;
    });
    // Validate that all manual dependencies belong there
    if (DEBUG) {
      console.log('manual');
      console.log(
        (startMemo.deps ?? [])
          .map(x => '  ' + printManualMemoDependency(x))
          .join('\n'),
      );
      console.log('inferred');
      console.log(
        inferred.map(x => '  ' + printInferredDependency(x)).join('\n'),
      );
    }
    const manualDependencies = startMemo.deps ?? [];
    const matched: Set<ManualMemoDependency> = new Set();
    const missing: Array<Extract<InferredDependency, {kind: 'Local'}>> = [];
    const extra: Array<ManualMemoDependency> = [];
    for (const inferredDependency of inferred) {
      if (inferredDependency.kind === 'Global') {
        for (const manualDependency of manualDependencies) {
          if (
            manualDependency.root.kind === 'Global' &&
            manualDependency.root.identifierName ===
              inferredDependency.binding.name
          ) {
            matched.add(manualDependency);
            extra.push(manualDependency);
          }
        }
        continue;
      }
      CompilerError.simpleInvariant(inferredDependency.kind === 'Local', {
        reason: 'Unexpected function dependency',
        loc: value.loc,
      });
      let hasMatchingManualDependency = false;
      for (const manualDependency of manualDependencies) {
        if (
          manualDependency.root.kind === 'NamedLocal' &&
          manualDependency.root.value.identifier.id ===
            inferredDependency.identifier.id &&
          (areEqualPaths(manualDependency.path, inferredDependency.path) ||
            isSubPathIgnoringOptionals(
              manualDependency.path,
              inferredDependency.path,
            ))
        ) {
          hasMatchingManualDependency = true;
          matched.add(manualDependency);
        }
      }
      if (
        hasMatchingManualDependency ||
        isOptionalDependency(inferredDependency, reactive)
      ) {
        continue;
      }
      missing.push(inferredDependency);
    }

    for (const dep of startMemo.deps ?? []) {
      if (matched.has(dep)) {
        continue;
      }
      if (dep.root.kind === 'NamedLocal' && dep.root.constant) {
        CompilerError.simpleInvariant(
          !dep.root.value.reactive &&
            isPrimitiveType(dep.root.value.identifier),
          {
            reason: 'Expected constant-folded dependency to be non-reactive',
            loc: dep.root.value.loc,
          },
        );
        /*
         * Constant primitives can get constant-folded, which means we won't
         * see a LoadLocal for the value within the memo function.
         */
        continue;
      }
      extra.push(dep);
    }

    if (missing.length !== 0 || extra.length !== 0) {
      let suggestion: CompilerSuggestion | null = null;
      if (startMemo.depsLoc != null && typeof startMemo.depsLoc !== 'symbol') {
        suggestion = {
          description: 'Update dependencies',
          range: [startMemo.depsLoc.start.index, startMemo.depsLoc.end.index],
          op: CompilerSuggestionOperation.Replace,
          text: `[${inferred
            .filter(
              dep =>
                dep.kind === 'Local' && !isOptionalDependency(dep, reactive),
            )
            .map(printInferredDependency)
            .join(', ')}]`,
        };
      }
      const diagnostic = CompilerDiagnostic.create({
        category: ErrorCategory.MemoDependencies,
        reason: 'Found missing/extra memoization dependencies',
        description: [
          missing.length !== 0
            ? 'Missing dependencies can cause a value to update less often than it should, ' +
              'resulting in stale UI'
            : null,
          extra.length !== 0
            ? 'Extra dependencies can cause a value to update more often than it should, ' +
              'resulting in performance problems such as excessive renders or effects firing too often'
            : null,
        ]
          .filter(Boolean)
          .join('. '),
        suggestions: suggestion != null ? [suggestion] : null,
      });
      for (const dep of missing) {
        let reactiveStableValueHint = '';
        if (isStableType(dep.identifier)) {
          reactiveStableValueHint =
            '. Refs, setState functions, and other "stable" values generally do not need to be added ' +
            'as dependencies, but this variable may change over time to point to different values';
        }
        diagnostic.withDetails({
          kind: 'error',
          message: `Missing dependency \`${printInferredDependency(dep)}\`${reactiveStableValueHint}`,
          loc: dep.loc,
        });
      }
      for (const dep of extra) {
        if (dep.root.kind === 'Global') {
          diagnostic.withDetails({
            kind: 'error',
            message:
              `Unnecessary dependency \`${printManualMemoDependency(dep)}\`. ` +
              'Values declared outside of a component/hook should not be listed as ' +
              'dependencies as the component will not re-render if they change',
            loc: dep.loc ?? startMemo.depsLoc ?? value.loc,
          });
          error.pushDiagnostic(diagnostic);
        } else {
          const root = dep.root.value;
          const matchingInferred = inferred.find(
            (
              inferredDep,
            ): inferredDep is Extract<InferredDependency, {kind: 'Local'}> => {
              return (
                inferredDep.kind === 'Local' &&
                inferredDep.identifier.id === root.identifier.id &&
                isSubPathIgnoringOptionals(inferredDep.path, dep.path)
              );
            },
          );
          if (
            matchingInferred != null &&
            !isOptionalDependency(matchingInferred, reactive)
          ) {
            diagnostic.withDetails({
              kind: 'error',
              message:
                `Overly precise dependency \`${printManualMemoDependency(dep)}\`, ` +
                `use \`${printInferredDependency(matchingInferred)}\` instead`,
              loc: dep.loc ?? startMemo.depsLoc ?? value.loc,
            });
          } else {
            /**
             * Else this dependency doesn't correspond to anything referenced in the memo function,
             * or is an optional dependency so we don't want to suggest adding it
             */
            diagnostic.withDetails({
              kind: 'error',
              message: `Unnecessary dependency \`${printManualMemoDependency(dep)}\``,
              loc: dep.loc ?? startMemo.depsLoc ?? value.loc,
            });
          }
        }
      }
      if (suggestion != null) {
        diagnostic.withDetails({
          kind: 'hint',
          message: `Inferred dependencies: \`${suggestion.text}\``,
        });
      }
      error.pushDiagnostic(diagnostic);
    }

    dependencies.clear();
    locals.clear();
    startMemo = null;
  }

  collectDependencies(
    fn,
    temporaries,
    {
      onStartMemoize,
      onFinishMemoize,
    },
    false, // isFunctionExpression
  );
  return error.asResult();
}

function addDependency(
  dep: Temporary,
  dependencies: Set<InferredDependency>,
  locals: Set<IdentifierId>,
): void {
  if (dep.kind === 'Function') {
    for (const x of dep.dependencies) {
      addDependency(x, dependencies, locals);
    }
  } else if (dep.kind === 'Global') {
    dependencies.add(dep);
  } else if (!locals.has(dep.identifier.id)) {
    dependencies.add(dep);
  }
}

function visitCandidateDependency(
  place: Place,
  temporaries: Map<IdentifierId, Temporary>,
  dependencies: Set<InferredDependency>,
  locals: Set<IdentifierId>,
): void {
  const dep = temporaries.get(place.identifier.id);
  if (dep != null) {
    addDependency(dep, dependencies, locals);
  }
}

/**
 * This function determines the dependencies of the given function relative to
 * its external context. Dependencies are collected eagerly, the first time an
 * external variable is referenced, as opposed to trying to delay or aggregate
 * calculation of dependencies until they are later "used".
 *
 * For example, in
 *
 * ```
 * function f() {
 *   let x = y; // we record a dependency on `y` here
 *   ...
 *   use(x); // as opposed to trying to delay that dependency until here
 * }
 * ```
 *
 * That said, LoadLocal/LoadContext does not immediately take a dependency,
 * we store the dependency in a temporary and set it as used when that temporary
 * is referenced as an operand.
 *
 * As we proceed through the function we track local variables that it creates
 * and don't consider later references to these variables as dependencies.
 *
 * For function expressions we first collect the function's dependencies by
 * calling this function recursively, _without_ taking into account whether
 * the "external" variables it accesses are actually external or just locals
 * in the parent. We then prune any locals and immediately consider any
 * remaining externals that it accesses as a dependency:
 *
 * ```
 * function Component() {
 *   const local = ...;
 *   const f = () => { return [external, local] };
 * }
 * ```
 *
 * Here we calculate `f` as having dependencies `external, `local` and save
 * this into `temporaries`. We then also immediately take these as dependencies
 * at the Component scope, at which point we filter out `local` as a local variable,
 * leaving just a dependency on `external`.
 *
 * When calling this function on a top-level component or hook, the collected dependencies
 * will only contain the globals that it accesses which isn't useful. Instead, passing
 * onStartMemoize/onFinishMemoize callbacks allows looking at the dependencies within
 * blocks of manual memoization.
 */
function collectDependencies(
  fn: HIRFunction,
  temporaries: Map<IdentifierId, Temporary>,
  callbacks: {
    onStartMemoize: (
      startMemo: StartMemoize,
      dependencies: Set<InferredDependency>,
      locals: Set<IdentifierId>,
    ) => void;
    onFinishMemoize: (
      finishMemo: FinishMemoize,
      dependencies: Set<InferredDependency>,
      locals: Set<IdentifierId>,
    ) => void;
  } | null,
  isFunctionExpression: boolean,
): Extract<Temporary, {kind: 'Function'}> {
  const optionals = findOptionalPlaces(fn);
  if (DEBUG) {
    console.log(prettyFormat(optionals));
  }
  const locals: Set<IdentifierId> = new Set();
  if (isFunctionExpression) {
    for (const param of fn.params) {
      const place = param.kind === 'Identifier' ? param : param.place;
      locals.add(place.identifier.id);
    }
  }

  const dependencies: Set<InferredDependency> = new Set();
  function visit(place: Place): void {
    visitCandidateDependency(place, temporaries, dependencies, locals);
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
          if (
            typeof value.property === 'number' ||
            (isUseRefType(value.object.identifier) &&
              value.property === 'current')
          ) {
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
          const functionDeps = collectDependencies(
            value.loweredFunc.func,
            temporaries,
            null,
            true, // isFunctionExpression
          );
          temporaries.set(lvalue.identifier.id, functionDeps);
          addDependency(functionDeps, dependencies, locals);
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

function printInferredDependency(dep: InferredDependency): string {
  switch (dep.kind) {
    case 'Global': {
      return dep.binding.name;
    }
    case 'Local': {
      CompilerError.simpleInvariant(
        dep.identifier.name != null && dep.identifier.name.kind === 'named',
        {
          reason: 'Expected dependencies to be named variables',
          loc: dep.loc,
        },
      );
      return `${dep.identifier.name.value}${dep.path.map(p => (p.optional ? '?' : '') + '.' + p.property).join('')}`;
    }
  }
}

function printManualMemoDependency(dep: ManualMemoDependency): string {
  let identifierName: string;
  if (dep.root.kind === 'Global') {
    identifierName = dep.root.identifierName;
  } else {
    const name = dep.root.value.identifier.name;
    CompilerError.simpleInvariant(name != null && name.kind === 'named', {
      reason: 'Expected manual dependencies to be named variables',
      loc: dep.root.value.loc,
    });
    identifierName = name.value;
  }
  return `${identifierName}${dep.path.map(p => (p.optional ? '?' : '') + '.' + p.property).join('')}`;
}

function isEqualTemporary(a: Temporary, b: Temporary): boolean {
  switch (a.kind) {
    case 'Function': {
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
type InferredDependency = Extract<Temporary, {kind: 'Local' | 'Global'}>;

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
            CompilerError.simpleInvariant(isOptional !== undefined, {
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
            CompilerError.simpleInvariant(false, {
              reason: `Unexpected terminal in optional`,
              loc: terminal.loc,
            });
          }
        }
      }
      CompilerError.simpleInvariant(queue.length === 0, {
        reason:
          'Expected a matching number of conditional blocks and branch points',
        loc: block.terminal.loc,
      });
    }
  }
  return optionals;
}

function isOptionalDependency(
  inferredDependency: Extract<InferredDependency, {kind: 'Local'}>,
  reactive: Set<IdentifierId>,
): boolean {
  return (
    !reactive.has(inferredDependency.identifier.id) &&
    (isStableType(inferredDependency.identifier) ||
      isPrimitiveType(inferredDependency.identifier))
  );
}
