import invariant from "invariant";
import { log } from "../Utils/logger";
import { DEFAULT_GLOBALS, Global } from "./Globals";
import {
  BuiltInType,
  Effect,
  FunctionType,
  IdentifierId,
  makeIdentifierId,
  ObjectType,
  ValueKind,
} from "./HIR";
import { BUILTIN_HOOKS, Hook } from "./Hooks";
import {
  BUILTIN_SHAPES,
  FunctionSignature,
  ShapeRegistry,
} from "./ObjectShape";

const HOOK_PATTERN = /^_?use/;

export type EnvironmentConfig = Partial<{
  customHooks: Map<string, Hook>;
  memoizeJsxElements: boolean;
}>;

export class Environment {
  #customHooks: Map<string, Hook>;
  #globals: Set<string>;
  #shapes: ShapeRegistry;
  #nextIdentifer: number = 0;

  constructor(config: EnvironmentConfig | null) {
    this.#customHooks = config?.customHooks ?? new Map();
    this.#shapes = BUILTIN_SHAPES;
    this.#globals = DEFAULT_GLOBALS;
  }

  get nextIdentifierId(): IdentifierId {
    return makeIdentifierId(this.#nextIdentifer++);
  }

  getGlobalDeclaration(name: string): Global | null {
    if (!this.#globals.has(name)) {
      log(() => `Undefined global '${name}'`);
    }
    return { name };
  }

  getHookDeclaration(name: string): Hook | null {
    if (!name.match(HOOK_PATTERN)) {
      return null;
    }
    const hook = BUILTIN_HOOKS.get(name) ?? this.#customHooks.get(name);
    if (hook !== undefined) {
      return hook;
    }
    return {
      kind: "Custom",
      name,
      effectKind: Effect.Mutate,
      valueKind: ValueKind.Mutable,
    };
  }

  getPropertyType(
    receiver: ObjectType | FunctionType,
    property: string
  ): BuiltInType | null {
    const { shapeId } = receiver;
    if (shapeId !== null) {
      // If an object or function has a shapeId, it must have been assigned
      // by Forget (and be present in a builtin or user-defined registry)
      const shape = this.#shapes.get(shapeId);
      invariant(
        shape !== undefined,
        `[HIR] Forget internal error: cannot resolve shape ${shapeId}`
      );
      return shape.properties.get(property) ?? null;
    } else {
      return null;
    }
  }

  getFunctionSignature(type: FunctionType): FunctionSignature | null {
    const { shapeId } = type;
    if (shapeId !== null) {
      const shape = this.#shapes.get(shapeId);
      invariant(
        shape !== undefined,
        `[HIR] Forget internal error: cannot resolve shape ${shapeId}`
      );
      return shape.functionType;
    }
    return null;
  }
}
