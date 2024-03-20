/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError, Effect, ErrorSeverity } from "..";
import {
  GeneratedSource,
  Identifier,
  IdentifierId,
  Instruction,
  InstructionValue,
  ManualMemoDependency,
  Place,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScopeBlock,
  ReactiveScopeDependency,
  ReactiveValue,
  ScopeId,
} from "../HIR";
import { printManualMemoDependency } from "../HIR/PrintHIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { collectMaybeMemoDependencies } from "../Inference/DropManualMemoization";
import { isMutable } from "../ReactiveScopes/InferReactiveScopeVariables";
import {
  ReactiveFunctionVisitor,
  visitReactiveFunction,
} from "../ReactiveScopes/visitors";

/**
 * Validates that all explicit manual memoization (useMemo/useCallback) was accurately
 * preserved, and that no originally memoized values became unmemoized in the output.
 *
 * This can occur if a value's mutable range somehow extended to include a hook and
 * was pruned.
 */
export function validatePreservedManualMemoization(fn: ReactiveFunction): void {
  const state = {
    errors: new CompilerError(),
    manualMemoState: null,
  };
  visitReactiveFunction(fn, new Visitor(), state);
  if (state.errors.hasErrors()) {
    throw state.errors;
  }
}

type ManualMemoBlockState = {
  /**
   * Values produced within manual memoization blocks.
   * We track these to ensure our inferred dependencies are
   * produced before the manual memo block starts
   *
   * As an example:
   * ```js
   * // source
   * const result = useMemo(() => {
   *   return [makeObject(input1), input2],
   * }, [input1, input2]);
   * ```
   * Here, we record inferred dependencies as [input1, input2]
   * but not t0
   * ```js
   * // StartMemoize
   * let t0;
   * if ($[0] != input1) {
   *   t0 = makeObject(input1);
   *   // ...
   * } else { ... }
   *
   * let result;
   * if ($[1] != t0 || $[2] != input2) {
   *   result = [t0, input2];
   * } else { ... }
   * ```
   */
  decls: Set<IdentifierId>;

  /*
   * normalized depslist from useMemo/useCallback
   * callsite in source
   */
  depsFromSource: Array<ManualMemoDependency> | null;
  manualMemoId: number;
};

type VisitorState = {
  errors: CompilerError;
  manualMemoState: ManualMemoBlockState | null;
};

function prettyPrintScopeDependency(val: ReactiveScopeDependency): string {
  let rootStr;
  if (val.identifier.name?.kind === "named") {
    rootStr = val.identifier.name.value;
  } else {
    rootStr = "[unnamed]";
  }
  return `${rootStr}${val.path.length > 0 ? "." : ""}${val.path.join(".")}`;
}

function compareDeps(
  inferred: ManualMemoDependency,
  source: ManualMemoDependency
): boolean {
  const rootsEqual =
    (inferred.root.kind === "Global" &&
      source.root.kind === "Global" &&
      inferred.root.identifierName === source.root.identifierName) ||
    (inferred.root.kind === "NamedLocal" &&
      source.root.kind === "NamedLocal" &&
      inferred.root.value.identifier.id === source.root.value.identifier.id);
  if (!rootsEqual) {
    return false;
  }

  let isSubpath = true;
  for (let i = 0; i < Math.min(inferred.path.length, source.path.length); i++) {
    if (inferred.path[i] !== source.path[i]) {
      isSubpath = false;
      break;
    }
  }

  if (
    isSubpath &&
    (source.path.length === inferred.path.length ||
      (inferred.path.length >= source.path.length &&
        !inferred.path.includes("current")))
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * Validate that an inferred dependency either matches a source dependency
 * or is produced by earlier instructions in the same manual memoization
 * call.
 * Inferred dependency `rootA.[pathA]` matches a source dependency `rootB.[pathB]`
 * when:
 *   - rootA and rootB are loads from the same named identifier. Note that this
 *     identifier must be also named in source, as DropManualMemoization, which
 *     runs before any renaming passes, only records loads from named variables.
 *   - and one of the following holds:
 *       - pathA and pathB are identifical
 *       - pathB is a subpath of pathA and neither read into a `ref` type*
 *
 * We do not allow for partial matches on ref types because they are not immutable
 * values, e.g.
 * ref_prev === ref_new does not imply ref_prev.current === ref_new.current
 */
function validateInferredDep(
  dep: ReactiveScopeDependency,
  temporaries: Map<IdentifierId, ManualMemoDependency>,
  declsWithinMemoBlock: Set<IdentifierId>,
  validDepsInMemoBlock: Array<ManualMemoDependency>,
  errorState: CompilerError
): void {
  let normalizedDep: ManualMemoDependency;
  const maybeNormalizedRoot = temporaries.get(dep.identifier.id);
  if (maybeNormalizedRoot != null) {
    normalizedDep = {
      root: maybeNormalizedRoot.root,
      path: [...maybeNormalizedRoot.path, ...dep.path],
    };
  } else {
    CompilerError.invariant(dep.identifier.name?.kind === "named", {
      reason:
        "ValidatePreservedManualMemoization: expected scope dependency to be named",
      loc: GeneratedSource,
      suggestions: null,
    });
    normalizedDep = {
      root: {
        kind: "NamedLocal",
        value: {
          kind: "Identifier",
          identifier: dep.identifier,
          loc: GeneratedSource,
          effect: Effect.Read,
          reactive: false,
        },
      },
      path: [...dep.path],
    };
  }
  for (const decl of declsWithinMemoBlock) {
    if (
      normalizedDep.root.kind === "NamedLocal" &&
      decl === normalizedDep.root.value.identifier.id
    ) {
      return;
    }
  }
  for (const originalDep of validDepsInMemoBlock) {
    if (compareDeps(normalizedDep, originalDep)) {
      return;
    }
  }
  errorState.push({
    severity: ErrorSeverity.Todo,
    reason:
      "Could not preserve manual memoization because an inferred dependency does not match the dependency list in source",
    description: `The inferred dependency was \`${prettyPrintScopeDependency(
      dep
    )}\`, but the source dependencies were [${validDepsInMemoBlock
      .map((dep) => printManualMemoDependency(dep, true))
      .join(", ")}]`,
    loc: GeneratedSource,
    suggestions: null,
  });
}

class Visitor extends ReactiveFunctionVisitor<VisitorState> {
  scopes: Set<ScopeId> = new Set();
  scopeMapping = new Map();
  temporaries: Map<IdentifierId, ManualMemoDependency> = new Map();

  collectMaybeMemoDependencies(
    value: ReactiveValue,
    state: VisitorState
  ): ManualMemoDependency | null {
    switch (value.kind) {
      case "SequenceExpression": {
        for (const instr of value.instructions) {
          this.visitInstruction(instr, state);
        }
        const result = this.collectMaybeMemoDependencies(value.value, state);

        return result;
      }
      case "OptionalExpression": {
        return this.collectMaybeMemoDependencies(value.value, state);
      }
      case "ReactiveFunctionValue":
      case "ConditionalExpression":
      case "LogicalExpression": {
        return null;
      }
      default: {
        const dep = collectMaybeMemoDependencies(value, this.temporaries);
        if (value.kind === "StoreLocal" || value.kind === "StoreContext") {
          const storeTarget = value.lvalue.place;
          state.manualMemoState?.decls.add(storeTarget.identifier.id);
          if (storeTarget.identifier.name?.kind === "named" && dep == null) {
            const dep: ManualMemoDependency = {
              root: {
                kind: "NamedLocal",
                value: storeTarget,
              },
              path: [],
            };
            this.temporaries.set(storeTarget.identifier.id, dep);
            return dep;
          }
        }
        return dep;
      }
    }
  }

  recordTemporaries(instr: ReactiveInstruction, state: VisitorState): void {
    const temporaries = this.temporaries;
    const { value } = instr;
    const lvalId = instr.lvalue?.identifier.id;
    if (lvalId != null && temporaries.has(lvalId)) {
      return;
    }
    const isNamedLocal =
      lvalId != null && instr.lvalue?.identifier.name?.kind === "named";
    if (isNamedLocal && state.manualMemoState != null) {
      state.manualMemoState.decls.add(lvalId);
    }

    const maybeDep = this.collectMaybeMemoDependencies(value, state);
    if (lvalId != null) {
      if (maybeDep != null) {
        temporaries.set(lvalId, maybeDep);
      } else if (isNamedLocal) {
        temporaries.set(lvalId, {
          root: {
            kind: "NamedLocal",
            value: { ...(instr.lvalue as Place) },
          },
          path: [],
        });
      }
    }
  }

  override visitScope(
    scopeBlock: ReactiveScopeBlock,
    state: VisitorState
  ): void {
    this.traverseScope(scopeBlock, state);

    if (
      state.manualMemoState != null &&
      state.manualMemoState.depsFromSource != null
    ) {
      for (const dep of scopeBlock.scope.dependencies) {
        validateInferredDep(
          dep,
          this.temporaries,
          state.manualMemoState.decls,
          state.manualMemoState.depsFromSource,
          state.errors
        );
      }
    }

    /*
     * Record scopes that exist in the AST so we can later check to see if
     * effect dependencies which should be memoized (have a scope assigned)
     * actually are memoized (that scope exists).
     * However, we only record scopes if *their* dependencies are also
     * memoized, allowing a transitive memoization check.
     */
    let areDependenciesMemoized = true;
    for (const dep of scopeBlock.scope.dependencies) {
      if (isUnmemoized(dep.identifier, this.scopes)) {
        areDependenciesMemoized = false;
        break;
      }
    }
    if (areDependenciesMemoized) {
      this.scopes.add(scopeBlock.scope.id);
      for (const id of scopeBlock.scope.merged) {
        this.scopes.add(id);
      }
    }
  }

  override visitInstruction(
    instruction: ReactiveInstruction,
    state: VisitorState
  ): void {
    this.traverseInstruction(instruction, state);
    this.recordTemporaries(instruction, state);
    if (instruction.value.kind === "StartMemoize") {
      let depsFromSource: Array<ManualMemoDependency> | null = null;
      if (instruction.value.deps != null) {
        depsFromSource = instruction.value.deps;
      }
      CompilerError.invariant(state.manualMemoState == null, {
        reason: "Unexpected nested StartMemoize instructions",
        description: `Bad manual memoization ids: ${state.manualMemoState?.manualMemoId}, ${instruction.value.manualMemoId}`,
        loc: instruction.value.loc,
        suggestions: null,
      });

      state.manualMemoState = {
        decls: new Set(),
        depsFromSource,
        manualMemoId: instruction.value.manualMemoId,
      };
    }
    if (instruction.value.kind === "FinishMemoize") {
      CompilerError.invariant(
        state.manualMemoState != null &&
          state.manualMemoState.manualMemoId === instruction.value.manualMemoId,
        {
          reason: "Unexpected mismatch between StartMemoize and FinishMemoize",
          description: `Encountered StartMemoize id=${state.manualMemoState?.manualMemoId} followed by FinishMemoize id=${instruction.value.manualMemoId}`,
          loc: instruction.value.loc,
          suggestions: null,
        }
      );
      state.manualMemoState = null;
    }

    const isDep = instruction.value.kind === "StartMemoize";
    const isDecl =
      instruction.value.kind === "FinishMemoize" && !instruction.value.pruned;
    if (isDep || isDecl) {
      for (const value of eachInstructionValueOperand(
        instruction.value as InstructionValue
      )) {
        if (
          isMutable(instruction as Instruction, value) ||
          (isDecl && isUnmemoized(value.identifier, this.scopes))
        ) {
          state.errors.push({
            reason:
              "This value was manually memoized, but cannot be memoized under Forget because it may be mutated after it is memoized",
            description: null,
            severity: ErrorSeverity.InvalidReact,
            loc: typeof instruction.loc !== "symbol" ? instruction.loc : null,
            suggestions: null,
          });
        }
      }
    }
  }
}

function isUnmemoized(operand: Identifier, scopes: Set<ScopeId>): boolean {
  return operand.scope != null && !scopes.has(operand.scope.id);
}
