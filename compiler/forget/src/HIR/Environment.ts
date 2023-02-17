import { log } from "../Utils/logger";
import { DEFAULT_GLOBALS, Global } from "./Globals";
import { Effect, IdentifierId, makeIdentifierId, ValueKind } from "./HIR";
import { BUILTIN_HOOKS, Hook } from "./Hooks";

const HOOK_PATTERN = /^_?use/;

export type EnvironmentOptions = {
  customHooks: Map<string, Hook>;
  globals: Set<string>;
};

const DEFAULT_OPTIONS: EnvironmentOptions = {
  customHooks: new Map(),
  globals: DEFAULT_GLOBALS,
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
}
