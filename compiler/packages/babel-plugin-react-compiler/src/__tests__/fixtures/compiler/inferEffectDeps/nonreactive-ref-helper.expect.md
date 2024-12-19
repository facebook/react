
## Input

```javascript
// @inferEffectDependencies
import {useEffect} from 'react';
import {print} from 'shared-runtime';

/**
 * We never include a .current access in a dep array because it may be a ref access.
 * This might over-capture objects that are not refs and happen to have fields named
 * current, but that should be a rare case and the result would still be correct
 * (assuming the effect is idempotent). In the worst case, you can always write a manual
 * dep array.
 */
function RefsInEffects() {
  const ref = useRefHelper();
  const wrapped = useDeeperRefHelper();
  useEffect(() => {
    print(ref.current);
    print(wrapped.foo.current);
  });
}

function useRefHelper() {
  return useRef(0);
}

function useDeeperRefHelper() {
  return {foo: useRefHelper()};
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect } from "react";
import { print } from "shared-runtime";

/**
 * We never include a .current access in a dep array because it may be a ref access.
 * This might over-capture objects that are not refs and happen to have fields named
 * current, but that should be a rare case and the result would still be correct
 * (assuming the effect is idempotent). In the worst case, you can always write a manual
 * dep array.
 */
function RefsInEffects() {
  const $ = _c(3);
  const ref = useRefHelper();
  const wrapped = useDeeperRefHelper();
  let t0;
  if ($[0] !== ref.current || $[1] !== wrapped.foo.current) {
    t0 = () => {
      print(ref.current);
      print(wrapped.foo.current);
    };
    $[0] = ref.current;
    $[1] = wrapped.foo.current;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  useEffect(t0, [ref, wrapped.foo]);
}

function useRefHelper() {
  return useRef(0);
}

function useDeeperRefHelper() {
  const $ = _c(2);
  const t0 = useRefHelper();
  let t1;
  if ($[0] !== t0) {
    t1 = { foo: t0 };
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented