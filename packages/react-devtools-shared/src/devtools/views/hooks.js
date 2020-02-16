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
  useRef,
  useState,
} from 'react';
import {
  localStorageGetItem,
  localStorageSetItem,
} from 'react-devtools-shared/src/storage';
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

  const [storedValue, setStoredValue] = useState(getValueFromLocalStorage);

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

export function useSmartTooltip({
  height,
  mouseX,
  mouseY,
  width,
}: {
  height: number,
  mouseX: number,
  mouseY: number,
  width: number,
}) {
  const TOOLTIP_OFFSET_X = 5;
  const TOOLTIP_OFFSET_Y = 15;
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (element != null) {
      // Let's check the vertical position.
      if (mouseY + TOOLTIP_OFFSET_Y + element.offsetHeight >= height) {
        // The tooltip doesn't fit below the mouse cursor (which is our
        // default strategy). Therefore we try to position it either above the
        // mouse cursor or finally aligned with the window's top edge.
        if (mouseY - TOOLTIP_OFFSET_Y - element.offsetHeight > 0) {
          // We position the tooltip above the mouse cursor if it fits there.
          element.style.top = `${mouseY -
            element.offsetHeight -
            TOOLTIP_OFFSET_Y}px`;
        } else {
          // Otherwise we align the tooltip with the window's top edge.
          element.style.top = '0px';
        }
      } else {
        element.style.top = `${mouseY + TOOLTIP_OFFSET_Y}px`;
      }

      // Now let's check the horizontal position.
      if (mouseX + TOOLTIP_OFFSET_X + element.offsetWidth >= width) {
        // The tooltip doesn't fit at the right of the mouse cursor (which is
        // our default strategy). Therefore we try to position it either at the
        // left of the mouse cursor or finally aligned with the window's left
        // edge.
        if (mouseX - TOOLTIP_OFFSET_X - element.offsetWidth > 0) {
          // We position the tooltip at the left of the mouse cursor if it fits
          // there.
          element.style.left = `${mouseX -
            element.offsetWidth -
            TOOLTIP_OFFSET_X}px`;
        } else {
          // Otherwise, align the tooltip with the window's left edge.
          element.style.left = '0px';
        }
      } else {
        element.style.left = `${mouseX + TOOLTIP_OFFSET_X * 2}px`;
      }
    }
  });

  return ref;
}
