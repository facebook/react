// @flow

import throttle from 'lodash.throttle';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export function useIsOverflowing(
  containerRef: { current: HTMLDivElement | null },
  totalChildWidth: number
): boolean {
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);

  // It's important to use a layout effect, so that we avoid showing a flash of overflowed content.
  useLayoutEffect(() => {
    if (containerRef.current === null) {
      return () => {};
    }

    const container = ((containerRef.current: any): HTMLDivElement);

    const handleResize = throttle(
      () => setIsOverflowing(container.clientWidth <= totalChildWidth),
      100
    );

    handleResize();

    // It's important to listen to the ownerDocument.defaultView to support the browser extension.
    // Here we use portals to render individual tabs (e.g. Profiler),
    // and the root document might belong to a different window.
    const ownerWindow = container.ownerDocument.defaultView;
    ownerWindow.addEventListener('resize', handleResize);
    return () => ownerWindow.removeEventListener('resize', handleResize);
  }, [containerRef, totalChildWidth]);

  return isOverflowing;
}

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
          value instanceof Function ? (value: any)(storedValue) : value;
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
  dismissCallback: () => void
): void {
  useEffect(() => {
    if (modalRef.current === null) {
      return () => {};
    }

    const handleKeyDown = ({ key }: any) => {
      if (key === 'Escape') {
        dismissCallback();
      }
    };

    const handleClick = (event: any) => {
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
    ownerDocument.addEventListener('keydown', handleKeyDown);
    ownerDocument.addEventListener('click', handleClick);

    return () => {
      ownerDocument.removeEventListener('keydown', handleKeyDown);
      ownerDocument.removeEventListener('click', handleClick);
    };
  }, [modalRef, dismissCallback]);
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

        return { ...prevState, value };
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
