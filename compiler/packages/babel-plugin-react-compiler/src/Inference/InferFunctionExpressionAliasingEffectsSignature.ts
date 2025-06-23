/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BlockId,
  HIRFunction,
  IdentifierId,
  Place,
  ValueKind,
  ValueReason,
} from '../HIR';
import {AliasingEffect} from './AliasingEffects';
import {CompilerError} from '..';

/**
 * This function tracks data flow within an inner function expression in order to
 * compute a set of data-flow aliasing effects describing data flow between the function's
 * params, context variables, and return value.
 *
 * For example, consider the following function expression:
 *
 * ```
 * (x) => { return [x, y] }
 * ```
 *
 * This function captures both param `x` and context variable `y` into the return value.
 * Unlike our previous inference which counted this as a mutation of x and y, we want to
 * build a signature for the function that describes the data flow. We would infer
 * `Capture x -> return, Capture y -> return` effects for this function.
 *
 * This function *also* propagates more ambient-style effects (MutateFrozen, MutateGlobal, Impure, Render)
 * from instructions within the function up to the function itself.
 */
export function inferFunctionExpressionAliasingEffectsSignature(
  fn: HIRFunction,
): Array<AliasingEffect> | null {
  const seenBlocks = new Set<BlockId>();
  type Node = {
    place: Place;
    aliasing: Map<IdentifierId, 'Alias' | 'Capture'>;
  };
  const state = new Map<IdentifierId, Node>();
  const tracked = new Map<IdentifierId, Place>();
  for (const param of [...fn.params, ...fn.context, fn.returns]) {
    const place = param.kind === 'Identifier' ? param : param.place;
    tracked.set(place.identifier.id, place);
    state.set(place.identifier.id, {
      place,
      aliasing: new Map(),
    });
  }

  const effects: Array<AliasingEffect> = [];
  let needsCreateReturnValue = false;
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      const node = {
        place: phi.place,
        aliasing: new Map(),
      };
      for (const [pred, operand] of phi.operands) {
        if (!seenBlocks.has(pred)) {
          // TODO: infer data flow in function expressions with loops
          return null;
        }
        const operandNode = state.get(operand.identifier.id);
        if (operandNode == null) {
          continue;
        }
        if (tracked.has(operandNode.place.identifier.id)) {
          node.aliasing.set(operandNode.place.identifier.id, 'Alias');
        } else {
          for (const [id, kind] of operandNode.aliasing) {
            const prevKind = node.aliasing.get(id);
            if (prevKind == null) {
              operandNode.aliasing.set(id, kind);
            } else {
              operandNode.aliasing.set(id, 'Alias');
            }
          }
        }
      }
      state.set(phi.place.identifier.id, node);
    }
    seenBlocks.add(block.id);
    for (const instr of block.instructions) {
      if (instr.effects == null) {
        continue;
      }
      for (const effect of instr.effects) {
        switch (effect.kind) {
          case 'Create': {
            if (
              effect.value === ValueKind.Primitive ||
              effect.value === ValueKind.Frozen ||
              effect.value === ValueKind.Global
            ) {
              continue;
            }
            state.set(effect.into.identifier.id, {
              place: effect.into,
              aliasing: new Map(),
            });
            break;
          }
          case 'CreateFunction': {
            state.set(effect.into.identifier.id, {
              place: effect.into,
              aliasing: new Map(),
            });
            break;
          }
          case 'Assign': {
            const from = state.get(effect.from.identifier.id);
            if (from != null) {
              state.set(effect.into.identifier.id, from);
            }
            break;
          }
          case 'CreateFrom': {
            const from = state.get(effect.from.identifier.id);
            if (from != null) {
              state.set(effect.into.identifier.id, from);
            }
            break;
          }
          case 'Alias':
          case 'Capture': {
            if (effect.from.identifier.id === effect.into.identifier.id) {
              continue;
            }
            const from = state.get(effect.from.identifier.id);
            const into = state.get(effect.into.identifier.id);
            if (from == null || into == null) {
              continue;
            }

            if (tracked.has(from.place.identifier.id)) {
              const prevKind = into.aliasing.get(from.place.identifier.id);
              if (prevKind == null) {
                into.aliasing.set(from.place.identifier.id, effect.kind);
              } else if (prevKind !== effect.kind) {
                into.aliasing.set(from.place.identifier.id, 'Alias');
              }
              for (const [id, aliasedKind] of into.aliasing) {
                if (id === from.place.identifier.id) {
                  continue;
                }
                const intoNode = state.get(id)!;
                const kind =
                  effect.kind === 'Capture' ? 'Capture' : aliasedKind;
                const prevKind = intoNode.aliasing.get(
                  from.place.identifier.id,
                );
                if (prevKind == null) {
                  intoNode.aliasing.set(from.place.identifier.id, kind);
                } else if (prevKind !== kind) {
                  intoNode.aliasing.set(from.place.identifier.id, 'Alias');
                }
              }
            } else {
              for (const [id, aliasedKind] of from.aliasing) {
                if (id === into.place.identifier.id) {
                  continue;
                }
                const kind =
                  effect.kind === 'Capture' ? 'Capture' : aliasedKind;
                const prevKind = into.aliasing.get(id);
                if (prevKind == null) {
                  into.aliasing.set(id, kind);
                } else if (prevKind !== kind) {
                  into.aliasing.set(id, 'Alias');
                }
              }
            }
            break;
          }
          case 'Apply': {
            // already converts to individual effects
            break;
          }
          case 'MutateFrozen':
          case 'MutateGlobal':
          case 'Impure':
          case 'Render': {
            effects.push(effect);
            break;
          }
        }
      }
    }
    if (block.terminal.kind === 'return') {
      const from = state.get(block.terminal.value.identifier.id);
      const into = state.get(fn.returns.identifier.id);
      if (from == null || into == null) {
        needsCreateReturnValue = true;
        continue;
      }
      if (tracked.has(from.place.identifier.id)) {
        const prevKind = into.aliasing.get(from.place.identifier.id);
        if (prevKind == null) {
          into.aliasing.set(from.place.identifier.id, 'Alias');
        } else if (prevKind !== 'Alias') {
          into.aliasing.set(from.place.identifier.id, 'Alias');
        }
      } else {
        needsCreateReturnValue = true;
        for (const [id, aliasedKind] of from.aliasing) {
          const prevKind = into.aliasing.get(id);
          if (prevKind == null) {
            into.aliasing.set(id, aliasedKind);
          } else if (prevKind !== aliasedKind) {
            into.aliasing.set(id, 'Alias');
          }
        }
      }
    } else if (block.terminal.kind === 'try') {
      // TODO: infer data flow with try/catch
    } else if (block.terminal.kind === 'throw') {
      // TODO: infer data flow with throwing function expressions
      return null;
    }
  }
  if (needsCreateReturnValue) {
    effects.push({
      kind: 'Create',
      into: fn.returns,
      value:
        fn.returnType.kind === 'Primitive'
          ? ValueKind.Primitive
          : ValueKind.Mutable,
      reason: ValueReason.KnownReturnSignature,
    });
  }
  const seen = new Set<Node>();
  for (const node of state.values()) {
    if (!tracked.has(node.place.identifier.id)) {
      continue;
    }
    if (seen.has(node)) {
      continue;
    }
    seen.add(node);
    if (
      !needsCreateReturnValue &&
      node.place.identifier.id === fn.returns.identifier.id &&
      node.aliasing.size === 1 &&
      [...node.aliasing.values()][0] === 'Alias'
    ) {
      // Special case of assigning a single value to the return
      const place = tracked.get([...node.aliasing.keys()][0])!;
      effects.push({
        kind: 'Assign',
        from: place,
        into: fn.returns,
      });
      continue;
    }
    for (const [id, kind] of node.aliasing) {
      const from = tracked.get(id);
      CompilerError.invariant(from != null, {
        reason: `Expected all aliased values to derive from a parameter or context variable`,
        loc: fn.loc,
      });
      switch (kind) {
        case 'Alias': {
          // effects.push({kind: 'Alias', from, into: node.place});
          effects.push({kind: 'Capture', from, into: node.place});
          break;
        }
        case 'Capture': {
          effects.push({kind: 'Capture', from, into: node.place});
          break;
        }
      }
    }
  }
  return effects;
}
