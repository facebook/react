/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  createContext,
  useState,
  useContext,
  useRef,
  useReducer,
  useCallback,
  useMemo,
  useDebugName,
} from 'react';

function useNestedInnerHook() {
  const [nestedState] = useState(123);
  useDebugName('nestedState');
  return nestedState;
}
function useNestedOuterHook() {
  return useNestedInnerHook();
}

const initialData = {foo: 'FOO', bar: 'BAR'};

function reducer(state, action) {
  switch (action.type) {
    case 'swap':
      return {foo: state.bar, bar: state.foo};
    default:
      throw new Error();
  }
}

const StringContext = createContext('123');

export default function NamedHooks(props: any) {
  const [count, setCount] = useState(0);
  useDebugName('count');
  const memoizedSetClick = useCallback(() => setCount(count + 1), [count]);
  useDebugName('memoizedSetClick');

  const [state, setState] = useState(false); // eslint-disable-line

  const [data, dispatch] = useReducer(reducer, initialData); // eslint-disable-line
  useDebugName('data');
  const memoizedDataDispatcher = useCallback(
    () => dispatch({type: 'swap'}),
    [],
  );
  useDebugName('memoizedDataDispatcher');

  const memoizedCountMultiplied = useMemo(() => count * 2, [count]);
  useDebugName('memoizedCountMultiplied');
  const ctxValue = useContext(StringContext);
  useDebugName('StringContext');
  const spanRef = useRef(null);
  useDebugName('spanRef');

  useNestedOuterHook();

  return (
    <>
      <h1>Named hooks</h1>
      <button onClick={memoizedSetClick}>
        Count: {count} {memoizedCountMultiplied}
      </button>
      <button onClick={memoizedDataDispatcher}>Swap reducer values</button>
      <span ref={spanRef}>Context: {ctxValue}</span>
    </>
  );
}
