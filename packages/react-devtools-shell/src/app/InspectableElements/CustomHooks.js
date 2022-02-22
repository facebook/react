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
  forwardRef,
  Fragment,
  memo,
  useCallback,
  useContext,
  useDebugValue,
  useEffect,
  useState,
} from 'react';

const object = {
  string: 'abc',
  number: 123,
  boolean: true,
  null: null,
  undefined: undefined,
  array: ['a', 'b', 'c'],
  object: {foo: 1, bar: 2, baz: 3},
};

function useNestedInnerHook() {
  return useState(123);
}
function useNestedOuterHook() {
  return useNestedInnerHook();
}

function useCustomObject() {
  useDebugValue(object);
  return useState(123);
}

function useDeepHookA() {
  useDebugValue('useDeepHookA');
  useDeepHookB();
}
function useDeepHookB() {
  useDebugValue('useDeepHookB');
  useDeepHookC();
}
function useDeepHookC() {
  useDebugValue('useDeepHookC');
  useDeepHookD();
}
function useDeepHookD() {
  useDebugValue('useDeepHookD');
  useDeepHookE();
}
function useDeepHookE() {
  useDebugValue('useDeepHookE');
  useDeepHookF();
}
function useDeepHookF() {
  useDebugValue('useDeepHookF');
}

const ContextA = createContext('A');
const ContextB = createContext('B');

function FunctionWithHooks(props: any, ref: React$Ref<any>) {
  const [count, updateCount] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const contextValueA = useContext(ContextA);

  // eslint-disable-next-line no-unused-vars
  const [_, __] = useState(object);

  // Custom hook with a custom debug label
  const debouncedCount = useDebounce(count, 1000);

  useCustomObject();

  const onClick = useCallback(
    function onClick() {
      updateCount(count + 1);
    },
    [count],
  );

  // Tests nested custom hooks
  useNestedOuterHook();

  // eslint-disable-next-line no-unused-vars
  const contextValueB = useContext(ContextB);

  // Verify deep nesting doesn't break
  useDeepHookA();

  return <button onClick={onClick}>Count: {debouncedCount}</button>;
}
const MemoWithHooks = memo(FunctionWithHooks);
const ForwardRefWithHooks = forwardRef(FunctionWithHooks);

function wrapWithHoc(Component) {
  function Hoc() {
    return <Component />;
  }
  // $FlowFixMe
  const displayName = Component.displayName || Component.name;
  Hoc.displayName = `withHoc(${displayName})`;
  return Hoc;
}
const HocWithHooks = wrapWithHoc(FunctionWithHooks);

export default function CustomHooks() {
  return (
    <Fragment>
      <FunctionWithHooks />
      <MemoWithHooks />
      <ForwardRefWithHooks />
      <HocWithHooks />
    </Fragment>
  );
}

// Below copied from https://usehooks.com/
function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Show the value in DevTools
  useDebugValue(debouncedValue);

  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay], // Only re-call effect if value or delay changes
  );

  return debouncedValue;
}
// Above copied from https://usehooks.com/
