import {CompilerError, SourceLocation} from '../..';
import {DeclarationId, Identifier, IdentifierId} from '../../HIR';
import DisjointSet from '../../Utils/DisjointSet';
import {UnificationError} from './TypeErrors';
import * as TypeErrors from './TypeErrors';

export type Type =
  | {kind: 'Concrete'; type: ConcreteType}
  | {kind: 'Variable'; id: VariableId};

export type ConcreteType =
  | {kind: 'Mixed'}
  | {kind: 'Number'}
  | {kind: 'String'}
  | {kind: 'Boolean'}
  | {kind: 'Void'}
  | {kind: 'Nullable'; type: Type}
  | {kind: 'Array'; element: Type}
  | {kind: 'Set'; element: Type}
  | {kind: 'Map'; key: Type; value: Type}
  | {
      kind: 'Function';
      typeParameters: null | Array<TypeParameter>;
      params: Array<Type>;
      returnType: Type;
    }
  | {kind: 'Generic'; id: TypeParameterId; bound: Type}
  | {kind: 'Nominal'; id: NominalId; typeArguments: null | Array<Type>};

type Object = {
  id: NominalId;
  typeParameters: null | Array<TypeParameter>;
  members: Map<string, Type>;
};

type TypeParameter = {
  id: TypeParameterId;
  bound: Type;
};

const opaqueTypeParameterId = Symbol();
export type TypeParameterId = number & {
  [opaqueTypeParameterId]: 'TypeParameterId';
};

export function makeTypeParameterId(id: number): TypeParameterId {
  CompilerError.invariant(id >= 0 && Number.isInteger(id), {
    reason: 'Expected TypeParameterId to be a non-negative integer',
    description: null,
    loc: null,
    suggestions: null,
  });
  return id as TypeParameterId;
}

const opaqueNominalId = Symbol();
export type NominalId = number & {
  [opaqueNominalId]: 'NominalId';
};

export function makeNominalId(id: number): NominalId {
  CompilerError.invariant(id >= 0 && Number.isInteger(id), {
    reason: 'Expected NominalId id to be a non-negative integer',
    description: null,
    loc: null,
    suggestions: null,
  });
  return id as NominalId;
}

const opaqueVariableId = Symbol();
export type VariableId = number & {
  [opaqueVariableId]: 'VariableId';
};

export function makeVariableId(id: number): VariableId {
  CompilerError.invariant(id >= 0 && Number.isInteger(id), {
    reason: 'Expected VariableId id to be a non-negative integer',
    description: null,
    loc: null,
    suggestions: null,
  });
  return id as VariableId;
}

export function printConcrete(type: ConcreteType): string {
  switch (type.kind) {
    case 'Mixed':
      return 'mixed';
    case 'Number':
      return 'number';
    case 'String':
      return 'string';
    case 'Boolean':
      return 'boolean';
    case 'Void':
      return 'void';
    case 'Nullable':
      return `${printType(type.type)} | null`;
    case 'Array':
      return `Array<${printType(type.element)}>`;
    case 'Set':
      return `Set<${printType(type.element)}>`;
    case 'Map':
      return `Map<${printType(type.key)}, ${printType(type.value)}>`;
    case 'Function': {
      const typeParams = type.typeParameters
        ? `<${type.typeParameters.map(tp => `T${tp}`).join(', ')}>`
        : '';
      const params = type.params.map(printType).join(', ');
      const returnType = printType(type.returnType);
      return `${typeParams}(${params}) => ${returnType}`;
    }
    case 'Generic':
      return `T${type.id}`;
    case 'Nominal': {
      const name = `Nominal ${type.id}`;
      if (!type.typeArguments) {
        return name;
      }
      const typeArgs = type.typeArguments.map(printType).join(', ');
      return `${name}<${typeArgs}>`;
    }
    default:
      // Exhaustiveness check
      const _exhaustiveCheck: never = type;
      return `Unknown type: ${JSON.stringify(type)}`;
  }
}

export function printType(type: Type): string {
  switch (type.kind) {
    case 'Concrete':
      return printConcrete(type.type);
    case 'Variable':
      return `$${type.id}`;
    default:
      // Exhaustiveness check
      const _exhaustiveCheck: never = type;
      return `Unknown type: ${JSON.stringify(type)}`;
  }
}

export class TypeEnv {
  #nextTypeParameterId: number = 0;
  #nextNominalId: number = 0;
  #nextVariableId: number = 0;
  #declarations: Map<DeclarationId, Type> = new Map();
  #types: Map<IdentifierId, Type> = new Map();
  #objects: Map<NominalId, Object> = new Map();
  #roots: Map<VariableId, ConcreteType> = new Map();
  #variables: DisjointSet<VariableId> = new DisjointSet();
  #generics: Array<[string, TypeParameter]> = [];

  nextTypeParameterId(): TypeParameterId {
    const id = makeTypeParameterId(this.#nextTypeParameterId++);
    return id;
  }

  nextNominalId(): NominalId {
    const id = makeNominalId(this.#nextNominalId++);
    return id;
  }

  nextTypeVariable(): Type {
    const id = makeVariableId(this.#nextVariableId++);
    return {kind: 'Variable', id};
  }

  declare(id: Identifier, type: Type) {
    CompilerError.invariant(id.name != null, {
      reason: 'Expected to only call declare on named identifiers',
      description: `Attempting to declare ${id.id} with name ${id.name?.value}`,
      loc: null,
    });
    this.#declarations.set(id.declarationId, type);
    this.setType(id, type);
  }

  setType(id: Identifier, type: Type) {
    this.#types.set(id.id, type);
  }

  getType(id: Identifier): Type {
    const ty = this.#types.get(id.id);
    CompilerError.invariant(ty != null, {
      reason: 'Expected all looked-up identifiers to have types in environment',
      description: `Missing type for ${id.id}`,
      loc: null,
    });
    return ty;
  }

  getDeclaredType(id: Identifier): Type {
    CompilerError.invariant(id.name != null, {
      reason: 'Expected to only call getDeclaredType on named identifiers',
      description: `Attempting to get declared type of ${id.id} with name ${id.name?.value}`,
      loc: null,
    });
    const ty = this.#declarations.get(id.declarationId);
    CompilerError.invariant(ty != null, {
      reason: 'Expected all looked-up named identifiers to have declared types in environment',
      description: `Missing declared type for ${id.id}`,
      loc: null,
    });
    return ty;
  }

  pushGeneric(name: string, generic: TypeParameter) {
    this.#generics.unshift([name, generic]);
  }

  popGeneric(name: string) {
    for (let i = 0; i < this.#generics.length; i++) {
      if (this.#generics[i][0] === name) {
        this.#generics.splice(i, 1);
        return;
      }
    }
  }

  getGeneric(name: string): null | TypeParameter {
    for (const [eltName, param] of this.#generics) {
      if (name === eltName) {
        return param;
      }
    }
    return null;
  }

  resolve(t: Type, loc: SourceLocation): ConcreteType {
    if (t.kind === 'Concrete') {
      return t.type;
    } else {
      const root = this.#variables.find(t.id) ?? t.id;
      const resolved = this.#roots.get(root);
      if (resolved != null) {
        return resolved;
      } else {
        TypeErrors.unresolvableTypeVariable(t.id, loc);
      }
    }
  }

  unify(a: Type, b: Type, loc: SourceLocation) {
    const errs = this.#unify(a, b);
    TypeErrors.raiseUnificationErrors(errs, loc);
  }

  #unify(a: Type, b: Type): null | Array<UnificationError> {
    let errors: null | Array<UnificationError> = null;
    function addErrors(err: null | Array<UnificationError>) {
      if (err != null) {
        if (errors == null) {
          errors = [];
        }
        errors.push(...err);
      }
    }

    const getPossiblyMissingRoot = (id: VariableId) => {
      const root = this.#variables.find(id);
      if (root == null) {
        this.#variables.union([id]);
        return id;
      }
      return root;
    };

    if (a.kind === 'Variable') {
      const aRoot = getPossiblyMissingRoot(a.id);
      const aConcrete = this.#roots.get(aRoot);
      if (b.kind === 'Variable') {
        const bRoot = getPossiblyMissingRoot(b.id);
        const bConcrete = this.#roots.get(bRoot);
        this.#variables.union([aRoot, bRoot]);
        const unionRoot = this.#variables.find(aRoot);
        CompilerError.invariant(unionRoot != null, {
          reason: 'Disjoint set reports no root for variable added to set',
          loc: null,
        });
        if (aConcrete != null) {
          if (bConcrete != null) {
            addErrors(this.#unifyConcrete(aConcrete, bConcrete));
          }
          this.#roots.set(unionRoot, aConcrete);
        } else if (bConcrete != null) {
          this.#roots.set(unionRoot, bConcrete);
        }
      } else if (aConcrete != null) {
        addErrors(this.#unifyConcrete(aConcrete, b.type));
      } else {
        this.#roots.set(aRoot, b.type);
      }
    } else if (b.kind === 'Variable') {
      const bRoot = getPossiblyMissingRoot(b.id);
      const bConcrete = this.#roots.get(bRoot);
      if (bConcrete != null) {
        addErrors(this.#unifyConcrete(a.type, bConcrete));
      } else {
        this.#roots.set(bRoot, a.type);
      }
    }

    return errors;
  }

  #unifyConcrete(
    a: ConcreteType,
    b: ConcreteType,
  ): null | Array<UnificationError> {

    function addErrors(err: null | Array<UnificationError>, cur: null | Array<UnificationError>): null | Array<UnificationError> {
      if (err != null) {
        if (cur == null) {
          return  [...err];
        }
        return [...cur, ...err];
      }
      return cur;
    }
    function addError(a: ConcreteType, b: ConcreteType, cur: null | Array<UnificationError>): null | Array<UnificationError> {
      if (cur != null) {
        return [...cur, { left: a, right: b}]
      }
      return [{left: a, right: b}];
    }

    return this.#pairMapConcrete(a, b, (a, b) => this.#unify(a, b), addErrors, addError, null)
  }

  checkEqual(a: Type, b: Type): boolean {
    if (a.kind === 'Variable' && b.kind === 'Variable' && this.#variables.find(a.id) === this.#variables.find(b.id)) {
      return true;
    }

    let aConcrete: ConcreteType;
    if (a.kind === 'Concrete') {
      aConcrete = a.type;
    } else {
      const root = this.#variables.find(a.id) ?? a.id;
      const concrete = this.#roots.get(root);
      if (concrete != null) {
        aConcrete = concrete;
      } else {
        return false;
      }
    }

    let bConcrete: ConcreteType;
    if (b.kind === 'Concrete') {
      bConcrete = b.type;
    } else {
      const root = this.#variables.find(b.id) ?? b.id;
      const concrete = this.#roots.get(root);
      if (concrete != null) {
        bConcrete = concrete;
      } else {
        return false;
      }
    }

    return this.#pairMapConcrete(aConcrete, bConcrete, (a, b) => this.checkEqual(a, b), (child, cur) => child && cur, (_a, _b, _cur) => false, true )
  }

  #pairMapConcrete<R>(
    a: ConcreteType,
    b: ConcreteType,
    onChild: (a: Type, b: Type) => R,
    onChildMismatch: (child: R, cur: R) => R,
    onMismatch: (
      a: ConcreteType,
      b: ConcreteType,
      cur: R,
    ) => R,
    init: R,
  ): R {
    let errors = init;

    // Check if kinds match
    if (a.kind !== b.kind) {
      errors = onMismatch(a, b, errors);
    }

    // Based on kind, check other properties
    switch (a.kind) {
      case 'Mixed':
      case 'Number':
      case 'String':
      case 'Boolean':
      case 'Void':
        // Simple types, no further checks needed
        break;

      case 'Nullable':
        // Check the nested type
        errors = onChildMismatch(
          onChild(
            a.type,
            (b as typeof a).type,
          ),
          errors,
        );
        break;

      case 'Array':
      case 'Set':
        // Check the element type
        errors = onChildMismatch(
          onChild(
            a.element,
            (b as typeof a).element,
          ),
          errors,
        );
        break;

      case 'Map':
        // Check both key and value types
        errors = onChildMismatch(
          onChild(
            a.key,
            (b as typeof a).key,
          ),
          errors,
        );
        errors = onChildMismatch(
          onChild(
            a.value,
            (b as typeof a).value,
          ),
          errors,
        );
        break;

      case 'Function': {
        const bFunc = b as typeof a;

        // Check type parameters
        if ((a.typeParameters === null) !== (bFunc.typeParameters === null)) {
          errors = onMismatch(a, b, errors);
        }

        if (a.typeParameters !== null && bFunc.typeParameters !== null) {
          if (a.typeParameters.length !== bFunc.typeParameters.length) {
            errors = onMismatch(a, b, errors);
          }

          // Type parameters are just numbers, so we can compare them directly
          for (let i = 0; i < a.typeParameters.length; i++) {
            if (a.typeParameters[i] !== bFunc.typeParameters[i]) {
              errors = onMismatch(a, b, errors);
            }
          }
        }

        // Check parameters
        if (a.params.length !== bFunc.params.length) {
          errors = onMismatch(a, b, errors);
        }

        for (let i = 0; i < a.params.length; i++) {
          errors = onChildMismatch(
            onChild(
              a.params[i],
              bFunc.params[i],
            ),
            errors,
          );
        }

        // Check return type
        errors = onChildMismatch(
          onChild(
            a.returnType,
            bFunc.returnType,
          ),
          errors,
        );
        break;
      }

      case 'Generic':
        // Check that the type parameter IDs match
        if (a.id !== (b as typeof a).id) {
          errors = onMismatch(a, b, errors);
        }
        break;

      case 'Nominal': {
        const bNom = b as typeof a;

        // Check that the nominal IDs match
        if (a.id !== bNom.id) {
          errors = onMismatch(a, b, errors);
        }

        // Check type arguments
        if ((a.typeArguments === null) !== (bNom.typeArguments === null)) {
          errors = onMismatch(a, b, errors);
        }

        if (a.typeArguments !== null && bNom.typeArguments !== null) {
          if (a.typeArguments.length !== bNom.typeArguments.length) {
            errors = onMismatch(a, b, errors);
          }

          for (let i = 0; i < a.typeArguments.length; i++) {
            errors = onChildMismatch(
              onChild(
                a.typeArguments[i],
                bNom.typeArguments[i],
              ),
              errors,
            );
          }
        }
        break;
      }
    }

    return errors;
  }
}
export const Types = {
  variable(env: TypeEnv): Type {
    return env.nextTypeVariable();
  },
  number(): Type {
    return {kind: 'Concrete', type: {kind: 'Number'}};
  },
  string(): Type {
    return {kind: 'Concrete', type: {kind: 'String'}};
  },
  boolean(): Type {
    return {kind: 'Concrete', type: {kind: 'Boolean'}};
  },
  void(): Type {
    return {kind: 'Concrete', type: {kind: 'Void'}};
  },
  mixed(): Type {
    return {kind: 'Concrete', type: {kind: 'Mixed'}};
  },
  todo(): Type {
    return {kind: 'Concrete', type: {kind: 'Mixed'}};
  },
  nullable(type: Type): Type {
    return {kind: 'Concrete', type: {kind: 'Nullable', type}};
  },
  array(element: Type): Type {
    return {kind: 'Concrete', type: {kind: 'Array', element}};
  },
  set(element: Type): Type {
    return {kind: 'Concrete', type: {kind: 'Set', element}};
  },
  map(key: Type, value: Type): Type {
    return {kind: 'Concrete', type: {kind: 'Map', key, value}};
  },
  function(
    typeParameters: null | Array<TypeParameter>,
    params: Array<Type>,
    returnType: Type,
  ): Type {
    return {
      kind: 'Concrete',
      type: {kind: 'Function', typeParameters, params, returnType},
    };
  },
  nominal(id: NominalId, typeArguments: null | Array<Type> = null): Type {
    return {
      kind: 'Concrete',
      type: {
        kind: 'Nominal',
        id,
        typeArguments,
      },
    };
  },
};
