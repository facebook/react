/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import throttle from 'lodash.throttle';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useState,
  useContext,
} from 'react';
import {
  localStorageGetItem,
  localStorageSetItem,
} from 'react-devtools-shared/src/storage';
import {StoreContext, BridgeContext} from './context';
import {sanitizeForParse, smartParse, smartStringify} from '../utils';

type ACTION_RESET = {|
  type: 'RESET',
  externalValue: any,
|};
type ACTION_UPDATE = {|
  type: 'UPDATE',
  editableValue: any,
  externalValue: any,
|};

type UseEditableValueAction = ACTION_RESET | ACTION_UPDATE;
type UseEditableValueDispatch = (action: UseEditableValueAction) => void;
type UseEditableValueState = {|
  editableValue: any,
  externalValue: any,
  hasPendingChanges: boolean,
  isValid: boolean,
  parsedValue: any,
|};

function useEditableValueReducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return {
        ...state,
        editableValue: smartStringify(action.externalValue),
        externalValue: action.externalValue,
        hasPendingChanges: false,
        isValid: true,
        parsedValue: action.externalValue,
      };
    case 'UPDATE':
      let isNewValueValid = false;
      let newParsedValue;
      try {
        newParsedValue = smartParse(action.editableValue);
        isNewValueValid = true;
      } catch (error) {}
      return {
        ...state,
        editableValue: sanitizeForParse(action.editableValue),
        externalValue: action.externalValue,
        hasPendingChanges:
          smartStringify(action.externalValue) !== action.editableValue,
        isValid: isNewValueValid,
        parsedValue: isNewValueValid ? newParsedValue : state.parsedValue,
      };
    default:
      throw new Error(`Invalid action "${action.type}"`);
  }
}

// Convenience hook for working with an editable value that is validated via JSON.parse.
export function useEditableValue(
  externalValue: any,
): [UseEditableValueState, UseEditableValueDispatch] {
  const [state, dispatch] = useReducer<
    UseEditableValueState,
    UseEditableValueState,
    UseEditableValueAction,
  >(useEditableValueReducer, {
    editableValue: smartStringify(externalValue),
    externalValue,
    hasPendingChanges: false,
    isValid: true,
    parsedValue: externalValue,
  });
  if (!Object.is(state.externalValue, externalValue)) {
    if (!state.hasPendingChanges) {
      dispatch({
        type: 'RESET',
        externalValue,
      });
    } else {
      dispatch({
        type: 'UPDATE',
        editableValue: state.editableValue,
        externalValue,
      });
    }
  }

  return [state, dispatch];
}

export function useIsOverflowing(
  containerRef: {current: HTMLDivElement | null, ...},
  totalChildWidth: number,
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
      100,
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

export function useHighlightNativeElement() {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const highlightNativeElement = useCallback(
    (id: number) => {
      const element = store.getElementByID(id);
      const rendererID = store.getRendererIDForElement(id);
      if (element !== null && rendererID !== null) {
        bridge.send('highlightNativeElement', {
          displayName: element.displayName,
          hideAfterTimeout: false,
          id,
          openNativeElementsPanel: false,
          rendererID,
          scrollIntoView: false,
        });
      }
    },
    [store, bridge],
  );

  const clearHighlightNativeElement = useCallback(() => {
    bridge.send('clearNativeElementHighlight');
  }, [bridge]);

  return {
    highlightNativeElement,
    clearHighlightNativeElement,
  };
}
