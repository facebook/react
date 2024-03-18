/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError, SourceLocation } from "..";
import {
  CallExpression,
  Effect,
  Environment,
  FinishMemoize,
  FunctionExpression,
  HIRFunction,
  IdentifierId,
  Instruction,
  InstructionId,
  LoadGlobal,
  LoadLocal,
  MethodCall,
  Place,
  PropertyLoad,
  SpreadPattern,
  StartMemoize,
  TInstruction,
  getHookKindForType,
  makeInstructionId,
} from "../HIR";
import { createTemporaryPlace, markInstructionIds } from "../HIR/HIRBuilder";
import { eachInstructionValueOperand } from "../HIR/visitors";

type ManualMemoCallee = {
  kind: "useMemo" | "useCallback";
  loadInstr: TInstruction<LoadGlobal> | TInstruction<PropertyLoad>;
};

type IdentifierSidemap = {
  functions: Map<IdentifierId, TInstruction<FunctionExpression>>;
  manualMemos: Map<IdentifierId, ManualMemoCallee>;
  react: Set<IdentifierId>;
};

function collectTemporaries(
  instr: Instruction,
  env: Environment,
  sidemap: IdentifierSidemap
): void {
  const { value } = instr;
  switch (value.kind) {
    case "FunctionExpression": {
      sidemap.functions.set(
        instr.lvalue.identifier.id,
        instr as TInstruction<FunctionExpression>
      );
      break;
    }
    case "LoadGlobal": {
      const global = env.getGlobalDeclaration(value.name);
      const hookKind = global !== null ? getHookKindForType(env, global) : null;
      const lvalId = instr.lvalue.identifier.id;
      if (hookKind === "useMemo" || hookKind === "useCallback") {
        sidemap.manualMemos.set(lvalId, {
          kind: hookKind,
          loadInstr: instr as TInstruction<LoadGlobal>,
        });
      } else if (value.name === "React") {
        sidemap.react.add(lvalId);
      }
      break;
    }
    case "PropertyLoad": {
      if (sidemap.react.has(value.object.identifier.id)) {
        if (value.property === "useMemo" || value.property === "useCallback") {
          sidemap.manualMemos.set(instr.lvalue.identifier.id, {
            kind: value.property,
            loadInstr: instr as TInstruction<PropertyLoad>,
          });
        }
      }
      break;
    }
  }
}

function makeManualMemoizationMarkers(
  fnExpr: Place,
  env: Environment,
  depsList: Array<Place>,
  memoDecl: Place
): [TInstruction<StartMemoize>, TInstruction<FinishMemoize>] {
  return [
    {
      id: makeInstructionId(0),
      lvalue: createTemporaryPlace(env),
      value: {
        kind: "StartMemoize",
        /*
         * Use deps list from source instead of inferred deps
         * as dependencies
         */
        deps: depsList,
        loc: fnExpr.loc,
      },
      loc: fnExpr.loc,
    },
    {
      id: makeInstructionId(0),
      lvalue: createTemporaryPlace(env),
      value: {
        kind: "FinishMemoize",
        decl: { ...memoDecl },
        loc: fnExpr.loc,
      },
      loc: fnExpr.loc,
    },
  ];
}

function getManualMemoizationReplacement(
  fn: Place,
  loc: SourceLocation,
  kind: "useMemo" | "useCallback"
): LoadLocal | CallExpression {
  if (kind === "useMemo") {
    /*
     * Replace the hook callee with the fn arg.
     *
     * before:
     *   $1 = LoadGlobal useMemo       // load the useMemo global
     *   $2 = FunctionExpression ...   // memo function
     *   $3 = ArrayExpression [ ... ]  // deps array
     *   $4 = Call $1 ($2, $3 )        // invoke useMemo w fn and deps
     *
     * after:
     *   $1 = LoadGlobal useMemo       // load the useMemo global (dead code)
     *   $2 = FunctionExpression ...   // memo function
     *   $3 = ArrayExpression [ ... ]  // deps array (dead code)
     *   $4 = Call $2 ()               // invoke the memo function itself
     *
     * Note that a later pass (InlineImmediatelyInvokedFunctionExpressions) will
     * inline the useMemo callback along with any other immediately invoked IIFEs.
     */
    return {
      kind: "CallExpression",
      callee: fn,
      /*
       * Drop the args, including the deps array which DCE will remove
       * later.
       */
      args: [],
      loc,
    };
  } else {
    /*
     * Instead of a Call, just alias the callback directly.
     *
     * before:
     *   $1 = LoadGlobal useCallback
     *   $2 = FunctionExpression ...   // the callback being memoized
     *   $3 = ArrayExpression ...      // deps array
     *   $4 = Call $1 ( $2, $3 )       // invoke useCallback
     *
     * after:
     *   $1 = LoadGlobal useCallback   // dead code
     *   $2 = FunctionExpression ...   // the callback being memoized
     *   $3 = ArrayExpression ...      // deps array (dead code)
     *   $4 = LoadLocal $2             // reference the function
     */
    return {
      kind: "LoadLocal",
      place: {
        kind: "Identifier",
        identifier: fn.identifier,
        effect: Effect.Unknown,
        reactive: false,
        loc,
      },
      loc,
    };
  }
}

function extractManualMemoizationArgs(
  instr: TInstruction<CallExpression> | TInstruction<MethodCall>,
  kind: "useCallback" | "useMemo"
): {
  fnPlace: Place;
} {
  const [fnPlace] = instr.value.args as Array<
    Place | SpreadPattern | undefined
  >;
  if (fnPlace == null) {
    CompilerError.throwInvalidReact({
      reason: `Expected ${kind} call to pass a callback function`,
      loc: instr.value.loc,
      suggestions: null,
    });
  }
  if (fnPlace?.kind !== "Identifier") {
    CompilerError.throwInvalidReact({
      reason: `Unexpected arguments to ${kind} call`,
      loc: instr.value.loc,
      suggestions: null,
    });
  }
  return {
    fnPlace,
  };
}

/*
 * Removes manual memoization using the `useMemo` and `useCallback` APIs. This pass is designed
 * to compose with InlineImmediatelyInvokedFunctionExpressions, and needs to run prior to entering
 * SSA form (alternatively we could refactor and re-EnterSSA after inlining). Therefore it cannot
 * rely on type inference to find useMemo/useCallback invocations, and instead does basic tracking
 * of globals and property loads to find both direct calls as well as usage via the React namespace,
 * eg `React.useMemo()`.
 */
export function dropManualMemoization(func: HIRFunction): void {
  const isValidationEnabled =
    func.env.config.validatePreserveExistingMemoizationGuarantees ||
    func.env.config.enablePreserveExistingMemoizationGuarantees;
  const sidemap: IdentifierSidemap = {
    functions: new Map(),
    manualMemos: new Map(),
    react: new Set(),
  };

  /**
   * Phase 1:
   * - Overwrite manual memoization from
   *   CallExpression callee="useMemo/Callback", args=[fnArg, depslist])
   *   to either
   *   CallExpression callee=fnArg
   *   LoadLocal fnArg
   * - (if validation is enabled) collect manual memoization markers
   */
  const queuedInserts: Map<
    InstructionId,
    {
      kind: "before" | "after";
      value: TInstruction<StartMemoize> | TInstruction<FinishMemoize>;
    }
  > = new Map();
  for (const [_, block] of func.body.blocks) {
    for (let i = 0; i < block.instructions.length; i++) {
      const instr = block.instructions[i]!;
      if (
        instr.value.kind === "CallExpression" ||
        instr.value.kind === "MethodCall"
      ) {
        const id =
          instr.value.kind === "CallExpression"
            ? instr.value.callee.identifier.id
            : instr.value.property.identifier.id;

        const manualMemo = sidemap.manualMemos.get(id);
        if (manualMemo != null) {
          const { fnPlace } = extractManualMemoizationArgs(
            instr as TInstruction<CallExpression> | TInstruction<MethodCall>,
            manualMemo.kind
          );
          instr.value = getManualMemoizationReplacement(
            fnPlace,
            instr.value.loc,
            manualMemo.kind
          );
          if (isValidationEnabled) {
            const inlineMemoFn = sidemap.functions.get(fnPlace.identifier.id);
            if (inlineMemoFn == null) {
              CompilerError.throwInvalidReact({
                reason:
                  "DepsValidation: Expected function literal as manual memoization callback",
                suggestions: [],
                loc: fnPlace.loc,
              });
            }
            const memoDecl: Place =
              manualMemo.kind === "useMemo"
                ? instr.lvalue
                : {
                    kind: "Identifier",
                    identifier: fnPlace.identifier,
                    effect: Effect.Unknown,
                    reactive: false,
                    loc: fnPlace.loc,
                  };

            const [startMarker, finishMarker] = makeManualMemoizationMarkers(
              fnPlace,
              func.env,
              // Next PR will replace this with depslist from source
              [...eachInstructionValueOperand(inlineMemoFn.value)],
              memoDecl
            );

            /*
             * This PR reorders startMarker to right before the inlineMemoFn
             * since startMarker references inlineMemoFn.deps.
             * Next PR will move startMarker earlier, to after the `useMemo`/
             * `useCallback` load itself (as it also changes startMarker to
             * not reference lowered deps anymore).
             */
            queuedInserts.set(inlineMemoFn.id, {
              kind: "before",
              value: startMarker,
            });
            queuedInserts.set(instr.id, { kind: "after", value: finishMarker });
            continue;
          }
        }
      } else {
        collectTemporaries(instr, func.env, sidemap);
      }
    }
  }

  /**
   * Phase 2: Insert manual memoization markers as needed
   */
  if (queuedInserts.size > 0) {
    let hasChanges = false;
    for (const [_, block] of func.body.blocks) {
      let nextInstructions: Array<Instruction> | null = null;
      for (let i = 0; i < block.instructions.length; i++) {
        const instr = block.instructions[i];
        const insertInstr = queuedInserts.get(instr.id);
        if (insertInstr != null) {
          nextInstructions = nextInstructions ?? block.instructions.slice(0, i);
          if (insertInstr.kind === "before") {
            nextInstructions.push(insertInstr.value);
            nextInstructions.push(instr);
          } else {
            nextInstructions.push(instr);
            nextInstructions.push(insertInstr.value);
          }
        } else if (nextInstructions != null) {
          nextInstructions.push(instr);
        }
      }
      if (nextInstructions !== null) {
        block.instructions = nextInstructions;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      markInstructionIds(func.body);
    }
  }
}
