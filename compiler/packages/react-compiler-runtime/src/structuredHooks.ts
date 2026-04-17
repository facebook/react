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

export function createStructuredHookSession<TInput, TOutput>(
  render: (hooks: StructuredHookContext, input: TInput) => TOutput,
): StructuredHookSession<TInput, TOutput> {
  const cells = new Map<string, StructuredHookCell>();
  let activeKeys = new Set<string>();

  return {
    getActiveKeys() {
      return sortKeys(activeKeys);
    },

    getStoredKeys() {
      return sortKeys(cells.keys());
    },

    reset() {
      cells.clear();
      activeKeys = new Set();
    },

    update(input) {
      const nextActiveKeys = new Set<string>();
      const visitedKeys = new Set<string>();

      const hooks: StructuredHookContext = {
        memo(key, deps, compute) {
          markKeyVisited(key, nextActiveKeys, visitedKeys);

          const existingCell = getCell(cells, key, 'memo');
          if (existingCell == null) {
            const value = compute();
            cells.set(key, {
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

          return existingCell.value as T;
        },

        state(key, initialState) {
          markKeyVisited(key, nextActiveKeys, visitedKeys);

          let cell = getCell(cells, key, 'state');
          if (cell == null) {
            cell = {
              kind: 'state',
              value: resolveInitialState(initialState),
            };
            cells.set(key, cell);
          }

          const setState: StructuredStateSetter<T> = action => {
            const prevValue = cell.value as T;
            cell.value =
              typeof action === 'function'
                ? (action as (prev: T) => T)(prevValue)
                : action;
          };

          return [cell.value as T, setState];
        },
      };

      const output = render(hooks, input);
      activeKeys = nextActiveKeys;
      return output;
    },
  };
}