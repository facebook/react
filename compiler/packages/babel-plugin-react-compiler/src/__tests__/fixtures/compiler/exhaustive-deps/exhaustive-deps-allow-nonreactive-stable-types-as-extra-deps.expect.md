
## Input

```javascript
// @validateExhaustiveMemoizationDependencies
import {
  useCallback,
  useTransition,
  useState,
  useOptimistic,
  useActionState,
  useRef,
  useReducer,
} from 'react';

function useFoo() {
  const [s, setState] = useState();
  const ref = useRef(null);
  const [t, startTransition] = useTransition();
  const [u, addOptimistic] = useOptimistic();
  const [v, dispatch] = useReducer(() => {}, null);
  const [isPending, dispatchAction] = useActionState(() => {}, null);

  return useCallback(() => {
    dispatch();
    startTransition(() => {});
    addOptimistic();
    setState(null);
    dispatchAction();
    ref.current = true;
  }, [
    // intentionally adding unnecessary deps on nonreactive stable values
    // to check that they're allowed
    dispatch,
    startTransition,
    addOptimistic,
    setState,
    dispatchAction,
    ref,
  ]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateExhaustiveMemoizationDependencies
import {
  useCallback,
  useTransition,
  useState,
  useOptimistic,
  useActionState,
  useRef,
  useReducer,
} from "react";

function useFoo() {
  const $ = _c(1);
  const [, setState] = useState();
  const ref = useRef(null);
  const [, startTransition] = useTransition();
  const [, addOptimistic] = useOptimistic();
  const [, dispatch] = useReducer(_temp, null);
  const [, dispatchAction] = useActionState(_temp2, null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      dispatch();
      startTransition(_temp3);
      addOptimistic();
      setState(null);
      dispatchAction();
      ref.current = true;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
function _temp3() {}
function _temp2() {}
function _temp() {}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```
      
### Eval output
(kind: ok) "[[ function params=0 ]]"