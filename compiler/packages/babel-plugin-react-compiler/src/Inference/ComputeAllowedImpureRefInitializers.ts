/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '..';
import {
  BlockId,
  GeneratedSource,
  HIRFunction,
  IdentifierId,
  InstructionId,
  isUseRefType,
} from '../HIR';
import {eachTerminalOperand} from '../HIR/visitors';
import {retainWhere} from '../Utils/utils';
import {getFunctionCallSignature} from './InferMutationAliasingEffects';

const opaqueRefId = Symbol();
type RefId = number & {[opaqueRefId]: 'RefId'};

function makeRefId(id: number): RefId {
  CompilerError.invariant(id >= 0 && Number.isInteger(id), {
    reason: 'Expected identifier id to be a non-negative integer',
    loc: GeneratedSource,
  });
  return id as RefId;
}

type RefTracking =
  | {kind: 'None'}
  | {kind: 'Nullable'}
  | {kind: 'Ref'; refId: RefId}
  | {kind: 'RefValue'; refId: RefId}
  | {kind: 'Guard'; refId: RefId};

type PendingRoot = {
  instrId: InstructionId;
};

function isSameRefTracking(a: RefTracking | undefined, b: RefTracking): boolean {
  if (a == null || a.kind !== b.kind) {
    return false;
  }
  switch (a.kind) {
    case 'Ref':
    case 'RefValue':
    case 'Guard':
      return a.refId === (b as typeof a).refId;
    case 'None':
    case 'Nullable':
      return true;
  }
}

function setRefTracking(
  refs: Map<IdentifierId, RefTracking>,
  identifierId: IdentifierId,
  tracking: RefTracking,
): boolean {
  if (isSameRefTracking(refs.get(identifierId), tracking)) {
    return false;
  }
  refs.set(identifierId, tracking);
  return true;
}

function computeRefTracking(fn: HIRFunction): Map<IdentifierId, RefTracking> {
  const refs = new Map<IdentifierId, RefTracking>();

  for (let i = 0; i < 10; i++) {
    let changed = false;
    for (const [, block] of fn.body.blocks) {
      for (const instr of block.instructions) {
        const value = instr.value;
        switch (value.kind) {
          case 'LoadLocal':
          case 'LoadContext': {
            const tracking =
              refs.get(value.place.identifier.id) ??
              (isUseRefType(instr.lvalue.identifier)
                ? {
                    kind: 'Ref' as const,
                    refId: makeRefId(instr.lvalue.identifier.id),
                  }
                : {kind: 'None' as const});
            changed =
              setRefTracking(refs, instr.lvalue.identifier.id, tracking) ||
              changed;
            break;
          }
          case 'StoreLocal':
          case 'StoreContext': {
            const tracking =
              refs.get(value.value.identifier.id) ??
              (isUseRefType(value.lvalue.place.identifier)
                ? {
                    kind: 'Ref' as const,
                    refId: makeRefId(value.lvalue.place.identifier.id),
                  }
                : {kind: 'None' as const});
            changed =
              setRefTracking(refs, value.lvalue.place.identifier.id, tracking) ||
              changed;
            changed =
              setRefTracking(refs, instr.lvalue.identifier.id, tracking) ||
              changed;
            break;
          }
          case 'TypeCastExpression': {
            changed =
              setRefTracking(
                refs,
                instr.lvalue.identifier.id,
                refs.get(value.value.identifier.id) ?? {kind: 'None'},
              ) || changed;
            break;
          }
          case 'LoadGlobal': {
            changed =
              setRefTracking(
                refs,
                instr.lvalue.identifier.id,
                value.binding.name === 'undefined'
                  ? {kind: 'Nullable'}
                  : {kind: 'None'},
              ) || changed;
            break;
          }
          case 'Primitive': {
            changed =
              setRefTracking(
                refs,
                instr.lvalue.identifier.id,
                value.value == null ? {kind: 'Nullable'} : {kind: 'None'},
              ) || changed;
            break;
          }
          case 'PropertyLoad': {
            const object = refs.get(value.object.identifier.id);
            changed =
              setRefTracking(
                refs,
                instr.lvalue.identifier.id,
                object?.kind === 'Ref' && value.property === 'current'
                  ? {kind: 'RefValue', refId: object.refId}
                  : {kind: 'None'},
              ) || changed;
            break;
          }
          case 'BinaryExpression': {
            const left = refs.get(value.left.identifier.id);
            const right = refs.get(value.right.identifier.id);
            const refValue =
              left?.kind === 'RefValue'
                ? left
                : right?.kind === 'RefValue'
                  ? right
                  : null;
            changed =
              setRefTracking(
                refs,
                instr.lvalue.identifier.id,
                refValue != null &&
                  (left?.kind === 'Nullable' || right?.kind === 'Nullable')
                  ? {kind: 'Guard', refId: refValue.refId}
                  : {kind: 'None'},
              ) || changed;
            break;
          }
          default: {
            break;
          }
        }

        if (
          isUseRefType(instr.lvalue.identifier) &&
          refs.get(instr.lvalue.identifier.id)?.kind !== 'Ref'
        ) {
          changed =
            setRefTracking(refs, instr.lvalue.identifier.id, {
              kind: 'Ref',
              refId: makeRefId(instr.lvalue.identifier.id),
            }) || changed;
        }
      }
    }
    if (!changed) {
      break;
    }
  }

  return refs;
}

function invalidatePendingUse(
  aliases: Map<IdentifierId, IdentifierId>,
  legitimizedRoots: Set<IdentifierId>,
  invalidatedRoots: Set<IdentifierId>,
  identifierId: IdentifierId,
): void {
  const rootId = aliases.get(identifierId);
  if (rootId != null && !legitimizedRoots.has(rootId)) {
    invalidatedRoots.add(rootId);
  }
}

export function computeAllowedImpureRefInitializers(
  fn: HIRFunction,
): Set<InstructionId> {
  const refs = computeRefTracking(fn);
  const safeBlocks: Array<{block: BlockId; ref: RefId}> = [];
  const pendingRoots = new Map<IdentifierId, PendingRoot>();
  const aliases = new Map<IdentifierId, IdentifierId>();
  const legitimizedRoots = new Set<IdentifierId>();
  const invalidatedRoots = new Set<IdentifierId>();
  const allowed = new Set<InstructionId>();

  for (const [, block] of fn.body.blocks) {
    retainWhere(safeBlocks, entry => entry.block !== block.id);

    for (const instr of block.instructions) {
      const value = instr.value;
      switch (value.kind) {
        case 'MethodCall':
        case 'CallExpression': {
          invalidatePendingUse(
            aliases,
            legitimizedRoots,
            invalidatedRoots,
            value.kind === 'MethodCall'
              ? value.receiver.identifier.id
              : value.callee.identifier.id,
          );
          if (value.kind === 'MethodCall') {
            invalidatePendingUse(
              aliases,
              legitimizedRoots,
              invalidatedRoots,
              value.property.identifier.id,
            );
          }
          for (const arg of value.args) {
            invalidatePendingUse(
              aliases,
              legitimizedRoots,
              invalidatedRoots,
              arg.kind === 'Identifier'
                ? arg.identifier.id
                : arg.place.identifier.id,
            );
          }

          const callee =
            value.kind === 'MethodCall' ? value.property : value.callee;
          const signature = getFunctionCallSignature(
            fn.env,
            callee.identifier.type,
          );
          if (
            signature != null &&
            signature.impure === true &&
            safeBlocks.length > 0
          ) {
            pendingRoots.set(instr.lvalue.identifier.id, {instrId: instr.id});
            aliases.set(instr.lvalue.identifier.id, instr.lvalue.identifier.id);
          }
          break;
        }
        case 'LoadLocal':
        case 'LoadContext': {
          const rootId = aliases.get(value.place.identifier.id);
          if (rootId != null) {
            aliases.set(instr.lvalue.identifier.id, rootId);
          }
          break;
        }
        case 'StoreLocal':
        case 'StoreContext': {
          const rootId = aliases.get(value.value.identifier.id);
          if (rootId != null) {
            aliases.set(value.lvalue.place.identifier.id, rootId);
            aliases.set(instr.lvalue.identifier.id, rootId);
          }
          break;
        }
        case 'TypeCastExpression': {
          const rootId = aliases.get(value.value.identifier.id);
          if (rootId != null) {
            aliases.set(instr.lvalue.identifier.id, rootId);
          }
          break;
        }
        case 'PropertyStore': {
          invalidatePendingUse(
            aliases,
            legitimizedRoots,
            invalidatedRoots,
            value.object.identifier.id,
          );
          const rootId = aliases.get(value.value.identifier.id);
          if (rootId != null) {
            const target = refs.get(value.object.identifier.id);
            const safe = safeBlocks.find(
              entry =>
                target?.kind === 'Ref' &&
                entry.ref === target.refId &&
                value.property === 'current',
            );
            if (safe != null) {
              legitimizedRoots.add(rootId);
              retainWhere(safeBlocks, entry => entry !== safe);
              if (!invalidatedRoots.has(rootId)) {
                const root = pendingRoots.get(rootId);
                CompilerError.invariant(root != null, {
                  reason: 'Expected pending impure root to exist',
                  loc: value.loc,
                });
                allowed.add(root.instrId);
              }
            } else {
              invalidatedRoots.add(rootId);
            }
          }
          break;
        }
        case 'PropertyLoad': {
          invalidatePendingUse(
            aliases,
            legitimizedRoots,
            invalidatedRoots,
            value.object.identifier.id,
          );
          break;
        }
        case 'BinaryExpression': {
          invalidatePendingUse(
            aliases,
            legitimizedRoots,
            invalidatedRoots,
            value.left.identifier.id,
          );
          invalidatePendingUse(
            aliases,
            legitimizedRoots,
            invalidatedRoots,
            value.right.identifier.id,
          );
          break;
        }
        case 'ComputedLoad':
        case 'ComputedDelete':
        case 'ComputedStore': {
          invalidatePendingUse(
            aliases,
            legitimizedRoots,
            invalidatedRoots,
            value.object.identifier.id,
          );
          invalidatePendingUse(
            aliases,
            legitimizedRoots,
            invalidatedRoots,
            value.property.identifier.id,
          );
          if (value.kind === 'ComputedStore') {
            invalidatePendingUse(
              aliases,
              legitimizedRoots,
              invalidatedRoots,
              value.value.identifier.id,
            );
          }
          break;
        }
        default: {
          break;
        }
      }
    }

    if (block.terminal.kind === 'if') {
      const test = refs.get(block.terminal.test.identifier.id);
      if (
        test?.kind === 'Guard' &&
        safeBlocks.find(entry => entry.ref === test.refId) == null
      ) {
        safeBlocks.push({block: block.terminal.fallthrough, ref: test.refId});
      }
    }

    for (const operand of eachTerminalOperand(block.terminal)) {
      invalidatePendingUse(
        aliases,
        legitimizedRoots,
        invalidatedRoots,
        operand.identifier.id,
      );
    }
  }

  for (const rootId of invalidatedRoots) {
    const root = pendingRoots.get(rootId);
    if (root != null) {
      allowed.delete(root.instrId);
    }
  }

  return allowed;
}
