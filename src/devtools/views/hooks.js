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
  modalRef: React$Ref<any>,
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
