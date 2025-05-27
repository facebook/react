import {
  BlockId,
  Environment,
  GeneratedSource,
  HIR,
  HIRFunction,
  InstructionKind,
  Place,
  SourceLocation,
  SpreadPattern,
} from '../../HIR';
import {Types, TypeEnv, ConcreteType, Type} from './Types';
import * as TypeErrors from './TypeErrors';
import * as t from '@babel/types';
import {CompilerError} from '../..';
import {assertExhaustive} from '../../Utils/utils';

export function typecheck(fn: HIRFunction): void {
  const typeEnv = new TypeEnv();
  const seenBlocks = new Set<BlockId>();

  typeParams(fn.params, typeEnv);

  const returnType = t.isFlowType(fn.returnTypeAnnotation) ? convert(fn.returnTypeAnnotation, typeEnv) : Types.variable(typeEnv);

  for (const [blockId, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      const [[block0, operand0], ...operands] = phi.operands;
      if (seenBlocks.has(block0) && operands.every(([block, op]) => seenBlocks.has(block) && typeEnv.checkEqual(typeEnv.getType(op.identifier), typeEnv.getType(operand0.identifier)))) {
        typeEnv.setType(phi.place.identifier, typeEnv.getType(operand0.identifier));
      } else if (phi.place.identifier.name != null) {
        typeEnv.setType(phi.place.identifier, typeEnv.getDeclaredType(phi.place.identifier));
      } else {
        CompilerError.throwTodo({ reason: `Cannot determine phi type for ${phi.place.identifier.id}`, loc: phi.place.loc});
      }
    }

    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'ArrayExpression': {
          const eltType = Types.variable(typeEnv);
          for (const elt of instr.value.elements) {
            if (elt.kind === 'Spread') {
              TypeErrors.unsupportedLanguageFeature(
                'array spreads',
                elt.place.loc,
              );
            } else if (elt.kind === 'Hole') {
              TypeErrors.unsupportedLanguageFeature(
                'array holes',
                instr.value.loc,
              );
            } else {
              typeEnv.unify(
                eltType,
                typeEnv.getType(elt.identifier),
                instr.loc,
              );
            }
          }
          typeEnv.setType(instr.lvalue.identifier, eltType);
          break;
        }
        case 'Await': {
          TypeErrors.unsupportedLanguageFeature('await', instr.loc);
        }
        case 'BinaryExpression': {
          const left = typeEnv.getType(instr.value.left.identifier);
          const right = typeEnv.getType(instr.value.right.identifier);

          switch (instr.value.operator) {
            case '+': {
              TypeErrors.unsupportedLanguageFeature(
                'addition, lol',
                instr.value.loc,
              );
            }
            case '!=':
            case '!==':
            case '==':
            case '===':
            case 'instanceof':
            case 'in': {
              typeEnv.setType(instr.lvalue.identifier, Types.boolean());
              break;
            }
            default: {
              typeEnv.unify(left, Types.number(), instr.value.left.loc);
              typeEnv.unify(right, Types.number(), instr.value.right.loc);
              typeEnv.setType(instr.lvalue.identifier, Types.number());
            }
          }
          break;
        }
        case 'MethodCall':
        case 'CallExpression': {
          const calleePlace =
            instr.value.kind === 'CallExpression'
              ? instr.value.callee
              : instr.value.property;
          const typeArgumentsPlaces =
            instr.value.kind === 'CallExpression'
              ? instr.value.typeArguments
              : null;
          const callee = typeEnv.getType(calleePlace.identifier);
          const typeArguments =
            typeArgumentsPlaces?.map(ty => convert(ty, typeEnv)) ?? null;
          if (typeArguments != null) {
            TypeErrors.unsupportedLanguageFeature(
              'explicit function generic instantiation',
              instr.value.loc,
            );
          }
          const callArguments = instr.value.args.map(arg => {
            if (arg.kind === 'Spread') {
              TypeErrors.unsupportedLanguageFeature(
                'spread arguments',
                arg.place.loc,
              );
            }
            return typeEnv.getType(arg.identifier);
          });
          const returnType = Types.variable(typeEnv);
          typeEnv.unify(
            callee,
            Types.function(null, callArguments, returnType),
            calleePlace.loc,
          );
          typeEnv.setType(instr.lvalue.identifier, returnType);
          break;
        }
        case 'ComputedDelete':
        case 'PropertyDelete': {
          TypeErrors.unsupportedLanguageFeature('delete', instr.loc);
        }
        case 'ComputedLoad': {
          const loaded = typeEnv.resolve(
            typeEnv.getType(instr.value.object.identifier),
            instr.value.object.loc,
          );
          if (loaded.kind === 'Array') {
            typeEnv.unify(
              typeEnv.getType(instr.value.property.identifier),
              Types.number(),
              instr.value.property.loc,
            );
            typeEnv.setType(instr.lvalue.identifier, loaded.element);
          } else {
            typeEnv.unify(
              typeEnv.getType(instr.value.property.identifier),
              Types.string(),
              instr.value.property.loc,
            );
            TypeErrors.unsupportedLanguageFeature(
              'computed object load',
              instr.loc,
            );
          }
          break;
        }
        case 'ComputedStore': {
          const loaded = typeEnv.resolve(
            typeEnv.getType(instr.value.object.identifier),
            instr.value.object.loc,
          );
          if (loaded.kind === 'Array') {
            typeEnv.unify(
              typeEnv.getType(instr.value.property.identifier),
              Types.number(),
              instr.value.property.loc,
            );
            typeEnv.unify(
              loaded.element,
              typeEnv.getType(instr.value.value.identifier),
              instr.value.value.loc,
            );
          } else {
            typeEnv.unify(
              typeEnv.getType(instr.value.property.identifier),
              Types.string(),
              instr.value.property.loc,
            );
            TypeErrors.unsupportedLanguageFeature(
              'computed object store',
              instr.loc,
            );
          }
          typeEnv.setType(
            instr.lvalue.identifier,
            typeEnv.getType(instr.value.value.identifier),
          );
          break;
        }
        case 'Debugger': {
          TypeErrors.unsupportedLanguageFeature('debugger', instr.loc);
        }
        case 'DeclareContext':
        case 'DeclareLocal': {
          if (
            instr.value.kind === 'DeclareLocal' &&
            t.isFlowType(instr.value.type)
          ) {
            typeEnv.declare(
              instr.value.lvalue.place.identifier,
              convert(instr.value.type, typeEnv),
            );
          } else {
            typeEnv.declare(
              instr.value.lvalue.place.identifier,
              Types.variable(typeEnv),
            );
          }
          typeEnv.setType(instr.lvalue.identifier, Types.void());
          break;
        }
        case 'Destructure': {
          TypeErrors.unsupportedLanguageFeature('destructuring', instr.loc);
        }
        case 'FinishMemoize':
        case 'StartMemoize':
        case 'UnsupportedNode': {
          break;
        }
        case 'FunctionExpression':
        case 'ObjectMethod': {
          TypeErrors.unsupportedLanguageFeature(
            'function expressions',
            instr.loc,
          );
        }
        case 'GetIterator':
        case 'IteratorNext':
        case 'NextPropertyOf': {
          TypeErrors.unsupportedLanguageFeature('iterators', instr.loc);
        }
        case 'JSXText': {
          typeEnv.setType(instr.lvalue.identifier, Types.string());
          break;
        }
        case 'JsxExpression':
        case 'JsxFragment': {
          TypeErrors.unsupportedLanguageFeature('JSX', instr.loc);
        }
        case 'LoadContext':
        case 'LoadLocal': {
          typeEnv.setType(
            instr.lvalue.identifier,
            typeEnv.getType(instr.value.place.identifier),
          );
          break;
        }
        case 'LoadGlobal': {
          TypeErrors.unsupportedLanguageFeature('globals', instr.loc);
        }
        case 'MetaProperty': {
          TypeErrors.unsupportedLanguageFeature('metaproperties', instr.loc);
        }
        case 'NewExpression': {
          TypeErrors.unsupportedLanguageFeature('new', instr.loc);
        }
        case 'ObjectExpression': {
          TypeErrors.unsupportedLanguageFeature('objects', instr.loc);
        }
        case 'PostfixUpdate':
        case 'PrefixUpdate': {
          typeEnv.unify(
            typeEnv.getType(instr.value.value.identifier),
            Types.number(),
            instr.value.loc,
          );
          typeEnv.setType(instr.lvalue.identifier, Types.number());
          break;
        }
        case 'Primitive': {
          let ty: Type;
          switch (typeof instr.value.value) {
            case 'boolean':
              ty = Types.boolean();
              break;
            case 'number':
              ty = Types.number();
              break;
            case 'string':
              ty = Types.string();
              break;
            case 'undefined':
              ty = Types.void();
              break;
            case 'object':
              if (instr.value.value === null) {
                TypeErrors.unsupportedLanguageFeature('null', instr.value.loc);
              }
              CompilerError.invariant(false, {
                reason: 'Unexpected primitive value',
                loc: instr.value.loc,
              });
            default:
              CompilerError.invariant(false, {
                reason: 'Unexpected primitive value',
                loc: instr.value.loc,
              });
          }
          typeEnv.setType(instr.lvalue.identifier, ty);
          break;
        }
        case 'PropertyLoad':
        case 'PropertyStore': {
          TypeErrors.unsupportedLanguageFeature('object properties', instr.loc);
        }
        case 'RegExpLiteral': {
          TypeErrors.unsupportedLanguageFeature('regexp literals', instr.loc);
        }
        case 'StoreContext':
        case 'StoreLocal': {
          let ty;
          if (
            instr.value.kind === 'StoreLocal' &&
            t.isFlowType(instr.value.type)
          ) {
            ty = convert(instr.value.type, typeEnv);
          } else {
            ty = Types.variable(typeEnv);
          }
          if (instr.value.lvalue.kind === InstructionKind.Reassign) {
            typeEnv.setType(instr.value.lvalue.place.identifier, ty);
            typeEnv.setType(instr.lvalue.identifier, ty);
          } else {
            typeEnv.declare(instr.value.lvalue.place.identifier, ty);
            typeEnv.setType(instr.lvalue.identifier, Types.void());
          }
          break;
        }
        case 'StoreGlobal': {
          TypeErrors.unsupportedLanguageFeature('global assignment', instr.loc);
        }
        case 'TaggedTemplateExpression': {
          TypeErrors.unsupportedLanguageFeature('tagged templates', instr.loc);
        }
        case 'TemplateLiteral': {
          TypeErrors.unsupportedLanguageFeature('templates', instr.loc);
        }
        case 'TypeCastExpression': {
          if (t.isFlowType(instr.value.typeAnnotation)) {
            const cast = convert(instr.value.typeAnnotation, typeEnv);
            typeEnv.unify(
              typeEnv.getType(instr.value.value.identifier),
              cast,
              instr.value.loc,
            );
            typeEnv.setType(instr.lvalue.identifier, cast);
          } else {
            typeEnv.setType(
              instr.lvalue.identifier,
              typeEnv.getType(instr.value.value.identifier),
            );
          }
          break;
        }
        case 'UnaryExpression': {
          switch (instr.value.operator) {
            case '+':
            case '-':
            case '~': {
              typeEnv.setType(instr.lvalue.identifier, Types.number());
              break;
            }
            case '!': {
              typeEnv.setType(instr.lvalue.identifier, Types.boolean());
              break;
            }
            case 'void': {
              typeEnv.setType(instr.lvalue.identifier, Types.void());
              break;
            }
            case 'typeof': {
              typeEnv.setType(instr.lvalue.identifier, Types.string());
              break;
            }
            default: {
              assertExhaustive(instr.value, 'Unhandled unary operator');
            }
          }
          break;
        }
      }
    }

    switch (block.terminal.kind) {
      case 'return': {
        typeEnv.unify(returnType, typeEnv.getType(block.terminal.value.identifier), block.terminal.loc);
      }
    }
    seenBlocks.add(blockId);
  }
}

function convert(ty: t.FlowType, typeEnv: TypeEnv): Type {
  switch (ty.type) {
    case 'AnyTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation('any', ty.loc ?? GeneratedSource);
    }
    case 'ArrayTypeAnnotation': {
      return Types.array(convert(ty.elementType, typeEnv));
    }
    case 'BooleanLiteralTypeAnnotation':
    case 'BooleanTypeAnnotation': {
      return Types.boolean();
    }
    case 'EmptyTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation('empty', ty.loc ?? GeneratedSource);
    }
    case 'ExistsTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation(
        'star type',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'FunctionTypeAnnotation': {
      if (ty.rest != null) {
        TypeErrors.unsupportedTypeAnnotation(
          'rest parameters',
          ty.rest.loc ?? GeneratedSource,
        );
      }
      const type = Types.function(
        ty.typeParameters?.params.map(param => {
          if (param.default != null) {
            TypeErrors.unsupportedTypeAnnotation(
              'type parameter defaults',
              param.default.loc ?? GeneratedSource,
            );
          }
          const binding = {
            id: typeEnv.nextTypeParameterId(),
            bound:
              param.bound != null
                ? convert(param.bound.typeAnnotation, typeEnv)
                : Types.mixed(),
          };
          typeEnv.pushGeneric(param.name, binding);
          return binding;
        }) ?? null,
        ty.params.map(param => {
          if (param.optional) {
            TypeErrors.unsupportedTypeAnnotation(
              'optional parameters',
              param.loc ?? GeneratedSource,
            );
          }
          return convert(param.typeAnnotation, typeEnv);
        }),
        convert(ty.returnType, typeEnv),
      );
      ty.typeParameters?.params.forEach(param => {
        typeEnv.popGeneric(param.name);
      });
      return type;
    }
    case 'GenericTypeAnnotation': {
      if (ty.id.type === 'Identifier') {
        if (ty.id.name === 'Array') {
          TypeErrors.checkTypeArgumentArity(
            'array',
            1,
            ty.typeParameters?.params.length ?? 0,
            ty.loc ?? GeneratedSource,
          );
          return Types.array(convert(ty.typeParameters!.params[0], typeEnv));
        } else if (ty.id.name === 'Set') {
          TypeErrors.checkTypeArgumentArity(
            'set',
            1,
            ty.typeParameters?.params.length ?? 0,
            ty.loc ?? GeneratedSource,
          );
          return Types.set(convert(ty.typeParameters!.params[0], typeEnv));
        } else if (ty.id.name === 'Map') {
          TypeErrors.checkTypeArgumentArity(
            'map',
            2,
            ty.typeParameters?.params.length ?? 0,
            ty.loc ?? GeneratedSource,
          );
          return Types.map(
            convert(ty.typeParameters!.params[0], typeEnv),
            convert(ty.typeParameters!.params[1], typeEnv),
          );
        } else if (ty.id.name === 'undefined') {
          TypeErrors.checkTypeArgumentArity(
            'undefined',
            0,
            ty.typeParameters?.params.length ?? 0,
            ty.loc ?? GeneratedSource,
          );
          return Types.void();
        } else {
          const generic = typeEnv.getGeneric(ty.id.name);
          if (generic != null) {
            return {
              kind: 'Concrete',
              type: {kind: 'Generic', id: generic.id, bound: generic.bound},
            };
          }
          TypeErrors.unsupportedTypeAnnotation(
            'type alias',
            ty.loc ?? GeneratedSource,
          );
        }
      } else {
        TypeErrors.unsupportedTypeAnnotation(
          'qualified type alias',
          ty.loc ?? GeneratedSource,
        );
      }
    }
    case 'IndexedAccessType':
    case 'OptionalIndexedAccessType': {
      TypeErrors.unsupportedTypeAnnotation(
        'indexed access type',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'InterfaceTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation(
        'interface',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'IntersectionTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation(
        'intersection',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'MixedTypeAnnotation': {
      return Types.mixed();
    }
    case 'NullLiteralTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation(
        'null type',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'NullableTypeAnnotation': {
      return Types.nullable(convert(ty.typeAnnotation, typeEnv));
    }
    case 'NumberLiteralTypeAnnotation':
    case 'NumberTypeAnnotation': {
      return Types.number();
    }
    case 'ObjectTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation(
        'object type',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'StringLiteralTypeAnnotation':
    case 'StringTypeAnnotation': {
      return Types.string();
    }
    case 'SymbolTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation(
        'symbol type',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'ThisTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation(
        'this-type',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'TupleTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation(
        'tuple type',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'TypeofTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation(
        'typeof type',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'UnionTypeAnnotation': {
      TypeErrors.unsupportedTypeAnnotation(
        'union type',
        ty.loc ?? GeneratedSource,
      );
    }
    case 'VoidTypeAnnotation': {
      return Types.void();
    }
  }
}

function typeParams(
  params: Array<Place | SpreadPattern>,
  typeEnv: TypeEnv,
): void {
  for (const param of params) {
    if (param.kind === 'Spread') {
      TypeErrors.unsupportedLanguageFeature(
        'spread arguments',
        param.place.loc,
      );
    }

    typeEnv.declare(param.identifier, Types.todo());
  }
}
