"use strict";

type ROViolationType =
  | "FORGET_MUTATE_IMMUT"
  | "FORGET_DELETE_PROP_IMMUT"
  | "FORGET_CHANGE_PROP_IMMUT"
  | "FORGET_ADD_PROP_IMMUT";
type ROModeChecker = () => boolean;
type ROViolationLogger = (
  violation: ROViolationType,
  key: string,
  value?: any
) => void;

/**
 * Represents a "proxy" of a read-only object property
 *   savedVal: underlying "source of truth" for a property value
 *   getter: hack, this lets us check whether we have already saved this property
 * */
type SavedEntry = {
  savedVal: unknown;
  getter: () => unknown;
};
type SavedROObject = Map<string, SavedEntry>;
type SavedROObjects = WeakMap<Object, SavedROObject>;

// Utility functions
function isWriteable(desc: PropertyDescriptor) {
  return (desc.writable || desc.set) && desc.configurable;
}

function getOrInsertDefault(
  m: SavedROObjects,
  k: object
): { existed: boolean; entry: SavedROObject } {
  const entry = m.get(k);
  if (entry) {
    return { existed: true, entry };
  } else {
    const newEntry: SavedROObject = new Map();
    m.set(k, newEntry);
    return { existed: false, entry: newEntry };
  }
}

function buildMakeReadOnly(
  logger: ROViolationLogger,
  skippedClasses: string[],
  isInROMode: ROModeChecker
): <T>(val: T) => T {
  // All saved proxys
  const savedROObjects: SavedROObjects = new WeakMap();

  // Overwrites an object property with its proxy and saves its original value
  function addProperty(
    obj: Object,
    key: string,
    prop: PropertyDescriptor,
    savedEntries: Map<string, SavedEntry>
  ) {
    const proxy: PropertyDescriptor & { get(): unknown } = {
      get() {
        // read from backing cache entry
        return makeReadOnly(savedEntries.get(key)!.savedVal);
      },
      set(newVal: unknown) {
        if (isInROMode()) {
          logger("FORGET_MUTATE_IMMUT", key, newVal);
        }
        // update backing cache entry
        savedEntries.get(key)!.savedVal = newVal;
      },
    };
    if (prop.configurable != null) {
      proxy.configurable = prop.configurable;
    }
    if (prop.enumerable != null) {
      proxy.enumerable = prop.enumerable;
    }

    savedEntries.set(key, { savedVal: (obj as any)[key], getter: proxy.get });
    Object.defineProperty(obj, key, proxy);
  }

  // Changes an object to be read-only, returns its input
  function makeReadOnly<T>(o: T): T {
    if (typeof o !== "object" || o == null) {
      return o;
    } else if (skippedClasses.includes(o.constructor.name)) {
      return o;
    }

    const { existed, entry: cache } = getOrInsertDefault(savedROObjects, o);

    for (const [k, entry] of cache.entries()) {
      const currentProp = Object.getOwnPropertyDescriptor(o, k);
      if (currentProp && !isWriteable(currentProp)) {
        continue;
      }
      const currentPropGetter = currentProp?.get;
      const cachedGetter = entry.getter;

      if (currentPropGetter !== cachedGetter) {
        // cache is currently holding an old property
        //  - it may have been deleted
        //  - it may have been deleted + re-set
        //    (meaning that new value is not proxied,
        //     and the current proxied value is stale)
        cache.delete(k);
        if (!currentProp && isInROMode()) {
          logger("FORGET_DELETE_PROP_IMMUT", k);
        } else if (currentProp) {
          if (isInROMode()) {
            logger("FORGET_CHANGE_PROP_IMMUT", k);
          }
          addProperty(o, k, currentProp, cache);
        }
      }
    }
    for (const [k, prop] of Object.entries(
      Object.getOwnPropertyDescriptors(o)
    )) {
      if (!cache.has(k) && isWriteable(prop)) {
        if (isInROMode() && existed) {
          logger("FORGET_ADD_PROP_IMMUT", k);
        }
        addProperty(o, k, prop, cache);
      }
    }
    return o;
  }

  return makeReadOnly;
}

export default buildMakeReadOnly;
