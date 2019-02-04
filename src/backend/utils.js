// @flow

import { isElement } from 'react-is';
import { dehydrate } from '../hydration';

import type { DehydratedData } from 'src/devtools/types';

const FB_MODULE_RE = /^(.*) \[from (.*)\]$/;
const cachedDisplayNames: WeakMap<Function, string> = new WeakMap();

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

export function cleanForBridge(data: Object | null): DehydratedData | null {
  if (data !== null) {
    const cleaned = [];

    return {
      data: dehydrate(data, cleaned),
      cleaned,
    };
  } else {
    return null;
  }
}

export function cleanPropsForBridge(props: Object): DehydratedData | null {
  if (props !== null) {
    const dehydratedData = cleanForBridge(props);
    if (dehydratedData !== null) {
      // For now, let's just filter children that are React elements.
      const { children } = props;
      if (children != null) {
        if (isElement(children)) {
          delete dehydratedData.data.children;
        } else if (Array.isArray(children)) {
          dehydratedData.data.children = children.filter(
            child => !isElement(child)
          );
        }
      }

      return dehydratedData;
    }
  }

  return null;
}
