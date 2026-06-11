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

export type TraceRenderSessionOptions = {
  maxVariants?: number;
};

export type TraceSelector<TInput, TValue = unknown> = {
  key: string;
  read: (input: TInput) => TValue;
  isEqual?: TraceEqualityFn<TValue>;
};

type InternalDerivedTraceSelector<TInput, TValue> = TraceSelector<
  TInput,
  TValue
> & {
  __traceDerivedDeps?: Array<TraceSelector<TInput, unknown>>;
  __traceDerive?: (...values: Array<unknown>) => TValue;
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
  selectorCacheHits: number;
  selectorReads: number;
  variantEvictions: number;
  variantRestores: number;
};

export type TraceUpdateMode = 'invalidate' | 'record' | 'replay' | 'restore';

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
  getRecordedVariantCount(): number;
  reset(): void;
  stats(): TraceTapeStats;
  update(input: TInput): TraceUpdateResult;
};

type InternalTraceVariant<TInput> = {
  guards: Array<InternalTraceGuard<TInput>>;
  id: number;
  lastUsedAt: number;
  operations: Array<InternalTraceOperation<TInput>>;
};

type InternalTraceVariantNode<TInput> = {
  branches: Array<{
    child: InternalTraceVariantNode<TInput>;
    value: unknown;
  }>;
  selector: TraceSelector<TInput, unknown> | null;
  variant: InternalTraceVariant<TInput> | null;
};

const emptyStats = (): TraceTapeStats => ({
  fullRenders: 0,
  guardInvalidations: 0,
  patchMutations: 0,
  patchRecomputations: 0,
  selectorCacheHits: 0,
  selectorReads: 0,
  variantEvictions: 0,
  variantRestores: 0,
});

function createVariantNode<TInput>(): InternalTraceVariantNode<TInput> {
  return {
    branches: [],
    selector: null,
    variant: null,
  };
}

function isEqualValue<T>(
  prev: T,
  next: T,
  isEqual?: TraceEqualityFn<T>,
): boolean {
  return isEqual == null ? Object.is(prev, next) : isEqual(prev, next);
}

type InternalSelectorCache<TInput> = Map<
  TraceSelector<TInput, unknown>,
  unknown
>;

function getSelectorValue<TInput, TValue>(
  selector: TraceSelector<TInput, TValue>,
  input: TInput,
  selectorCache: InternalSelectorCache<TInput>,
  stats: TraceTapeStats,
): TValue {
  if (selectorCache.has(selector)) {
    stats.selectorCacheHits++;
    return selectorCache.get(selector) as TValue;
  }

  const derivedSelector = selector as InternalDerivedTraceSelector<TInput, TValue>;
  const value =
    derivedSelector.__traceDerivedDeps != null &&
    derivedSelector.__traceDerive != null
      ? derivedSelector.__traceDerive(
          ...readDependencyValues(
            derivedSelector.__traceDerivedDeps,
            input,
            selectorCache,
            stats,
          ),
        )
      : (stats.selectorReads++, selector.read(input));
  if (derivedSelector.__traceDerivedDeps != null) {
    stats.selectorReads++;
  }
  selectorCache.set(selector as TraceSelector<TInput, unknown>, value);
  return value;
}

function readDependencyValues<TInput>(
  deps: Array<TraceSelector<TInput, unknown>>,
  input: TInput,
  selectorCache: InternalSelectorCache<TInput>,
  stats: TraceTapeStats,
): Array<unknown> {
  return deps.map(dep => getSelectorValue(dep, input, selectorCache, stats));
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

export function createDerivedTraceSelector<TInput, TValue>(
  key: string,
  deps: Array<TraceSelector<TInput, unknown>>,
  derive: (...values: Array<unknown>) => TValue,
  isEqual?: TraceEqualityFn<TValue>,
): TraceSelector<TInput, TValue> {
  const selector = createTraceSelector(
    key,
    input => derive(...deps.map(dep => dep.read(input))),
    isEqual,
  ) as InternalDerivedTraceSelector<TInput, TValue>;
  selector.__traceDerivedDeps = deps;
  selector.__traceDerive = derive;
  return selector;
}

function getOperationKey<TInput>(
  operation: InternalTraceOperation<TInput>,
): string {
  return `${operation.kind}:${operation.name ?? ''}:${String(operation.slot)}`;
}

function rebuildVariantTree<TInput>(
  variants: Map<number, InternalTraceVariant<TInput>>,
): InternalTraceVariantNode<TInput> {
  const root = createVariantNode<TInput>();

  for (const variant of variants.values()) {
    let node = root;

    if (variant.guards.length === 0) {
      node.variant = variant;
      continue;
    }

    for (const guard of variant.guards) {
      if (node.selector == null) {
        node.selector = guard.selector;
      } else if (node.selector.key !== guard.selector.key) {
        node.selector = guard.selector;
        node.branches = [];
      }

      let branch = node.branches.find(candidate =>
        isEqualValue(candidate.value, guard.value, guard.selector.isEqual),
      );
      if (branch == null) {
        branch = {
          child: createVariantNode<TInput>(),
          value: guard.value,
        };
        node.branches.push(branch);
      }
      node = branch.child;
    }

    node.variant = variant;
  }

  return root;
}

function findRecordedVariant<TInput>(
  root: InternalTraceVariantNode<TInput>,
  input: TInput,
  selectorCache: InternalSelectorCache<TInput>,
  stats: TraceTapeStats,
): InternalTraceVariant<TInput> | null {
  let node = root;

  while (node.selector != null) {
    const selector = node.selector;
    const value = getSelectorValue(selector, input, selectorCache, stats);
    const branch = node.branches.find(candidate =>
      isEqualValue(candidate.value, value, selector.isEqual),
    );
    if (branch == null) {
      return null;
    }
    node = branch.child;
  }

  return node.variant;
}

function syncGuardValues<TInput>(
  variant: InternalTraceVariant<TInput>,
  input: TInput,
  selectorCache: InternalSelectorCache<TInput>,
  stats: TraceTapeStats,
): void {
  for (const guard of variant.guards) {
    guard.value = getSelectorValue(guard.selector, input, selectorCache, stats);
  }
}

export function createRenderTraceSession<TInput>(
  render: (recorder: TraceRecorder<TInput>, input: TInput) => void,
  options?: TraceRenderSessionOptions,
): RenderTraceSession<TInput> {
  const maxVariants = Number.isFinite(options?.maxVariants)
    ? Math.max(1, options?.maxVariants ?? 1)
    : Infinity;
  let activeVariant: InternalTraceVariant<TInput> | null = null;
  let stats = emptyStats();
  let variantClock = 0;
  let variantId = 0;
  let variants = new Map<number, InternalTraceVariant<TInput>>();
  let variantTree = createVariantNode<TInput>();

  function touchVariant(variant: InternalTraceVariant<TInput>): void {
    variant.lastUsedAt = ++variantClock;
  }

  function enforceVariantLimit(): void {
    if (!Number.isFinite(maxVariants)) {
      return;
    }

    while (variants.size > maxVariants) {
      let evictionCandidate: InternalTraceVariant<TInput> | null = null;
      for (const candidate of variants.values()) {
        if (candidate.id === activeVariant?.id) {
          continue;
        }
        if (
          evictionCandidate == null ||
          candidate.lastUsedAt < evictionCandidate.lastUsedAt
        ) {
          evictionCandidate = candidate;
        }
      }

      if (evictionCandidate == null) {
        break;
      }

      variants.delete(evictionCandidate.id);
      stats.variantEvictions++;
    }
  }

  function reconcileVariant(
    input: TInput,
    nextVariant: InternalTraceVariant<TInput>,
    mode: 'replay' | 'restore',
    invalidatedBy: string | null,
    selectorCache: InternalSelectorCache<TInput>,
  ): TraceUpdateResult {
    const previousVariant = activeVariant;
    const previousOperations =
      previousVariant != null && previousVariant !== nextVariant
        ? new Map(
            previousVariant.operations.map(operation => [
              getOperationKey(operation),
              operation,
            ]),
          )
        : null;
    const seenOperationKeys = new Set<string>();
    const mutations: Array<TraceMutation> = [];

    for (const operation of nextVariant.operations) {
      const operationKey = getOperationKey(operation);
      const previousOperation = previousOperations?.get(operationKey) ?? null;
      const previousValue =
        previousOperation?.value ??
        (previousVariant === nextVariant ? operation.value : undefined);
      const existedBefore =
        previousVariant === nextVariant || previousOperation != null;
      const nextDepValues = readDependencyValues(
        operation.deps,
        input,
        selectorCache,
        stats,
      );
      let isDirty = false;

      seenOperationKeys.add(operationKey);
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
      if (isDirty) {
        stats.patchRecomputations++;
        operation.value = operation.compute(input);
      }

      if (!existedBefore) {
        stats.patchMutations++;
        mutations.push({
          kind: operation.kind,
          name: operation.name,
          previousValue: undefined,
          slot: operation.slot,
          value: operation.value,
        });
        continue;
      }

      if (isEqualValue(previousValue, operation.value, operation.isEqual)) {
        continue;
      }

      stats.patchMutations++;
      mutations.push({
        kind: operation.kind,
        name: operation.name,
        previousValue,
        slot: operation.slot,
        value: operation.value,
      });
    }

    if (previousVariant != null && previousVariant !== nextVariant) {
      for (const operation of previousVariant.operations) {
        const operationKey = getOperationKey(operation);
        if (seenOperationKeys.has(operationKey)) {
          continue;
        }
        stats.patchMutations++;
        mutations.push({
          kind: operation.kind,
          name: operation.name,
          previousValue: operation.value,
          slot: operation.slot,
          value: undefined,
        });
      }
    }

    syncGuardValues(nextVariant, input, selectorCache, stats);
    touchVariant(nextVariant);
    activeVariant = nextVariant;

    return {
      invalidatedBy,
      mode,
      mutations,
      stats: {...stats},
    };
  }

  function record(
    input: TInput,
    mode: 'invalidate' | 'record',
    invalidatedBy: string | null,
  ): TraceUpdateResult {
    const selectorCache = new Map<
      TraceSelector<TInput, unknown>,
      unknown
    >();
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
        depValues: readDependencyValues(deps, input, selectorCache, stats),
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
        const value = getSelectorValue(selector, input, selectorCache, stats);
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

    const nextVariant: InternalTraceVariant<TInput> = {
      guards: nextGuards,
      id: variantId++,
      lastUsedAt: 0,
      operations: nextOperations,
    };
    activeVariant = nextVariant;
    touchVariant(nextVariant);
    variants.set(nextVariant.id, nextVariant);
    enforceVariantLimit();
    variantTree = rebuildVariantTree(variants);

    return {
      invalidatedBy,
      mode,
      mutations,
      stats: {...stats},
    };
  }

  return {
    getRecordedOperationCount() {
      return activeVariant?.operations.length ?? 0;
    },

    getRecordedVariantCount() {
      return variants.size;
    },

    reset() {
      activeVariant = null;
      stats = emptyStats();
      variants = new Map();
      variantTree = createVariantNode<TInput>();
      variantClock = 0;
    },

    stats() {
      return {...stats};
    },

    update(input) {
      const selectorCache = new Map<
        TraceSelector<TInput, unknown>,
        unknown
      >();
      if (activeVariant === null) {
        return record(input, 'record', null);
      }

      for (const guard of activeVariant.guards) {
        const nextValue = getSelectorValue(
          guard.selector,
          input,
          selectorCache,
          stats,
        );
        if (!isEqualValue(guard.value, nextValue, guard.selector.isEqual)) {
          stats.guardInvalidations++;
          const cachedVariant = findRecordedVariant(
            variantTree,
            input,
            selectorCache,
            stats,
          );
          if (cachedVariant != null) {
            stats.variantRestores++;
            return reconcileVariant(
              input,
              cachedVariant,
              'restore',
              guard.selector.key,
              selectorCache,
            );
          }
          return record(input, 'invalidate', guard.selector.key);
        }
      }

      return reconcileVariant(input, activeVariant, 'replay', null, selectorCache);
    },
  };
}
