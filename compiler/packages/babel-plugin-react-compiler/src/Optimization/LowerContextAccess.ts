/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ArrayExpression,
  BasicBlock,
  CallExpression,
  Destructure,
  Effect,
  Environment,
  GeneratedSource,
  HIRFunction,
  IdentifierId,
  Instruction,
  LoadLocal,
  Place,
  PropertyLoad,
  isUseContextHookType,
  makeBlockId,
  makeIdentifierId,
  makeIdentifierName,
  makeInstructionId,
  makeTemporary,
  makeType,
  markInstructionIds,
  mergeConsecutiveBlocks,
  removeUnnecessaryTryCatch,
  reversePostorderBlocks,
} from '../HIR';
import {
  removeDeadDoWhileStatements,
  removeUnreachableForUpdates,
} from '../HIR/HIRBuilder';
import {enterSSA} from '../SSA';
import {inferTypes} from '../TypeInference';

export function lowerContextAccess(fn: HIRFunction): void {
  const contextAccess: Map<IdentifierId, CallExpression> = new Map();
  const contextKeys: Map<IdentifierId, Array<string>> = new Map();

  // collect context access and keys
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const {value, lvalue} = instr;

      if (
        value.kind === 'CallExpression' &&
        isUseContextHookType(value.callee.identifier)
      ) {
        contextAccess.set(lvalue.identifier.id, value);
        continue;
      }

      if (value.kind !== 'Destructure') {
        continue;
      }

      const destructureId = value.value.identifier.id;
      if (!contextAccess.has(destructureId)) {
        continue;
      }

      const keys = getContextKeys(value);
      if (keys === null) {
        continue;
      }

      if (contextKeys.has(destructureId)) {
        /*
         * TODO(gsn): Add support for accessing context over multiple
         * statements.
         */
        return;
      } else {
        contextKeys.set(destructureId, keys);
      }
    }
  }

  if (contextAccess.size > 0) {
    for (const [, block] of fn.body.blocks) {
      const nextInstructions: Array<Instruction> = [];
      for (const instr of block.instructions) {
        const {lvalue, value} = instr;
        if (
          value.kind === 'CallExpression' &&
          isUseContextHookType(value.callee.identifier) &&
          contextKeys.has(lvalue.identifier.id)
        ) {
          const keys = contextKeys.get(lvalue.identifier.id)!;
          const selectorFnInstr = emitSelectorFn(fn.env, keys);
          nextInstructions.push(selectorFnInstr);

          const selectorFn = selectorFnInstr.lvalue;
          value.args.push(selectorFn);
        }

        nextInstructions.push(instr);
      }
      block.instructions = nextInstructions;
    }
    markInstructionIds(fn.body);
  }
}

function getContextKeys(value: Destructure): Array<string> | null {
  const keys = [];
  const pattern = value.lvalue.pattern;

  switch (pattern.kind) {
    case 'ArrayPattern': {
      for (const place of pattern.items) {
        if (place.kind !== 'Identifier') {
          return null;
        }

        if (place.identifier.name === null) {
          return null;
        }

        keys.push(place.identifier.name.value);
      }
      return keys;
    }

    case 'ObjectPattern': {
      for (const place of pattern.properties) {
        if (
          place.kind !== 'ObjectProperty' ||
          place.type !== 'property' ||
          place.key.kind !== 'identifier'
        ) {
          return null;
        }
        keys.push(place.key.name);
      }
      return keys;
    }
  }
}

function emitPropertyLoad(
  env: Environment,
  obj: Place,
  property: string,
): {instructions: Array<Instruction>; element: Place} {
  const loadObj: LoadLocal = {
    kind: 'LoadLocal',
    place: obj,
    loc: GeneratedSource,
  };
  const object: Place = {
    kind: 'Identifier',
    identifier: makeTemporary(env.nextIdentifierId, GeneratedSource),
    effect: Effect.Unknown,
    reactive: false,
    loc: GeneratedSource,
  };
  const loadLocalInstr: Instruction = {
    lvalue: object,
    value: loadObj,
    id: makeInstructionId(0),
    loc: GeneratedSource,
  };

  const loadProp: PropertyLoad = {
    kind: 'PropertyLoad',
    object,
    property,
    loc: GeneratedSource,
  };
  const element: Place = {
    kind: 'Identifier',
    identifier: makeTemporary(env.nextIdentifierId, GeneratedSource),
    effect: Effect.Unknown,
    reactive: false,
    loc: GeneratedSource,
  };
  const loadPropInstr: Instruction = {
    lvalue: element,
    value: loadProp,
    id: makeInstructionId(0),
    loc: GeneratedSource,
  };
  return {
    instructions: [loadLocalInstr, loadPropInstr],
    element: element,
  };
}

function emitSelectorFn(env: Environment, keys: Array<string>): Instruction {
  const obj: Place = {
    kind: 'Identifier',
    identifier: {
      id: makeIdentifierId(env.nextIdentifierId),
      name: makeIdentifierName('c'),
      mutableRange: {start: makeInstructionId(0), end: makeInstructionId(0)},
      scope: null,
      type: makeType(),
      loc: GeneratedSource,
    },
    effect: Effect.Unknown,
    reactive: false,
    loc: GeneratedSource,
  };
  const instr: Array<Instruction> = [];
  const elements = [];
  for (const key of keys) {
    const {instructions, element: prop} = emitPropertyLoad(env, obj, key);
    instr.push(...instructions);
    elements.push(prop);
  }

  const arrayInstr = emitArrayInstr(elements, env);
  instr.push(arrayInstr);

  const block: BasicBlock = {
    kind: 'block',
    id: makeBlockId(0),
    instructions: instr,
    terminal: {
      id: makeInstructionId(0),
      kind: 'return',
      loc: GeneratedSource,
      value: arrayInstr.lvalue,
    },
    preds: new Set(),
    phis: new Set(),
  };

  const fn: HIRFunction = {
    loc: GeneratedSource,
    id: null,
    fnType: 'Other',
    env,
    params: [obj],
    returnType: null,
    context: [],
    effects: null,
    body: {
      entry: block.id,
      blocks: new Map([[block.id, block]]),
    },
    generator: false,
    async: false,
    directives: [],
  };

  reversePostorderBlocks(fn.body);
  removeUnreachableForUpdates(fn.body);
  removeDeadDoWhileStatements(fn.body);
  removeUnnecessaryTryCatch(fn.body);
  markInstructionIds(fn.body);
  mergeConsecutiveBlocks(fn);
  enterSSA(fn);
  inferTypes(fn);

  const fnInstr: Instruction = {
    id: makeInstructionId(0),
    value: {
      kind: 'FunctionExpression',
      name: null,
      loweredFunc: {
        func: fn,
        dependencies: [],
      },
      type: 'ArrowFunctionExpression',
      loc: GeneratedSource,
    },
    lvalue: {
      kind: 'Identifier',
      identifier: makeTemporary(env.nextIdentifierId, GeneratedSource),
      effect: Effect.Unknown,
      reactive: false,
      loc: GeneratedSource,
    },
    loc: GeneratedSource,
  };
  return fnInstr;
}

function emitArrayInstr(elements: Array<Place>, env: Environment): Instruction {
  const array: ArrayExpression = {
    kind: 'ArrayExpression',
    elements,
    loc: GeneratedSource,
  };
  const arrayLvalue: Place = {
    kind: 'Identifier',
    identifier: makeTemporary(env.nextIdentifierId, GeneratedSource),
    effect: Effect.Unknown,
    reactive: false,
    loc: GeneratedSource,
  };
  const arrayInstr: Instruction = {
    id: makeInstructionId(0),
    value: array,
    lvalue: arrayLvalue,
    loc: GeneratedSource,
  };
  return arrayInstr;
}
