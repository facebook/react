/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'invariant';
import {Environment} from '../HIR';
import {
  BasicBlock,
  GeneratedSource,
  HIRFunction,
  IdentifierId,
  Instruction,
  InstructionId,
  InstructionKind,
  JsxAttribute,
  JsxExpression,
  LoadGlobal,
  makeBlockId,
  makeIdentifierName,
  makeInstructionId,
  makeType,
  ObjectProperty,
  Place,
  promoteTemporary,
  promoteTemporaryJsxTag,
} from '../HIR/HIR';
import {createTemporaryPlace} from '../HIR/HIRBuilder';
import {printIdentifier} from '../HIR/PrintHIR';
import {deadCodeElimination} from './DeadCodeElimination';
import {assertExhaustive} from '../Utils/utils';

export function outlineJSX(fn: HIRFunction): void {
  const outlinedFns: Array<HIRFunction> = [];
  outlineJsxImpl(fn, outlinedFns);

  for (const outlinedFn of outlinedFns) {
    fn.env.outlineFunction(outlinedFn, 'Component');
  }
}

type JsxInstruction = Instruction & {value: JsxExpression};
type LoadGlobalInstruction = Instruction & {value: LoadGlobal};
type LoadGlobalMap = Map<IdentifierId, LoadGlobalInstruction>;

type State = {
  jsx: Array<JsxInstruction>;
  children: Set<IdentifierId>;
};

function outlineJsxImpl(
  fn: HIRFunction,
  outlinedFns: Array<HIRFunction>,
): void {
  const globals: LoadGlobalMap = new Map();

  function processAndOutlineJSX(
    state: State,
    rewriteInstr: Map<InstructionId, Array<Instruction>>,
  ): void {
    if (state.jsx.length <= 1) {
      return;
    }
    const result = process(
      fn,
      [...state.jsx].sort((a, b) => a.id - b.id),
      globals,
    );
    if (result) {
      outlinedFns.push(result.fn);
      rewriteInstr.set(state.jsx.at(0)!.id, result.instrs);
    }
  }

  for (const [, block] of fn.body.blocks) {
    const rewriteInstr = new Map();
    let state: State = {
      jsx: [],
      children: new Set(),
    };

    for (let i = block.instructions.length - 1; i >= 0; i--) {
      const instr = block.instructions[i];
      const {value, lvalue} = instr;
      switch (value.kind) {
        case 'LoadGlobal': {
          globals.set(lvalue.identifier.id, instr as LoadGlobalInstruction);
          break;
        }
        case 'FunctionExpression': {
          outlineJsxImpl(value.loweredFunc.func, outlinedFns);
          break;
        }

        case 'JsxExpression': {
          if (!state.children.has(lvalue.identifier.id)) {
            processAndOutlineJSX(state, rewriteInstr);

            state = {
              jsx: [],
              children: new Set(),
            };
          }
          state.jsx.push(instr as JsxInstruction);
          if (value.children) {
            for (const child of value.children) {
              state.children.add(child.identifier.id);
            }
          }
          break;
        }
        case 'ArrayExpression':
        case 'Await':
        case 'BinaryExpression':
        case 'CallExpression':
        case 'ComputedDelete':
        case 'ComputedLoad':
        case 'ComputedStore':
        case 'Debugger':
        case 'DeclareContext':
        case 'DeclareLocal':
        case 'Destructure':
        case 'FinishMemoize':
        case 'GetIterator':
        case 'IteratorNext':
        case 'JSXText':
        case 'JsxFragment':
        case 'LoadContext':
        case 'LoadLocal':
        case 'MetaProperty':
        case 'MethodCall':
        case 'NewExpression':
        case 'NextPropertyOf':
        case 'ObjectExpression':
        case 'ObjectMethod':
        case 'PostfixUpdate':
        case 'PrefixUpdate':
        case 'Primitive':
        case 'PropertyDelete':
        case 'PropertyLoad':
        case 'PropertyStore':
        case 'RegExpLiteral':
        case 'StartMemoize':
        case 'StoreContext':
        case 'StoreGlobal':
        case 'StoreLocal':
        case 'TaggedTemplateExpression':
        case 'TemplateLiteral':
        case 'TypeCastExpression':
        case 'UnsupportedNode':
        case 'UnaryExpression': {
          break;
        }
        default: {
          assertExhaustive(value, `Unexpected instruction: ${value}`);
        }
      }
    }
    processAndOutlineJSX(state, rewriteInstr);

    if (rewriteInstr.size > 0) {
      const newInstrs = [];
      for (let i = 0; i < block.instructions.length; i++) {
        // InstructionId's are one-indexed, so add one to account for them.
        const id = i + 1;
        if (rewriteInstr.has(id)) {
          const instrs = rewriteInstr.get(id);
          newInstrs.push(...instrs);
        } else {
          newInstrs.push(block.instructions[i]);
        }
      }
      block.instructions = newInstrs;
    }
    deadCodeElimination(fn);
  }
}

type OutlinedResult = {
  instrs: Array<Instruction>;
  fn: HIRFunction;
};

function process(
  fn: HIRFunction,
  jsx: Array<JsxInstruction>,
  globals: LoadGlobalMap,
): OutlinedResult | null {
  /**
   * In the future, add a check for backedge to outline jsx inside loops in a
   * top level component. For now, only outline jsx in callbacks.
   */
  if (fn.fnType === 'Component') {
    return null;
  }

  const props = collectProps(jsx);
  if (!props) return null;

  const outlinedTag = fn.env.generateGloballyUniqueIdentifierName(null).value;
  const newInstrs = emitOutlinedJsx(fn.env, jsx, props, outlinedTag);
  if (!newInstrs) return null;

  const outlinedFn = emitOutlinedFn(fn.env, jsx, props, globals);
  if (!outlinedFn) return null;
  outlinedFn.id = outlinedTag;

  return {instrs: newInstrs, fn: outlinedFn};
}

type OutlinedJsxAttribute = {
  originalName: string;
  newName: string;
  place: Place;
};

function collectProps(
  instructions: Array<JsxInstruction>,
): Array<OutlinedJsxAttribute> | null {
  const attributes: Array<OutlinedJsxAttribute> = [];
  const jsxIds = new Set(instructions.map(i => i.lvalue.identifier.id));
  const seen: Set<string> = new Set();
  for (const instr of instructions) {
    const {value} = instr;

    for (const at of value.props) {
      if (at.kind === 'JsxSpreadAttribute') {
        return null;
      }

      /*
       * TODO(gsn): Handle attributes that have same value across
       * the outlined jsx instructions.
       */
      if (seen.has(at.name)) {
        return null;
      }

      if (at.kind === 'JsxAttribute') {
        seen.add(at.name);
        attributes.push({
          originalName: at.name,
          newName: at.name,
          place: at.place,
        });
      }
    }

    // TODO(gsn): Add support for children that are not jsx expressions
    if (
      value.children &&
      value.children.some(child => !jsxIds.has(child.identifier.id))
    ) {
      return null;
    }
  }
  return attributes;
}

function emitOutlinedJsx(
  env: Environment,
  instructions: Array<Instruction>,
  outlinedProps: Array<OutlinedJsxAttribute>,
  outlinedTag: string,
): Array<Instruction> {
  const props: Array<JsxAttribute> = outlinedProps.map(p => ({
    kind: 'JsxAttribute',
    name: p.newName,
    place: p.place,
  }));

  const loadJsx: Instruction = {
    id: makeInstructionId(0),
    loc: GeneratedSource,
    lvalue: createTemporaryPlace(env, GeneratedSource),
    value: {
      kind: 'LoadGlobal',
      binding: {
        kind: 'ModuleLocal',
        name: outlinedTag,
      },
      loc: GeneratedSource,
    },
  };
  promoteTemporaryJsxTag(loadJsx.lvalue.identifier);
  const jsxExpr: Instruction = {
    id: makeInstructionId(0),
    loc: GeneratedSource,
    lvalue: instructions.at(-1)!.lvalue,
    value: {
      kind: 'JsxExpression',
      tag: {...loadJsx.lvalue},
      props,
      children: null,
      loc: GeneratedSource,
      openingLoc: GeneratedSource,
      closingLoc: GeneratedSource,
    },
  };

  return [loadJsx, jsxExpr];
}

function emitOutlinedFn(
  env: Environment,
  jsx: Array<JsxInstruction>,
  oldProps: Array<OutlinedJsxAttribute>,
  globals: LoadGlobalMap,
): HIRFunction | null {
  const instructions: Array<Instruction> = [];
  const oldToNewProps = createOldToNewPropsMapping(env, oldProps);

  const propsObj: Place = createTemporaryPlace(env, GeneratedSource);
  promoteTemporary(propsObj.identifier);

  const destructurePropsInstr = emitDestructureProps(
    env,
    propsObj,
    oldToNewProps,
  );
  instructions.push(destructurePropsInstr);

  const updatedJsxInstructions = emitUpdatedJsx(jsx, oldToNewProps);
  const loadGlobalInstrs = emitLoadGlobals(jsx, globals);
  if (!loadGlobalInstrs) {
    return null;
  }
  instructions.push(...loadGlobalInstrs);
  instructions.push(...updatedJsxInstructions);

  const block: BasicBlock = {
    kind: 'block',
    id: makeBlockId(0),
    instructions,
    terminal: {
      id: makeInstructionId(0),
      kind: 'return',
      loc: GeneratedSource,
      value: instructions.at(-1)!.lvalue,
    },
    preds: new Set(),
    phis: new Set(),
  };

  const fn: HIRFunction = {
    loc: GeneratedSource,
    id: null,
    fnType: 'Other',
    env,
    params: [propsObj],
    returnTypeAnnotation: null,
    returnType: makeType(),
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
  return fn;
}

function emitLoadGlobals(
  jsx: Array<JsxInstruction>,
  globals: LoadGlobalMap,
): Array<Instruction> | null {
  const instructions: Array<Instruction> = [];
  for (const {value} of jsx) {
    // Add load globals instructions for jsx tags
    if (value.tag.kind === 'Identifier') {
      const loadGlobalInstr = globals.get(value.tag.identifier.id);
      if (!loadGlobalInstr) {
        return null;
      }
      instructions.push(loadGlobalInstr);
    }
  }

  return instructions;
}

function emitUpdatedJsx(
  jsx: Array<JsxInstruction>,
  oldToNewProps: Map<IdentifierId, OutlinedJsxAttribute>,
): Array<JsxInstruction> {
  const newInstrs: Array<JsxInstruction> = [];

  for (const instr of jsx) {
    const {value} = instr;
    const newProps: Array<JsxAttribute> = [];
    // Update old props references to use the newly destructured props param
    for (const prop of value.props) {
      invariant(
        prop.kind === 'JsxAttribute',
        `Expected only attributes but found ${prop.kind}`,
      );
      if (prop.name === 'key') {
        continue;
      }
      const newProp = oldToNewProps.get(prop.place.identifier.id);
      invariant(
        newProp !== undefined,
        `Expected a new property for ${printIdentifier(prop.place.identifier)}`,
      );
      newProps.push({
        kind: 'JsxAttribute',
        name: newProp.originalName,
        place: newProp.place,
      });
    }

    newInstrs.push({
      ...instr,
      value: {
        ...value,
        props: newProps,
      },
    });
  }

  return newInstrs;
}

function createOldToNewPropsMapping(
  env: Environment,
  oldProps: Array<OutlinedJsxAttribute>,
): Map<IdentifierId, OutlinedJsxAttribute> {
  const oldToNewProps = new Map();

  for (const oldProp of oldProps) {
    // Do not read key prop in the outlined component
    if (oldProp.originalName === 'key') {
      continue;
    }

    const newProp: OutlinedJsxAttribute = {
      ...oldProp,
      place: createTemporaryPlace(env, GeneratedSource),
    };
    newProp.place.identifier.name = makeIdentifierName(oldProp.newName);
    oldToNewProps.set(oldProp.place.identifier.id, newProp);
  }

  return oldToNewProps;
}

function emitDestructureProps(
  env: Environment,
  propsObj: Place,
  oldToNewProps: Map<IdentifierId, OutlinedJsxAttribute>,
): Instruction {
  const properties: Array<ObjectProperty> = [];
  for (const [_, prop] of oldToNewProps) {
    properties.push({
      kind: 'ObjectProperty',
      key: {
        kind: 'string',
        name: prop.newName,
      },
      type: 'property',
      place: prop.place,
    });
  }

  const destructurePropsInstr: Instruction = {
    id: makeInstructionId(0),
    lvalue: createTemporaryPlace(env, GeneratedSource),
    loc: GeneratedSource,
    value: {
      kind: 'Destructure',
      lvalue: {
        pattern: {
          kind: 'ObjectPattern',
          properties,
        },
        kind: InstructionKind.Let,
      },
      loc: GeneratedSource,
      value: propsObj,
    },
  };
  return destructurePropsInstr;
}
