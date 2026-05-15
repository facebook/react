import * as React from 'react';

export type StructuredStateAction<T> = T | ((prev: T) => T);

export type StructuredStateSetter<T> = (
  action: StructuredStateAction<T>,
) => void;

export type StructuredHookContext = {
  memo<T>(key: string, deps: Array<unknown>, compute: () => T): T;
  state<T>(
    key: string,
    initialState: T | (() => T),
  ): [T, StructuredStateSetter<T>];
};

export type StructuredHookSession<TInput, TOutput> = {
  getActiveKeys(): Array<string>;
  getStoredKeys(): Array<string>;
  reset(): void;
  update(input: TInput): TOutput;
};

type StructuredHookStore = {
  activeKeys: Set<string>;
  cells: Map<string, StructuredHookCell>;
  scheduleUpdate: null | (() => void);
};

type StructuredStateCell = {
  kind: 'state';
  value: unknown;
};

type StructuredMemoCell = {
  deps: Array<unknown>;
  kind: 'memo';
  value: unknown;
};

type StructuredHookCell = StructuredStateCell | StructuredMemoCell;

function sortKeys(keys: Iterable<string>): Array<string> {
  return Array.from(keys).sort();
}

function areDepsEqual(prev: Array<unknown>, next: Array<unknown>): boolean {
  if (prev.length !== next.length) {
    return false;
  }
  for (let index = 0; index < prev.length; index++) {
    if (!Object.is(prev[index], next[index])) {
      return false;
    }
  }
  return true;
}

function resolveInitialState<T>(initialState: T | (() => T)): T {
  return typeof initialState === 'function'
    ? (initialState as () => T)()
    : initialState;
}

function createStore(scheduleUpdate: null | (() => void)): StructuredHookStore {
  return {
    activeKeys: new Set(),
    cells: new Map(),
    scheduleUpdate,
  };
}

function markKeyVisited(
  key: string,
  activeKeys: Set<string>,
  visitedKeys: Set<string>,
): void {
  if (visitedKeys.has(key)) {
    throw new Error(
      `Structured hook key "${key}" was used more than once in the same render.`,
    );
  }
  visitedKeys.add(key);
  activeKeys.add(key);
}

function getCell<T extends StructuredHookCell['kind']>(
  cells: Map<string, StructuredHookCell>,
  key: string,
  kind: T,
): Extract<StructuredHookCell, {kind: T}> | null {
  const cell = cells.get(key);
  if (cell == null) {
    return null;
  }
  if (cell.kind !== kind) {
    throw new Error(
      `Structured hook key "${key}" changed hook kind from ${cell.kind} to ${kind}.`,
    );
  }
  return cell as Extract<StructuredHookCell, {kind: T}>;
}

function createHookContext(
  store: StructuredHookStore,
  nextActiveKeys: Set<string>,
  visitedKeys: Set<string>,
): StructuredHookContext {
  return {
    memo(key, deps, compute) {
      markKeyVisited(key, nextActiveKeys, visitedKeys);

      const existingCell = getCell(store.cells, key, 'memo');
      if (existingCell == null) {
        const value = compute();
        store.cells.set(key, {
          deps: [...deps],
          kind: 'memo',
          value,
        });
        return value;
      }

      if (!areDepsEqual(existingCell.deps, deps)) {
        existingCell.deps = [...deps];
        existingCell.value = compute();
      }

      return existingCell.value as any;
    },

    state(key, initialState) {
      markKeyVisited(key, nextActiveKeys, visitedKeys);

      let cell = getCell(store.cells, key, 'state');
      if (cell == null) {
        cell = {
          kind: 'state',
          value: resolveInitialState(initialState),
        };
        store.cells.set(key, cell);
      }

      const setState: StructuredStateSetter<any> = action => {
        const prevValue = cell.value;
        const nextValue =
          typeof action === 'function'
            ? (action as (prev: unknown) => unknown)(prevValue)
            : action;
        if (Object.is(prevValue, nextValue)) {
          return;
        }
        cell.value = nextValue;
        store.scheduleUpdate?.();
      };

      return [cell.value as any, setState];
    },
  };
}

function runStructuredRender<TOutput>(
  store: StructuredHookStore,
  render: (hooks: StructuredHookContext) => TOutput,
): TOutput {
  const nextActiveKeys = new Set<string>();
  const visitedKeys = new Set<string>();
  const output = render(createHookContext(store, nextActiveKeys, visitedKeys));
  store.activeKeys = nextActiveKeys;
  return output;
}

export function useStructuredHooks<TOutput>(
  render: (hooks: StructuredHookContext) => TOutput,
): TOutput {
  const [, scheduleUpdate] = React.useReducer((version: number) => version + 1, 0);
  const storeRef = React.useRef<StructuredHookStore | null>(null);

  if (storeRef.current == null) {
    storeRef.current = createStore(null);
  }

  React.useEffect(() => {
    const store = storeRef.current;
    if (store == null) {
      return;
    }
    store.scheduleUpdate = () => {
      scheduleUpdate();
    };
    return () => {
      store.scheduleUpdate = null;
    };
  }, [scheduleUpdate]);

  return runStructuredRender(storeRef.current, render);
}

export function createStructuredHookSession<TInput, TOutput>(
  render: (hooks: StructuredHookContext, input: TInput) => TOutput,
): StructuredHookSession<TInput, TOutput> {
  const store = createStore(null);

  return {
    getActiveKeys() {
      return sortKeys(store.activeKeys);
    },

    getStoredKeys() {
      return sortKeys(store.cells.keys());
    },

    reset() {
      store.cells.clear();
      store.activeKeys = new Set();
    },

    update(input) {
      return runStructuredRender(store, hooks => render(hooks, input));
    },
  };
}