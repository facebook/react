// @flow

import { useLayoutEffect, useState } from 'react';

import type { Element } from '../types';
import Store from '../store';

// TODO useEffect has a bug where sometimes subscriptions don't get cleaned up correctly.
// Potentially related to github.com/facebookincubator/redux-react-hook/issues/17
// As a temporary work around, switch back to layout effect.

export function useElement(store: Store, id: number): ?Element {
  const [element, setElement] = useState<?Element>(store.getElementByID(id));

  useLayoutEffect(() => {
    const handler = () =>
      setElement(((store.getElementByID(id): any): Element));

    // Listen for changes to the element.
    store.addListener((id: any), handler);

    // Check for changes that may have happened between render and mount.
    const newElement = store.getElementByID(id);
    if (element !== newElement) {
      setElement(newElement);
    }

    // Remove event listener on unmount.
    return () => store.removeListener((id: any), handler);
  }, [store, id]);

  return element;
}

export function useRoots(store: Store): $ReadOnlyArray<number> {
  const [roots, setRoots] = useState<$ReadOnlyArray<number>>(store.roots);

  useLayoutEffect(() => {
    const handler = () => setRoots(store.roots);

    // Listen for changes to roots.
    store.addListener('roots', handler);

    // Check for changes that may have happened between render and mount.
    const newRoots = store.roots;
    if (roots !== newRoots) {
      setRoots(newRoots);
    }

    // Remove event listener on unmount.
    return () => store.removeListener('roots', handler);
  }, [store]);

  return roots;
}
