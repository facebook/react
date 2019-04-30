// @flow

import LRU from 'lru-cache';
import { LOCAL_STORAGE_FILTER_PREFERENCES_KEY } from './constants';
import { ElementTypeHostComponent } from './types';

import type { FilterPreferences } from './types';

const FB_MODULE_RE = /^(.*) \[from (.*)\]$/;
const cachedDisplayNames: WeakMap<Function, string> = new WeakMap();

// On large trees, encoding takes significant time.
// Try to reuse the already encoded strings.
let encodedStringCache = new LRU({ max: 1000 });

export function getDisplayName(
  type: Function,
  fallbackName: string = 'Unknown'
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

  // Facebook-specific hack to turn "Image [from Image.react]" into just "Image".
  // We need displayName with module name for error reports but it clutters the DevTools.
  const match = displayName.match(FB_MODULE_RE);
  if (match) {
    const componentName = match[1];
    const moduleName = match[2];
    if (componentName && moduleName) {
      if (
        moduleName === componentName ||
        moduleName.startsWith(componentName + '.')
      ) {
        displayName = componentName;
      }
    }
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

export function getDefaultFilterPreferences(): FilterPreferences {
  return {
    hideElementsWithTypes: new Set([ElementTypeHostComponent]),
    hideElementsWithDisplayNames: new Set(),
    hideElementsWithPaths: new Set(),
  };
}

function getSavedFilterPreferencesFilter(key, value) {
  if (typeof value === 'string' && value.indexOf('__REGEXP__') === 0) {
    const match = value.substr(9).match(/\/(.*)\/(.*)?/);
    return new RegExp(match[1], match[2] || '');
  }
  return value;
}

export function getSavedFilterPreferences(): FilterPreferences {
  const raw = localStorage.getItem(LOCAL_STORAGE_FILTER_PREFERENCES_KEY);
  if (raw != null) {
    const json = JSON.parse(raw, getSavedFilterPreferencesFilter);
    return {
      hideElementsWithTypes: new Set(json.hideElementsWithTypes),
      hideElementsWithDisplayNames: new Set(
        json.hideElementsWithDisplayNames.map(source => new RegExp(source))
      ),
      hideElementsWithPaths: new Set(
        json.hideElementsWithPaths.map(source => new RegExp(source))
      ),
    };
  } else {
    return getDefaultFilterPreferences();
  }
}

function saveFilterPreferencesFilter(key, value) {
  if (value instanceof RegExp) {
    return '__REGEXP__' + value.toString();
  }
  return value;
}

export function saveFilterPreferences(
  filterPreferences: FilterPreferences
): void {
  localStorage.setItem(
    LOCAL_STORAGE_FILTER_PREFERENCES_KEY,
    JSON.stringify(
      {
        hideElementsWithTypes: Array.from(
          filterPreferences.hideElementsWithTypes
        ),
        hideElementsWithDisplayNames: Array.from(
          filterPreferences.hideElementsWithDisplayNames
        ),
        hideElementsWithPaths: Array.from(
          filterPreferences.hideElementsWithPaths
        ),
      },
      saveFilterPreferencesFilter
    )
  );
}
