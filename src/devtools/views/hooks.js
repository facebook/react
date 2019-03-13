// @flow

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

// Forked from https://usehooks.com/useLocalStorage/
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | (() => T)) => void] {
  const getValueFromLocalStorage = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState(getValueFromLocalStorage);

  const setValue = useCallback(
    value => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.log(error);
      }
    },
    [key, storedValue]
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
  modalRef: { current: HTMLDivElement | null },
  dismissCallback: Function
): void {
  useEffect(() => {
    const handleKeyDown = ({ key }: any) => {
      if (key === 'Escape') {
        dismissCallback();
      }
    };

    const handleMouseOrTouch = ({ target }: any) => {
      // $FlowFixMe
      if (modalRef.current !== null && !modalRef.current.contains(target)) {
        dismissCallback();
      }
    };

    const body = ((document.body: any): HTMLBodyElement);
    body.addEventListener('keydown', handleKeyDown);
    body.addEventListener('mousedown', handleMouseOrTouch);
    body.addEventListener('touchstart', handleMouseOrTouch);

    return () => {
      body.removeEventListener('keydown', handleKeyDown);
      body.removeEventListener('mousedown', handleMouseOrTouch);
      body.removeEventListener('touchstart', handleMouseOrTouch);
    };
  }, [modalRef, dismissCallback]);
}

// Copied from https://github.com/facebook/react/pull/15022
export function useSubscription<Value, Source>({
  source,
  getCurrentValue,
  subscribe,
}: {|
  source: Source,
  getCurrentValue: (source: Source) => Value,
  subscribe: (source: Source, callback: Function) => () => void,
|}): Value {
  const [state, setState] = useState({
    source,
    value: getCurrentValue(source),
  });

  if (state.source !== source) {
    setState({
      source,
      value: getCurrentValue(source),
    });
  }

  useEffect(() => {
    let didUnsubscribe = false;

    const checkForUpdates = () => {
      if (didUnsubscribe) {
        return;
      }

      setState(prevState => {
        if (prevState.source !== source) {
          return prevState;
        }

        const value = getCurrentValue(source);
        if (prevState.value === value) {
          return prevState;
        }

        return { ...prevState, value };
      });
    };
    const unsubscribe = subscribe(source, checkForUpdates);

    checkForUpdates();

    return () => {
      didUnsubscribe = true;
      unsubscribe();
    };
  }, [getCurrentValue, source, subscribe]);

  return state.value;
}
