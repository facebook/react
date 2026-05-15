/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HIRFunction,
  IdentifierId,
  InstructionKind,
  Place,
  PropertyLiteral,
  getHookKind,
  makePropertyLiteral,
} from '../HIR';
import {eachInstructionValueOperand} from '../HIR/visitors';

type RestObjectInfo = {
  excludedProperties: Set<PropertyLiteral>;
  source: Place;
};

/**
 * Rewrites property loads on non-mutated object-rest temporaries back to the
 * original frozen source when the loaded property was not excluded by the
 * destructure.
 *
 * Example:
 *
 * ```
 * // INPUT
 * const {bar, ...rest} = props;
 * return rest.foo;
 *
 * // OUTPUT
 * return props.foo;
 * ```
 *
 * This lets later passes derive a dependency on `props.foo` rather than the
 * whole `props` object, and dead-code elimination can remove the now-unused
 * object rest temporary.
 */
export function optimizeDestructurePropertyLoads(fn: HIRFunction): void {
  const restObjects = findNonMutatedObjectRestObjects(fn);
  if (restObjects.size === 0) {
    return;
  }

  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      if (instr.value.kind !== 'PropertyLoad') {
        continue;
      }

      const restObject = restObjects.get(instr.value.object.identifier.id);
      if (
        restObject != null &&
        !restObject.excludedProperties.has(instr.value.property)
      ) {
        instr.value = {
          ...instr.value,
          object: restObject.source,
        };
      }
    }
  }
}

function findNonMutatedObjectRestObjects(
  fn: HIRFunction,
): ReadonlyMap<IdentifierId, RestObjectInfo> {
  const knownFrozen = new Set<IdentifierId>();
  if (fn.fnType === 'Component') {
    const [props] = fn.params;
    if (props != null && props.kind === 'Identifier') {
      knownFrozen.add(props.identifier.id);
    }
  } else {
    for (const param of fn.params) {
      if (param.kind === 'Identifier') {
        knownFrozen.add(param.identifier.id);
      }
    }
  }

  const candidateRoots = new Map<IdentifierId, RestObjectInfo>();
  const candidateAliases = new Map<IdentifierId, IdentifierId>();

  const invalidateCandidate = (identifierId: IdentifierId): void => {
    const rootId = candidateAliases.get(identifierId);
    if (rootId != null) {
      candidateRoots.delete(rootId);
    }
  };

  for (const block of fn.body.blocks.values()) {
    if (candidateRoots.size !== 0) {
      for (const phi of block.phis) {
        for (const operand of phi.operands.values()) {
          invalidateCandidate(operand.identifier.id);
        }
      }
    }

    for (const instr of block.instructions) {
      const {lvalue, value} = instr;
      switch (value.kind) {
        case 'Destructure': {
          if (
            !knownFrozen.has(value.value.identifier.id) ||
            !(
              value.lvalue.kind === InstructionKind.Let ||
              value.lvalue.kind === InstructionKind.Const
            ) ||
            value.lvalue.pattern.kind !== 'ObjectPattern'
          ) {
            continue;
          }

          const excludedProperties = new Set<PropertyLiteral>();
          let hasComputedProperty = false;
          for (const property of value.lvalue.pattern.properties) {
            if (property.kind === 'Spread') {
              continue;
            }
            switch (property.key.kind) {
              case 'computed': {
                hasComputedProperty = true;
                break;
              }
              case 'identifier':
              case 'string':
              case 'number': {
                excludedProperties.add(makePropertyLiteral(property.key.name));
                break;
              }
            }
          }

          if (hasComputedProperty) {
            continue;
          }

          for (const property of value.lvalue.pattern.properties) {
            if (property.kind !== 'Spread') {
              continue;
            }
            candidateRoots.set(property.place.identifier.id, {
              excludedProperties: new Set(excludedProperties),
              source: value.value,
            });
            candidateAliases.set(
              property.place.identifier.id,
              property.place.identifier.id,
            );
          }
          break;
        }
        case 'LoadLocal': {
          if (knownFrozen.has(value.place.identifier.id)) {
            knownFrozen.add(lvalue.identifier.id);
          }

          const rootId = candidateAliases.get(value.place.identifier.id);
          if (rootId != null) {
            candidateAliases.set(lvalue.identifier.id, rootId);
          }
          break;
        }
        case 'StoreLocal': {
          if (knownFrozen.has(value.value.identifier.id)) {
            knownFrozen.add(lvalue.identifier.id);
            knownFrozen.add(value.lvalue.place.identifier.id);
          }

          const rootId = candidateAliases.get(value.value.identifier.id);
          if (rootId != null) {
            candidateAliases.set(lvalue.identifier.id, rootId);
            candidateAliases.set(value.lvalue.place.identifier.id, rootId);
          }
          break;
        }
        case 'JsxFragment':
        case 'JsxExpression':
        case 'PropertyLoad': {
          break;
        }
        case 'CallExpression':
        case 'MethodCall': {
          const callee =
            value.kind === 'CallExpression' ? value.callee : value.property;
          if (getHookKind(fn.env, callee.identifier) == null) {
            for (const operand of eachInstructionValueOperand(value)) {
              invalidateCandidate(operand.identifier.id);
            }
          }
          break;
        }
        default: {
          for (const operand of eachInstructionValueOperand(value)) {
            invalidateCandidate(operand.identifier.id);
          }
          break;
        }
      }
    }
  }

  const restObjects = new Map<IdentifierId, RestObjectInfo>();
  for (const [identifierId, rootId] of candidateAliases) {
    const restObject = candidateRoots.get(rootId);
    if (restObject != null) {
      restObjects.set(identifierId, restObject);
    }
  }
  return restObjects;
}
