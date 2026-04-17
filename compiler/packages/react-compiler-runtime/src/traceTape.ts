/**
 * Experimental research surface for trace-based render replay.
 *
 * The goal is to model a render as a recorded tape of:
 * - branch guards
 * - dependency selectors
 * - patch operations
 *
 * Stable-path updates can then replay only the invalidated operations instead
 * of re-running the entire render callback, until a guard invalidates and a new
 * tape must be recorded.
 */
export type TraceEqualityFn<T> = (prev: T, next: T) => boolean;

export type TraceSelector<TInput, TValue = unknown> = {
  key: string;
  read: (input: TInput) => TValue;
  isEqual?: TraceEqualityFn<TValue>;
};

export type TraceSlot = number | string;

export type TraceMutation = {
  kind: string;
  name: string | null;
  previousValue: unknown;
  slot: TraceSlot;
  value: unknown;
};

export type TraceTapeStats = {
  fullRenders: number;
  guardInvalidations: number;
  patchMutations: number;
  patchRecomputations: number;
};

export type TraceUpdateMode = 'invalidate' | 'record' | 'replay';

export type TraceUpdateResult = {
  invalidatedBy: string | null;
  mode: TraceUpdateMode;
  mutations: Array<TraceMutation>;
  stats: TraceTapeStats;
};

type TraceOperationOptions<TValue> = {
  isEqual?: TraceEqualityFn<TValue>;
  name?: string | null;
};

type InternalTraceGuard<TInput> = {
  selector: TraceSelector<TInput, unknown>;
  value: unknown;
};

type InternalTraceOperation<TInput> = {
  compute: (input: TInput) => unknown;
  depValues: Array<unknown>;
  deps: Array<TraceSelector<TInput, unknown>>;
  isEqual?: TraceEqualityFn<unknown>;
  kind: string;
  name: string | null;
  slot: TraceSlot;
  value: unknown;
};

export type TraceRecorder<TInput> = {
  attr<TValue>(
    slot: TraceSlot,
    name: string,
    deps: Array<TraceSelector<TInput, unknown>>,
    compute: (input: TInput) => TValue,
    isEqual?: TraceEqualityFn<TValue>,
  ): TValue;
  custom<TValue>(
    kind: string,
    slot: TraceSlot,
    deps: Array<TraceSelector<TInput, unknown>>,
    compute: (input: TInput) => TValue,
    options?: TraceOperationOptions<TValue>,
  ): TValue;
  guard<TValue>(selector: TraceSelector<TInput, TValue>): TValue;
  text<TValue>(
    slot: TraceSlot,
    deps: Array<TraceSelector<TInput, unknown>>,
    compute: (input: TInput) => TValue,
    isEqual?: TraceEqualityFn<TValue>,
  ): TValue;
};

export type RenderTraceSession<TInput> = {
  getRecordedOperationCount(): number;
  reset(): void;
  stats(): TraceTapeStats;
  update(input: TInput): TraceUpdateResult;
};

const emptyStats = (): TraceTapeStats => ({
  fullRenders: 0,
  guardInvalidations: 0,
  patchMutations: 0,
  patchRecomputations: 0,
});

function isEqualValue<T>(
  prev: T,
  next: T,
  isEqual?: TraceEqualityFn<T>,
): boolean {
  return isEqual == null ? Object.is(prev, next) : isEqual(prev, next);
}

function readDependencyValues<TInput>(
  deps: Array<TraceSelector<TInput, unknown>>,
  input: TInput,
): Array<unknown> {
  return deps.map(dep => dep.read(input));
}

export function createTraceSelector<TInput, TValue>(
  key: string,
  read: (input: TInput) => TValue,
  isEqual?: TraceEqualityFn<TValue>,
): TraceSelector<TInput, TValue> {
  return {
    key,
    read,
    isEqual,
  };
}

export function createRenderTraceSession<TInput>(
  render: (recorder: TraceRecorder<TInput>, input: TInput) => void,
): RenderTraceSession<TInput> {
  let guards: Array<InternalTraceGuard<TInput>> | null = null;
  let operations: Array<InternalTraceOperation<TInput>> = [];
  let stats = emptyStats();

  function record(
    input: TInput,
    mode: 'invalidate' | 'record',
    invalidatedBy: string | null,
  ): TraceUpdateResult {
    const nextGuards: Array<InternalTraceGuard<TInput>> = [];
    const nextOperations: Array<InternalTraceOperation<TInput>> = [];
    const mutations: Array<TraceMutation> = [];

    function recordOperation<TValue>(
      kind: string,
      slot: TraceSlot,
      deps: Array<TraceSelector<TInput, unknown>>,
      compute: (value: TInput) => TValue,
      options?: TraceOperationOptions<TValue>,
    ): TValue {
      const value = compute(input);
      nextOperations.push({
        compute: compute as (value: TInput) => unknown,
        depValues: readDependencyValues(deps, input),
        deps,
        isEqual: options?.isEqual as TraceEqualityFn<unknown> | undefined,
        kind,
        name: options?.name ?? null,
        slot,
        value,
      });
      mutations.push({
        kind,
        name: options?.name ?? null,
        previousValue: undefined,
        slot,
        value,
      });
      return value;
    }

    const recorder: TraceRecorder<TInput> = {
      attr(slot, name, deps, compute, isEqual) {
        return recordOperation('attr', slot, deps, compute, {isEqual, name});
      },
      custom(kind, slot, deps, compute, options) {
        return recordOperation(kind, slot, deps, compute, options);
      },
      guard(selector) {
        const value = selector.read(input);
        nextGuards.push({
          selector: selector as TraceSelector<TInput, unknown>,
          value,
        });
        return value;
      },
      text(slot, deps, compute, isEqual) {
        return recordOperation('text', slot, deps, compute, {isEqual});
      },
    };

    stats.fullRenders++;
    render(recorder, input);
    guards = nextGuards;
    operations = nextOperations;

    return {
      invalidatedBy,
      mode,
      mutations,
      stats: {...stats},
    };
  }

  return {
    getRecordedOperationCount() {
      return operations.length;
    },

    reset() {
      guards = null;
      operations = [];
      stats = emptyStats();
    },

    stats() {
      return {...stats};
    },

    update(input) {
      if (guards === null) {
        return record(input, 'record', null);
      }

      for (const guard of guards) {
        const nextValue = guard.selector.read(input);
        const isGuardEqual = isEqualValue(
          guard.value,
          nextValue,
          guard.selector.isEqual,
        );
        guard.value = nextValue;
        if (!isGuardEqual) {
          stats.guardInvalidations++;
          return record(input, 'invalidate', guard.selector.key);
        }
      }

      const mutations: Array<TraceMutation> = [];

      for (const operation of operations) {
        const nextDepValues = readDependencyValues(operation.deps, input);
        let isDirty = false;

        for (let index = 0; index < nextDepValues.length; index++) {
          if (
            !isEqualValue(
              operation.depValues[index],
              nextDepValues[index],
              operation.deps[index]?.isEqual,
            )
          ) {
            isDirty = true;
            break;
          }
        }

        operation.depValues = nextDepValues;
        if (!isDirty) {
          continue;
        }

        stats.patchRecomputations++;
        const previousValue = operation.value;
        const nextValue = operation.compute(input);
        operation.value = nextValue;

        if (isEqualValue(previousValue, nextValue, operation.isEqual)) {
          continue;
        }

        stats.patchMutations++;
        mutations.push({
          kind: operation.kind,
          name: operation.name,
          previousValue,
          slot: operation.slot,
          value: nextValue,
        });
      }

      return {
        invalidatedBy: null,
        mode: 'replay',
        mutations,
        stats: {...stats},
      };
    },
  };
}
