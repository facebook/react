/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerDiagnostic, CompilerError, ErrorCategory} from '../CompilerError';
import {
  BlockId,
  HIRFunction,
  IdentifierId,
  Instruction,
  SourceLocation,
  isRefValueType,
  isUseRefType,
} from '../HIR';
import {eachTerminalSuccessor} from '../HIR/visitors';
import {Err, Ok, Result} from '../Utils/Result';

/**
 * Validates that a function does not mutate a ref value during render.
 * Reading refs is handled by a separate validation pass.
 *
 * Mutation is allowed in:
 * - Event handlers and effect callbacks (functions not called at top level)
 * - Inside `if (ref.current == null)` blocks (null-guard initialization pattern)
 *
 * ```javascript
 * // ERROR - direct mutation in render
 * const ref = useRef(null);
 * ref.current = value;
 *
 * // ERROR - mutation in function called during render
 * const fn = () => { ref.current = value; };
 * fn(); // fn is called, so mutation errors
 *
 * // ALLOWED - mutation in event handler
 * const onClick = () => { ref.current = value; };
 * return <button onClick={onClick} />;
 *
 * // ALLOWED - null-guard initialization
 * if (ref.current == null) {
 *   ref.current = value;
 * }
 * ```
 */

// Unique identifier for correlating refs with their .current values
let nextRefId = 0;
function makeRefId(): number {
  return nextRefId++;
}

type RefInfo = {
  kind: 'Ref' | 'RefValue';
  refId: number;
};

type GuardInfo = {
  refId: number;
  isEquality: boolean; // true for ==, ===; false for !=, !==
};

// Information about a mutation found in a function
type MutationInfo = {
  loc: SourceLocation;
  isCurrentProperty: boolean;
};

export function validateNoRefAccessInRender(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const refs = new Map<IdentifierId, RefInfo>();
  const errors = new CompilerError();

  // Track which identifiers are functions that mutate refs
  const refMutatingFunctions = new Map<IdentifierId, MutationInfo>();

  // Track first initialization location for each ref (by refId)
  const refInitLocations = new Map<number, SourceLocation>();

  validateFunction(fn, refs, refMutatingFunctions, refInitLocations, true, errors);

  if (errors.hasAnyErrors()) {
    return Err(errors);
  }
  return Ok(undefined);
}

function validateFunction(
  fn: HIRFunction,
  refs: Map<IdentifierId, RefInfo>,
  refMutatingFunctions: Map<IdentifierId, MutationInfo>,
  refInitLocations: Map<number, SourceLocation>,
  isTopLevel: boolean,
  errors: CompilerError,
): MutationInfo | null {
  // Track nullable values (null, undefined) for guard detection
  const nullables = new Set<IdentifierId>();

  // Track guard expressions (binary comparisons of ref.current to null)
  const guards = new Map<IdentifierId, GuardInfo>();

  // Track blocks where null-guard allows initialization for specific refs
  const safeBlocks = new Map<BlockId, Set<number>>();

  // Track the first mutation found in this function (for reporting)
  let firstMutation: MutationInfo | null = null;

  // Initialize refs from params
  for (const param of fn.params) {
    const place = param.kind === 'Identifier' ? param : param.place;
    if (isUseRefType(place.identifier)) {
      refs.set(place.identifier.id, {kind: 'Ref', refId: makeRefId()});
    } else if (isRefValueType(place.identifier)) {
      refs.set(place.identifier.id, {kind: 'RefValue', refId: makeRefId()});
    }
  }

  // Initialize refs from context (captured variables)
  for (const place of fn.context) {
    if (isUseRefType(place.identifier) && !refs.has(place.identifier.id)) {
      refs.set(place.identifier.id, {kind: 'Ref', refId: makeRefId()});
    } else if (
      isRefValueType(place.identifier) &&
      !refs.has(place.identifier.id)
    ) {
      refs.set(place.identifier.id, {kind: 'RefValue', refId: makeRefId()});
    }
  }

  // Single forward pass over all blocks
  for (const [, block] of fn.body.blocks) {
    // Get safe refIds for this block
    const safeRefIds = safeBlocks.get(block.id) ?? new Set();

    // Process phi nodes
    for (const phi of block.phis) {
      for (const [, operand] of phi.operands) {
        const refInfo = refs.get(operand.identifier.id);
        if (refInfo != null && !refs.has(phi.place.identifier.id)) {
          refs.set(phi.place.identifier.id, refInfo);
          break;
        }
        // Propagate ref-mutating function info through phis
        const mutationInfo = refMutatingFunctions.get(operand.identifier.id);
        if (
          mutationInfo != null &&
          !refMutatingFunctions.has(phi.place.identifier.id)
        ) {
          refMutatingFunctions.set(phi.place.identifier.id, mutationInfo);
          break;
        }
      }
    }

    // Process instructions
    for (const instr of block.instructions) {
      const mutation = processInstruction(
        instr,
        refs,
        nullables,
        guards,
        refMutatingFunctions,
        refInitLocations,
        safeRefIds,
        isTopLevel,
        errors,
      );
      if (mutation != null && firstMutation == null) {
        firstMutation = mutation;
      }
    }

    // Process terminal for guard detection and safety propagation
    if (block.terminal.kind === 'if') {
      const guard = guards.get(block.terminal.test.identifier.id);
      if (guard != null) {
        // For equality checks (==, ===), consequent is safe (condition true = ref is null)
        // For inequality checks (!=, !==), alternate is safe (condition false = ref is null)
        const safeBlock = guard.isEquality
          ? block.terminal.consequent
          : block.terminal.alternate;
        const fallthrough = block.terminal.fallthrough;

        // Propagate safety through control flow using a queue
        // Stop when we reach the fallthrough (end of the guarded region)
        const queue: BlockId[] = [safeBlock];
        const visited = new Set<BlockId>();
        while (queue.length > 0) {
          const blockId = queue.shift()!;
          if (visited.has(blockId) || blockId === fallthrough) {
            continue;
          }
          visited.add(blockId);

          const existingSafe = safeBlocks.get(blockId) ?? new Set();
          existingSafe.add(guard.refId);
          safeBlocks.set(blockId, existingSafe);

          // Add successors to queue
          const targetBlock = fn.body.blocks.get(blockId);
          if (targetBlock != null) {
            for (const successor of eachTerminalSuccessor(targetBlock.terminal)) {
              if (!visited.has(successor) && successor !== fallthrough) {
                queue.push(successor);
              }
            }
          }
        }
      }
    }
  }

  return firstMutation;
}

function processInstruction(
  instr: Instruction,
  refs: Map<IdentifierId, RefInfo>,
  nullables: Set<IdentifierId>,
  guards: Map<IdentifierId, GuardInfo>,
  refMutatingFunctions: Map<IdentifierId, MutationInfo>,
  refInitLocations: Map<number, SourceLocation>,
  safeRefIds: Set<number>,
  isTopLevel: boolean,
  errors: CompilerError,
): MutationInfo | null {
  const {lvalue, value} = instr;

  // Check if the lvalue has a ref type (handles useRef() calls and similar)
  if (isUseRefType(lvalue.identifier) && !refs.has(lvalue.identifier.id)) {
    refs.set(lvalue.identifier.id, {kind: 'Ref', refId: makeRefId()});
  }
  if (isRefValueType(lvalue.identifier) && !refs.has(lvalue.identifier.id)) {
    refs.set(lvalue.identifier.id, {kind: 'RefValue', refId: makeRefId()});
  }

  switch (value.kind) {
    case 'LoadLocal':
    case 'LoadContext': {
      const refInfo = refs.get(value.place.identifier.id);
      if (refInfo != null) {
        refs.set(lvalue.identifier.id, refInfo);
      }
      if (nullables.has(value.place.identifier.id)) {
        nullables.add(lvalue.identifier.id);
      }
      // Propagate ref-mutating function info
      const mutationInfo = refMutatingFunctions.get(value.place.identifier.id);
      if (mutationInfo != null) {
        refMutatingFunctions.set(lvalue.identifier.id, mutationInfo);
      }
      break;
    }

    case 'StoreLocal':
    case 'StoreContext': {
      const refInfo = refs.get(value.value.identifier.id);
      if (refInfo != null) {
        refs.set(value.lvalue.place.identifier.id, refInfo);
        refs.set(lvalue.identifier.id, refInfo);
      }
      // Propagate ref-mutating function info
      const mutationInfo = refMutatingFunctions.get(value.value.identifier.id);
      if (mutationInfo != null) {
        refMutatingFunctions.set(value.lvalue.place.identifier.id, mutationInfo);
        refMutatingFunctions.set(lvalue.identifier.id, mutationInfo);
      }
      break;
    }

    case 'PropertyLoad': {
      const objRef = refs.get(value.object.identifier.id);
      if (objRef?.kind === 'Ref' && value.property === 'current') {
        refs.set(lvalue.identifier.id, {kind: 'RefValue', refId: objRef.refId});
      } else if (objRef != null) {
        refs.set(lvalue.identifier.id, objRef);
      }
      break;
    }

    case 'ComputedLoad': {
      const objRef = refs.get(value.object.identifier.id);
      if (objRef != null) {
        refs.set(lvalue.identifier.id, objRef);
      }
      break;
    }

    case 'Primitive': {
      if (value.value == null) {
        nullables.add(lvalue.identifier.id);
      }
      break;
    }

    case 'LoadGlobal': {
      if (value.binding.name === 'undefined') {
        nullables.add(lvalue.identifier.id);
      }
      break;
    }

    case 'BinaryExpression': {
      if (['==', '===', '!=', '!=='].includes(value.operator)) {
        const leftRef = refs.get(value.left.identifier.id);
        const rightRef = refs.get(value.right.identifier.id);
        const leftNull = nullables.has(value.left.identifier.id);
        const rightNull = nullables.has(value.right.identifier.id);
        const isEquality = value.operator === '==' || value.operator === '===';

        if (leftRef?.kind === 'RefValue' && rightNull) {
          guards.set(lvalue.identifier.id, {refId: leftRef.refId, isEquality});
        } else if (rightRef?.kind === 'RefValue' && leftNull) {
          guards.set(lvalue.identifier.id, {refId: rightRef.refId, isEquality});
        }
      }
      break;
    }

    case 'UnaryExpression': {
      if (value.operator === '!') {
        const guard = guards.get(value.value.identifier.id);
        if (guard != null) {
          guards.set(lvalue.identifier.id, {
            refId: guard.refId,
            isEquality: !guard.isEquality,
          });
        }
      }
      break;
    }

    case 'PropertyStore':
    case 'ComputedStore': {
      const objRef = refs.get(value.object.identifier.id);
      const isRef = objRef != null || isUseRefType(value.object.identifier);

      if (isRef) {
        const refId = objRef?.refId;
        const isPropertyStore = value.kind === 'PropertyStore';
        const isCurrentProperty = isPropertyStore && value.property === 'current';
        const isNullGuardInit =
          isCurrentProperty && refId != null && safeRefIds.has(refId);

        if (isNullGuardInit && refId != null) {
          // Check if this ref was already initialized
          const firstInitLoc = refInitLocations.get(refId);
          if (firstInitLoc != null) {
            // Error: duplicate initialization
            errors.pushDiagnostic(
              makeDuplicateRefInitError(instr.loc, firstInitLoc),
            );
            return {loc: instr.loc, isCurrentProperty};
          }
          // Track this as the first initialization
          refInitLocations.set(refId, instr.loc);
        } else if (!isNullGuardInit) {
          const mutation: MutationInfo = {
            loc: instr.loc,
            isCurrentProperty,
          };

          if (isTopLevel) {
            // Direct mutation at top level - error immediately
            errors.pushDiagnostic(makeRefMutationError(mutation.loc));
          }
          return mutation;
        }
      }
      break;
    }

    case 'CallExpression':
    case 'MethodCall': {
      // Check if the callee is a function that mutates refs
      const callee =
        value.kind === 'CallExpression' ? value.callee : value.property;
      const mutationInfo = refMutatingFunctions.get(callee.identifier.id);
      if (mutationInfo != null && isTopLevel) {
        // Calling a ref-mutating function at top level - error
        errors.pushDiagnostic(makeRefMutationError(mutationInfo.loc));
      }
      break;
    }

    case 'FunctionExpression':
    case 'ObjectMethod': {
      // Recursively validate function expressions
      // Pass isTopLevel=false since these are nested functions
      const mutation = validateFunction(
        value.loweredFunc.func,
        refs,
        refMutatingFunctions,
        refInitLocations,
        false,
        errors,
      );
      // If the function mutates refs, track it
      if (mutation != null) {
        refMutatingFunctions.set(lvalue.identifier.id, mutation);
      }
      break;
    }

    default: {
      break;
    }
  }
  return null;
}

function makeRefMutationError(loc: SourceLocation): CompilerDiagnostic {
  return CompilerDiagnostic.create({
    category: ErrorCategory.Refs,
    reason: 'Cannot access refs during render',
    description: REF_ERROR_DESCRIPTION,
  }).withDetails({
    kind: 'error',
    loc,
    message: 'Cannot update ref during render',
  });
}

function makeDuplicateRefInitError(
  loc: SourceLocation,
  firstInitLoc: SourceLocation,
): CompilerDiagnostic {
  return CompilerDiagnostic.create({
    category: ErrorCategory.Refs,
    reason: 'Cannot access refs during render',
    description: REF_ERROR_DESCRIPTION,
  })
    .withDetails({
      kind: 'error',
      loc,
      message: 'Ref is initialized more than once during render',
    })
    .withDetails({
      kind: 'error',
      loc: firstInitLoc,
      message: 'Ref was first initialized here',
    });
}

export const REF_ERROR_DESCRIPTION =
  'React refs are values that are not needed for rendering. Refs should only be accessed ' +
  'outside of render, such as in event handlers or effects. ' +
  'Accessing a ref value (the `current` property) during render can cause your component ' +
  'not to update as expected (https://react.dev/reference/react/useRef)';
