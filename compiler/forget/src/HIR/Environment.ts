import invariant from "invariant";
import { log } from "../Utils/logger";
import { DEFAULT_GLOBALS, Global } from "./Globals";
import {
  BuiltInType,
  Effect,
  FunctionType,
  IdentifierId,
  makeIdentifierId,
  Type,
  ValueKind,
} from "./HIR";
import { BUILTIN_HOOKS, Hook } from "./Hooks";
import { BUILTIN_SHAPES, FunctionSignature } from "./ObjectShape";

const HOOK_PATTERN = /^_?use/;

export type EnvironmentOptions = {
  customHooks: Map<string, Hook>;
  globals: Set<string>;
  memoizeJsxElements: boolean;
};

const DEFAULT_OPTIONS: EnvironmentOptions = {
  customHooks: new Map(),
  globals: DEFAULT_GLOBALS,
  memoizeJsxElements: true,
};

export function mergeOptions(
  options: Partial<EnvironmentOptions> | null
): EnvironmentOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...(options ?? {}),
  };
}

export class Environment {
  #options: EnvironmentOptions;
  #nextIdentifer: number = 0;

  constructor(options: EnvironmentOptions | null) {
    this.#options = options ?? DEFAULT_OPTIONS;
  }

  get options(): EnvironmentOptions {
    return this.#options;
  }

  get nextIdentifierId(): IdentifierId {
    return makeIdentifierId(this.#nextIdentifer++);
  }

  getGlobalDeclaration(name: string): Global | null {
    if (!this.#options.globals.has(name)) {
      log(() => `Undefined global '${name}'`);
    }
    return { name };
  }

  getHookDeclaration(name: string): Hook | null {
    if (!name.match(HOOK_PATTERN)) {
      return null;
    }
    const hook = BUILTIN_HOOKS.get(name) ?? this.#options.customHooks.get(name);
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

  getPropertyType(receiver: Type, property: string): BuiltInType | null {
    if (receiver.kind === "Object" || receiver.kind === "Function") {
      const { shapeId } = receiver;
      if (shapeId !== null) {
        const shape = BUILTIN_SHAPES.get(shapeId);
        invariant(
          shape !== undefined,
          `[HIR] Forget internal error: cannot resolve shape ${shapeId}`
        );
        return shape.properties.get(property) ?? null;
      }
    }
    return null;
  }

  getFunctionSignature(type: FunctionType): FunctionSignature | null {
    const { shapeId } = type;
    if (shapeId !== null) {
      const shape = BUILTIN_SHAPES.get(shapeId);
      invariant(
        shape !== undefined,
        `[HIR] Forget internal error: cannot resolve shape ${shapeId}`
      );
      return shape.functionType;
    }
    return null;
  }
}
