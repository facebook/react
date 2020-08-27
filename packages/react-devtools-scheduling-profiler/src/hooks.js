/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useCallback, useEffect, useLayoutEffect, useState} from 'react';
import {localStorageGetItem, localStorageSetItem} from './utils/storage';

export type BrowserTheme = 'dark' | 'light';

// Forked from https://usehooks.com/useLocalStorage/
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
): [T, (value: T | (() => T)) => void] {
  const getValueFromLocalStorage = useCallback(() => {
    try {
      const item = localStorageGetItem(key);
      if (item != null) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.log(error);
    }
    if (typeof initialValue === 'function') {
      return ((initialValue: any): () => T)();
    } else {
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<any>(getValueFromLocalStorage);

  const setValue = useCallback(
    value => {
      try {
        const valueToStore =
          value instanceof Function ? (value: any)(storedValue) : value;
        setStoredValue(valueToStore);
        localStorageSetItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.log(error);
      }
    },
    [key, storedValue],
  );

  // Listen for changes to this local storage value made from other windows.
  // This enables the e.g. "⚛️ Elements" tab to update in response to changes from "⚛️ Settings".
  useLayoutEffect(() => {
    const onStorage = event => {
      const newValue = getValueFromLocalStorage();
      if (key === event.key && storedValue !== newValue) {
        setValue(newValue);
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [getValueFromLocalStorage, key, storedValue, setValue]);

  return [storedValue, setValue];
}

export function useModalDismissSignal(
  modalRef: {current: HTMLDivElement | null, ...},
  dismissCallback: () => void,
  dismissOnClickOutside?: boolean = true,
): void {
  useEffect(() => {
    if (modalRef.current === null) {
      return () => {};
    }

    const handleDocumentKeyDown = ({key}: any) => {
      if (key === 'Escape') {
        dismissCallback();
      }
    };

    const handleDocumentClick = (event: any) => {
      // $FlowFixMe
      if (
        modalRef.current !== null &&
        !modalRef.current.contains(event.target)
      ) {
        event.stopPropagation();
        event.preventDefault();

        dismissCallback();
      }
    };

    // It's important to listen to the ownerDocument to support the browser extension.
    // Here we use portals to render individual tabs (e.g. Profiler),
    // and the root document might belong to a different window.
    const ownerDocument = modalRef.current.ownerDocument;
    ownerDocument.addEventListener('keydown', handleDocumentKeyDown);
    if (dismissOnClickOutside) {
      ownerDocument.addEventListener('click', handleDocumentClick);
    }

    return () => {
      ownerDocument.removeEventListener('keydown', handleDocumentKeyDown);
      ownerDocument.removeEventListener('click', handleDocumentClick);
    };
  }, [modalRef, dismissCallback, dismissOnClickOutside]);
}

// Copied from https://github.com/facebook/react/pull/15022
export function useSubscription<Value>({
  getCurrentValue,
  subscribe,
}: {|
  getCurrentValue: () => Value,
  subscribe: (callback: Function) => () => void,
|}): Value {
  const [state, setState] = useState({
    getCurrentValue,
    subscribe,
    value: getCurrentValue(),
  });

  if (
    state.getCurrentValue !== getCurrentValue ||
    state.subscribe !== subscribe
  ) {
    setState({
      getCurrentValue,
      subscribe,
      value: getCurrentValue(),
    });
  }

  useEffect(() => {
    let didUnsubscribe = false;

    const checkForUpdates = () => {
      if (didUnsubscribe) {
        return;
      }

      setState(prevState => {
        if (
          prevState.getCurrentValue !== getCurrentValue ||
          prevState.subscribe !== subscribe
        ) {
          return prevState;
        }

        const value = getCurrentValue();
        if (prevState.value === value) {
          return prevState;
        }

        return {...prevState, value};
      });
    };
    const unsubscribe = subscribe(checkForUpdates);

    checkForUpdates();

    return () => {
      didUnsubscribe = true;
      unsubscribe();
    };
  }, [getCurrentValue, subscribe]);

  return state.value;
}

export function useBrowserTheme(): BrowserTheme {
  const [theme, setTheme] = useState<BrowserTheme>('light');

  useEffect(() => {
    const handlePreferredColorSchemeChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };

    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQueryList.addEventListener('change', handlePreferredColorSchemeChange);

    return () => {
      mediaQueryList.removeEventListener(
        'change',
        handlePreferredColorSchemeChange,
      );
    };
  }, []);

  return theme;
}
