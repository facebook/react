/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from '@babel/types';
import {CompilerError} from '../CompilerError';
import {Environment} from '../HIR';
import {lowerType} from '../HIR/BuildHIR';
import {
  HIRFunction,
  Identifier,
  IdentifierId,
  Instruction,
  makeType,
  PropType,
  Type,
  typeEquals,
  TypeId,
  TypeVar,
} from '../HIR/HIR';
import {
  BuiltInArrayId,
  BuiltInFunctionId,
  BuiltInJsxId,
  BuiltInObjectId,
  BuiltInPropsId,
  BuiltInRefValueId,
  BuiltInUseRefId,
} from '../HIR/ObjectShape';
import {eachInstructionLValue, eachInstructionOperand} from '../HIR/visitors';
import {assertExhaustive} from '../Utils/utils';

function isPrimitiveBinaryOp(op: t.BinaryExpression['operator']): boolean {
  switch (op) {
    case '+':
    case '-':
    case '/':
    case '%':
    case '*':
    case '**':
    case '&':
    case '|':
    case '>>':
    case '<<':
    case '^':
    case '>':
    case '<':
    case '>=':
    case '<=':
    case '|>':
      return true;
    default:
      return false;
  }
}

export function inferTypes(func: HIRFunction): void {
  const unifier = new Unifier(func.env);
  for (const e of generate(func)) {
    unifier.unify(e.left, e.right);
  }
  apply(func, unifier);
}

function apply(func: HIRFunction, unifier: Unifier): void {
  for (const [_, block] of func.body.blocks) {
    for (const phi of block.phis) {
      phi.type = unifier.get(phi.type);
    }
    for (const instr of block.instructions) {
      for (const operand of eachInstructionLValue(instr)) {
        operand.identifier.type = unifier.get(operand.identifier.type);
      }
      for (const place of eachInstructionOperand(instr)) {
        place.identifier.type = unifier.get(place.identifier.type);
      }
      const {lvalue, value} = instr;
      lvalue.identifier.type = unifier.get(lvalue.identifier.type);

      if (
        value.kind === 'FunctionExpression' ||
        value.kind === 'ObjectMethod'
      ) {
        apply(value.loweredFunc.func, unifier);
      }
    }
  }
  func.returnType = unifier.get(func.returnType);
}

type TypeEquation = {
  left: Type;
  right: Type;
};

function equation(left: Type, right: Type): TypeEquation {
  return {
    left,
    right,
  };
}

function* generate(
  func: HIRFunction,
): Generator<TypeEquation, void, undefined> {
  if (func.env.fnType === 'Component') {
    const [props, ref] = func.params;
    if (props && props.kind === 'Identifier') {
      yield equation(props.identifier.type, {
        kind: 'Object',
        shapeId: BuiltInPropsId,
      });
    }
    if (ref && ref.kind === 'Identifier') {
      yield equation(ref.identifier.type, {
        kind: 'Object',
        shapeId: BuiltInUseRefId,
      });
    }
  }

  const names = new Map();
  const returnTypes: Array<Type> = [];
  for (const [_, block] of func.body.blocks) {
    for (const phi of block.phis) {
      yield equation(phi.type, {
        kind: 'Phi',
        operands: [...phi.operands.values()].map(id => id.type),
      });
    }

    for (const instr of block.instructions) {
      yield* generateInstructionTypes(func.env, names, instr);
    }
    const terminal = block.terminal;
    if (terminal.kind === 'return') {
      returnTypes.push(terminal.value.identifier.type);
    }
  }
  if (returnTypes.length > 1) {
    yield equation(func.returnType, {
      kind: 'Phi',
      operands: returnTypes,
    });
  } else if (returnTypes.length === 1) {
    yield equation(func.returnType, returnTypes[0]!);
  }
}

function setName(
  names: Map<IdentifierId, string>,
  id: IdentifierId,
  name: Identifier,
): void {
  if (name.name?.kind === 'named') {
    names.set(id, name.name.value);
  }
}

function getName(names: Map<IdentifierId, string>, id: IdentifierId): string {
  return names.get(id) ?? '';
}

function* generateInstructionTypes(
  env: Environment,
  names: Map<IdentifierId, string>,
  instr: Instruction,
): Generator<TypeEquation, void, undefined> {
  const {lvalue, value} = instr;
  const left = lvalue.identifier.type;

  switch (value.kind) {
    case 'TemplateLiteral':
    case 'JSXText':
    case 'Primitive': {
      yield equation(left, {kind: 'Primitive'});
      break;
    }

    case 'UnaryExpression': {
      yield equation(left, {kind: 'Primitive'});
      break;
    }

    case 'LoadLocal': {
      setName(names, lvalue.identifier.id, value.place.identifier);
      yield equation(left, value.place.identifier.type);
      break;
    }

    // We intentionally do not infer types for context variables
    case 'DeclareContext':
    case 'StoreContext':
    case 'LoadContext': {
      break;
    }

    case 'StoreLocal': {
      if (env.config.enableUseTypeAnnotations) {
        yield equation(
          value.lvalue.place.identifier.type,
          value.value.identifier.type,
        );
        const valueType =
          value.type === null ? makeType() : lowerType(value.type);
        yield equation(valueType, value.lvalue.place.identifier.type);
        yield equation(left, valueType);
      } else {
        yield equation(left, value.value.identifier.type);
        yield equation(
          value.lvalue.place.identifier.type,
          value.value.identifier.type,
        );
      }
      break;
    }

    case 'StoreGlobal': {
      yield equation(left, value.value.identifier.type);
      break;
    }

    case 'BinaryExpression': {
      if (isPrimitiveBinaryOp(value.operator)) {
        yield equation(value.left.identifier.type, {kind: 'Primitive'});
        yield equation(value.right.identifier.type, {kind: 'Primitive'});
      }
      yield equation(left, {kind: 'Primitive'});
      break;
    }

    case 'PostfixUpdate':
    case 'PrefixUpdate': {
      yield equation(value.value.identifier.type, {kind: 'Primitive'});
      yield equation(value.lvalue.identifier.type, {kind: 'Primitive'});
      yield equation(left, {kind: 'Primitive'});
      break;
    }

    case 'LoadGlobal': {
      const globalType = env.getGlobalDeclaration(value.binding, value.loc);
      if (globalType) {
        yield equation(left, globalType);
      }
      break;
    }

    case 'CallExpression': {
      /*
       * TODO: callee could be a hook or a function, so this type equation isn't correct.
       * We should change Hook to a subtype of Function or change unifier logic.
       * (see https://github.com/facebook/react-forget/pull/1427)
       */
      yield equation(value.callee.identifier.type, {
        kind: 'Function',
        shapeId: null,
        return: left,
      });
      break;
    }

    case 'ObjectExpression': {
      for (const property of value.properties) {
        if (
          property.kind === 'ObjectProperty' &&
          property.key.kind === 'computed'
        ) {
          yield equation(property.key.name.identifier.type, {
            kind: 'Primitive',
          });
        }
      }
      yield equation(left, {kind: 'Object', shapeId: BuiltInObjectId});
      break;
    }

    case 'ArrayExpression': {
      yield equation(left, {kind: 'Object', shapeId: BuiltInArrayId});
      break;
    }

    case 'PropertyLoad': {
      yield equation(left, {
        kind: 'Property',
        objectType: value.object.identifier.type,
        objectName: getName(names, value.object.identifier.id),
        propertyName: value.property,
      });
      break;
    }

    case 'MethodCall': {
      const returnType = makeType();
      yield equation(value.property.identifier.type, {
        kind: 'Function',
        return: returnType,
        shapeId: null,
      });

      yield equation(left, returnType);
      break;
    }

    case 'Destructure': {
      const pattern = value.lvalue.pattern;
      if (pattern.kind === 'ArrayPattern') {
        for (let i = 0; i < pattern.items.length; i++) {
          const item = pattern.items[i];
          if (item.kind === 'Identifier') {
            // To simulate tuples we use properties with `String(<index>)`, eg "0".
            const propertyName = String(i);
            yield equation(item.identifier.type, {
              kind: 'Property',
              objectType: value.value.identifier.type,
              objectName: getName(names, value.value.identifier.id),
              propertyName,
            });
          } else {
            break;
          }
        }
      } else {
        for (const property of pattern.properties) {
          if (property.kind === 'ObjectProperty') {
            if (
              property.key.kind === 'identifier' ||
              property.key.kind === 'string'
            ) {
              yield equation(property.place.identifier.type, {
                kind: 'Property',
                objectType: value.value.identifier.type,
                objectName: getName(names, value.value.identifier.id),
                propertyName: property.key.name,
              });
            }
          }
        }
      }
      break;
    }

    case 'TypeCastExpression': {
      if (env.config.enableUseTypeAnnotations) {
        yield equation(value.type, value.value.identifier.type);
        yield equation(left, value.type);
      } else {
        yield equation(left, value.value.identifier.type);
      }
      break;
    }

    case 'PropertyDelete':
    case 'ComputedDelete': {
      yield equation(left, {kind: 'Primitive'});
      break;
    }

    case 'FunctionExpression': {
      yield* generate(value.loweredFunc.func);
      yield equation(left, {
        kind: 'Function',
        shapeId: BuiltInFunctionId,
        return: value.loweredFunc.func.returnType,
      });
      break;
    }

    case 'NextPropertyOf': {
      yield equation(left, {kind: 'Primitive'});
      break;
    }

    case 'ObjectMethod': {
      yield* generate(value.loweredFunc.func);
      yield equation(left, {kind: 'ObjectMethod'});
      break;
    }

    case 'JsxExpression':
    case 'JsxFragment': {
      yield equation(left, {kind: 'Object', shapeId: BuiltInJsxId});
      break;
    }
    case 'PropertyStore':
    case 'DeclareLocal':
    case 'NewExpression':
    case 'RegExpLiteral':
    case 'MetaProperty':
    case 'ComputedStore':
    case 'ComputedLoad':
    case 'TaggedTemplateExpression':
    case 'Await':
    case 'GetIterator':
    case 'IteratorNext':
    case 'UnsupportedNode':
    case 'Debugger':
    case 'FinishMemoize':
    case 'StartMemoize': {
      break;
    }
    default:
      assertExhaustive(value, `Unhandled instruction value kind: ${value}`);
  }
}

type Substitution = Map<TypeId, Type>;
class Unifier {
  substitutions: Substitution = new Map();
  env: Environment;

  constructor(env: Environment) {
    this.env = env;
  }

  unify(tA: Type, tB: Type): void {
    if (tB.kind === 'Property') {
      if (
        this.env.config.enableTreatRefLikeIdentifiersAsRefs &&
        isRefLikeName(tB)
      ) {
        this.unify(tB.objectType, {
          kind: 'Object',
          shapeId: BuiltInUseRefId,
        });
        this.unify(tA, {
          kind: 'Object',
          shapeId: BuiltInRefValueId,
        });
        return;
      }
      const objectType = this.get(tB.objectType);
      const propertyType = this.env.getPropertyType(
        objectType,
        tB.propertyName,
      );
      if (propertyType !== null) {
        this.unify(tA, propertyType);
      }
      /*
       * We do not error if tB is not a known object or function (even if it
       * is a primitive), since JS implicit conversion to objects
       */
      return;
    }

    if (typeEquals(tA, tB)) {
      return;
    }

    if (tA.kind === 'Type') {
      this.bindVariableTo(tA, tB);
      return;
    }

    if (tB.kind === 'Type') {
      this.bindVariableTo(tB, tA);
      return;
    }

    if (tB.kind === 'Function' && tA.kind === 'Function') {
      this.unify(tA.return, tB.return);
      return;
    }
  }

  bindVariableTo(v: TypeVar, type: Type): void {
    if (type.kind === 'Poly') {
      //  Ignore PolyType, since we don't support polymorphic types correctly.
      return;
    }

    if (this.substitutions.has(v.id)) {
      this.unify(this.substitutions.get(v.id)!, type);
      return;
    }

    if (type.kind === 'Type' && this.substitutions.has(type.id)) {
      this.unify(v, this.substitutions.get(type.id)!);
      return;
    }

    if (type.kind === 'Phi') {
      const operands = new Set(type.operands.map(i => this.get(i).kind));

      CompilerError.invariant(operands.size > 0, {
        reason: 'there should be at least one operand',
        description: null,
        loc: null,
        suggestions: null,
      });
      const kind = operands.values().next().value;

      // there's only one unique type and it's not a type var
      if (operands.size === 1 && kind !== 'Type') {
        this.unify(v, type.operands[0]);
        return;
      }
    }

    if (this.occursCheck(v, type)) {
      throw new Error('cycle detected');
    }

    this.substitutions.set(v.id, type);
  }

  occursCheck(v: TypeVar, type: Type): boolean {
    if (typeEquals(v, type)) return true;

    if (type.kind === 'Type' && this.substitutions.has(type.id)) {
      return this.occursCheck(v, this.substitutions.get(type.id)!);
    }

    if (type.kind === 'Phi') {
      return type.operands.some(o => this.occursCheck(v, o));
    }

    if (type.kind === 'Function') {
      return this.occursCheck(v, type.return);
    }

    return false;
  }

  get(type: Type): Type {
    if (type.kind === 'Type') {
      if (this.substitutions.has(type.id)) {
        return this.get(this.substitutions.get(type.id)!);
      }
    }

    if (type.kind === 'Phi') {
      return {kind: 'Phi', operands: type.operands.map(o => this.get(o))};
    }

    return type;
  }
}

const RefLikeNameRE = /^(?:[a-zA-Z$_][a-zA-Z$_0-9]*)Ref$|^ref$/;

function isRefLikeName(t: PropType): boolean {
  return RefLikeNameRE.test(t.objectName) && t.propertyName === 'current';
}
