// @flow

import LRU from 'lru-cache';
import { LOCAL_STORAGE_FILTER_PREFERENCES_KEY } from './constants';
import { ComponentFilterElementType, ElementTypeHostComponent } from './types';
import {
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
} from 'src/types';
import { localStorageGetItem, localStorageSetItem } from './storage';

import type { ComponentFilter, ElementType } from './types';

const cachedDisplayNames: WeakMap<Function, string> = new WeakMap();

// On large trees, encoding takes significant time.
// Try to reuse the already encoded strings.
let encodedStringCache = new LRU({ max: 1000 });

export function getDisplayName(
  type: Function,
  fallbackName: string = 'Anonymous'
): string {
  const nameFromCache = cachedDisplayNames.get(type);
  if (nameFromCache != null) {
    return nameFromCache;
  }

  let displayName;

  // The displayName property is not guaranteed to be a string.
  // It's only safe to use for our purposes if it's a string.
  // github.com/facebook/react-devtools/issues/803
  if (typeof type.displayName === 'string') {
    displayName = type.displayName;
  }

  if (!displayName) {
    displayName = type.name || fallbackName;
  }

  cachedDisplayNames.set(type, displayName);
  return displayName;
}

let uidCounter: number = 0;

export function getUID(): number {
  return ++uidCounter;
}

export function utfDecodeString(array: Uint32Array): string {
  return String.fromCodePoint(...array);
}

export function utfEncodeString(string: string): Uint32Array {
  let cached = encodedStringCache.get(string);
  if (cached !== undefined) {
    return cached;
  }

  // $FlowFixMe Flow's Uint32Array.from's type definition is wrong; first argument of mapFn will be string
  const encoded = Uint32Array.from(string, toCodePoint);
  encodedStringCache.set(string, encoded);
  return encoded;
}

function toCodePoint(string: string) {
  return string.codePointAt(0);
}

export function getDefaultComponentFilters(): Array<ComponentFilter> {
  return [
    {
      type: ComponentFilterElementType,
      value: ElementTypeHostComponent,
      isEnabled: true,
    },
  ];
}

export function getSavedComponentFilters(): Array<ComponentFilter> {
  try {
    const raw = localStorageGetItem(LOCAL_STORAGE_FILTER_PREFERENCES_KEY);
    if (raw != null) {
      return JSON.parse(raw);
    }
  } catch (error) {}
  return getDefaultComponentFilters();
}

export function saveComponentFilters(
  componentFilters: Array<ComponentFilter>
): void {
  localStorageSetItem(
    LOCAL_STORAGE_FILTER_PREFERENCES_KEY,
    JSON.stringify(componentFilters)
  );
}

export function separateDisplayNameAndHOCs(
  displayName: string | null,
  type: ElementType
): [string | null, Array<string> | null] {
  if (displayName === null) {
    return [null, null];
  }

  let hocDisplayNames = null;

  switch (type) {
    case ElementTypeClass:
    case ElementTypeForwardRef:
    case ElementTypeFunction:
    case ElementTypeMemo:
      if (displayName.indexOf('(') >= 0) {
        const matches = displayName.match(/[^()]+/g);
        if (matches !== null) {
          displayName = matches.pop();
          hocDisplayNames = matches;
        }
      }
      break;
    default:
      break;
  }

  return [displayName, hocDisplayNames];
}
