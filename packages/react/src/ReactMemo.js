/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import type {Dispatcher} from './ReactInternalTypes';

import {
  enableUserlandMemo,
  enableRefAsProp,
  enableCache,
  enableUseMemoCacheHook,
  enableUseEffectEventHook,
  enableFormActions,
  enableAsyncActions,
} from 'shared/ReactFeatureFlags';

import {REACT_ELEMENT_TYPE, REACT_MEMO_TYPE} from 'shared/ReactSymbols';

import {useState} from './ReactHooks';

import shallowEqual from 'shared/shallowEqual';

import assign from 'shared/assign';

import isValidElementType from 'shared/isValidElementType';
import ReactCurrentDispatcher from './ReactCurrentDispatcher';

// this currently seems to be duplicated all over the codebase. should it be moved to a shared implementation?
function resolveDefaultProps(Component: any, baseProps: Object): Object {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = assign({}, baseProps);
    const defaultProps = Component.defaultProps;
    for (const propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
    return props;
  }
  return baseProps;
}

function throwInvalidHookError() {
  throw new Error(
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
      ' one of the following reasons:\n' +
      '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
      '2. You might be breaking the Rules of Hooks\n' +
      '3. You might have more than one copy of React in the same app\n' +
      'See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.',
  );
}

export const MemoCompareDispatcher: Dispatcher = {
  readContext: throwInvalidHookError,
  use: throwInvalidHookError,
  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useInsertionEffect: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  useMemo: throwInvalidHookError,
  useReducer: throwInvalidHookError,
  useRef: throwInvalidHookError,
  useState: throwInvalidHookError,
  useDebugValue: throwInvalidHookError,
  useDeferredValue: throwInvalidHookError,
  useTransition: throwInvalidHookError,
  useSyncExternalStore: throwInvalidHookError,
  useId: throwInvalidHookError,
};
if (enableCache) {
  (MemoCompareDispatcher: Dispatcher).useCacheRefresh = throwInvalidHookError;
}
if (enableUseMemoCacheHook) {
  (MemoCompareDispatcher: Dispatcher).useMemoCache = throwInvalidHookError;
}
if (enableUseEffectEventHook) {
  (MemoCompareDispatcher: Dispatcher).useEffectEvent = throwInvalidHookError;
}
if (enableFormActions && enableAsyncActions) {
  (MemoCompareDispatcher: Dispatcher).useHostTransitionStatus =
    throwInvalidHookError;
  (MemoCompareDispatcher: Dispatcher).useFormState = throwInvalidHookError;
}
if (enableAsyncActions) {
  (MemoCompareDispatcher: Dispatcher).useOptimistic = throwInvalidHookError;
}

export function memo<Props>(
  type: React$ElementType,
  compare?: (oldProps: Props, newProps: Props) => boolean,
) {
  if (__DEV__) {
    if (!isValidElementType(type)) {
      console.error(
        'memo: The first argument must be a component. Instead ' +
          'received: %s',
        type === null ? 'null' : typeof type,
      );
    }
  }

  let elementType;
  if (enableUserlandMemo) {
    elementType = props => {
      const resolvedProps = resolveDefaultProps(type, props);
      const [render, setRender] = useState(() => ({
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        props: resolvedProps,
      }));

      if (resolvedProps !== render.props) {
        let previousDispatcher;
        if (__DEV__) {
          // previousDispatcher = ReactCurrentDispatcher.current;
          // ReactCurrentDispatcher.current = MemoCompareDispatcher;
        }

        let shouldUpdate;
        try {
          shouldUpdate =
            !(compare == null ? shallowEqual : compare)(
              render.props,
              resolvedProps,
            ) ||
            (enableRefAsProp && props.ref !== render.props.ref);
        } finally {
          if (__DEV__) {
            // ReactCurrentDispatcher.current = previousDispatcher;
          }
        }

        if (shouldUpdate) {
          setRender({
            $$typeof: REACT_ELEMENT_TYPE,
            type,
            props: resolvedProps,
          });
        }
      }

      return render;
    };

    if (__DEV__) {
      Object.defineProperty(elementType, 'name', {
        enumerable: false,
        configurable: true,
        get: function () {
          return null;
        },
      });
    }
  } else {
    elementType = {
      $$typeof: REACT_MEMO_TYPE,
      type,
      compare: compare === undefined ? null : compare,
    };
  }

  if (__DEV__) {
    let ownName;
    Object.defineProperty(elementType, 'displayName', {
      enumerable: false,
      configurable: true,
      get: function () {
        if (enableUserlandMemo) {
          return ownName || type.displayName || type.name || 'Memo';
        } else {
          return ownName;
        }
      },
      set: function (name) {
        ownName = name;

        // The inner component shouldn't inherit this display name in most cases,
        // because the component may be used elsewhere.
        // But it's nice for anonymous functions to inherit the name,
        // so that our component-stack generation logic will display their frames.
        // An anonymous function generally suggests a pattern like:
        //   React.memo((props) => {...});
        // This kind of inner function is not used elsewhere so the side effect is okay.
        if (!type.name && !type.displayName) {
          type.displayName = name;
        }
      },
    });
  }
  return elementType;
}
