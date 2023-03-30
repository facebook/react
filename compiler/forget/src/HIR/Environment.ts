import invariant from "invariant";
import { log } from "../Utils/logger";
import { DEFAULT_GLOBALS, Global, GlobalRegistry } from "./Globals";
import {
  BuiltInType,
  Effect,
  FunctionType,
  IdentifierId,
  makeIdentifierId,
  ObjectType,
  ValueKind,
} from "./HIR";
import { Hook } from "./Hooks";
import {
  BUILTIN_SHAPES,
  FunctionSignature,
  ShapeRegistry,
} from "./ObjectShape";

const HOOK_PATTERN = /^_?use/;

// TODO(mofeiZ): User defined global types (with corresponding shapes).
// User defined global types should have inline ObjectShapes instead of directly
// using ObjectShapes.ShapeRegistry, as a user-provided ShapeRegistry may be
// accidentally be not well formed.
// i.e.
//   missing required shapes (BuiltInArray for [] and BuiltInObject for {})
//   missing some recursive Object / Function shapeIds
export type EnvironmentConfig = Partial<{
  customHooks: Map<string, Hook>;
  memoizeJsxElements: boolean;
}>;

export class Environment {
  #globals: GlobalRegistry;
  #shapes: ShapeRegistry;
  #nextIdentifer: number = 0;

  constructor(config: EnvironmentConfig | null) {
    this.#shapes = BUILTIN_SHAPES;

    if (config?.customHooks) {
      this.#globals = new Map(DEFAULT_GLOBALS);
      for (const [hookName, hook] of config.customHooks) {
        invariant(
          !this.#globals.has(hookName),
          `[Globals] Found existing definition in global registry for custom hook ${hookName}`
        );
        this.#globals.set(hookName, {
          kind: "Hook",
          definition: hook,
        });
      }
    } else {
      this.#globals = DEFAULT_GLOBALS;
    }
  }

  get nextIdentifierId(): IdentifierId {
    return makeIdentifierId(this.#nextIdentifer++);
  }

  getGlobalDeclaration(name: string): Global | null {
    let resolvedGlobal: Global | null = this.#globals.get(name) ?? null;
    if (resolvedGlobal === null) {
      // Hack, since we don't track module level declarations and imports
      if (name.match(HOOK_PATTERN)) {
        return {
          kind: "Hook",
          definition: {
            kind: "Custom",
            name,
            effectKind: Effect.Mutate,
            valueKind: ValueKind.Mutable,
          },
        };
      } else {
        log(() => `Undefined global '${name}'`);
      }
    }
    return resolvedGlobal;
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
