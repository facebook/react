// @flow

import {createContext, useLayoutEffect, useRef, useState} from 'react';

import type {Element} from '../types';
import Store from '../store';

export function useElement(store: Store, id: string): Element {
  const [element, setElement] = useState<Element>(((store.getElement(id): any): Element));

  useLayoutEffect(() => {
    const handler = () => setElement(((store.getElement(id): any): Element));
    store.addListener(id, handler);
    return () => store.removeListener(id, handler);
  }, [store, id]);

  return element;
}

export function useRoots(store: Store): Array<string> {
  const [roots, setRoots] = useState<Array<string>>(Array.from(store.roots));

  useLayoutEffect(() => {
    const handler = () => setRoots(Array.from(store.roots));
    store.addListener('roots', handler);
    return () => store.removeListener('roots', handler);
  }, [store]);

  return roots;
}