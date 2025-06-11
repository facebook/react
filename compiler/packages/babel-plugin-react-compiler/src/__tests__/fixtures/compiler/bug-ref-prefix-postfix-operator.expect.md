
## Input

```javascript
import {useRef} from 'react';

/**
 * The postfix increment operator should return the value before incrementing.
 * ```js
 * const id = modalId.current; // 0
 * modalId.current = modalId.current + 1; // 1
 * return id;
 * ```
 * The bug is that
 * This bug does not trigger when the incremented value is a plain primitive.
 */
function useFoo() {
  const modalId = useRef(0);
  const showModal = () => {
    const id = modalId.current++;
    return id;
  };
  const showModal2 = () => {
    const id = ++modalId.current;
    return id;
  };
  return {modalId, showModal, showModal2};
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useRef } from "react";

/**
 * The postfix increment operator should return the value before incrementing.
 * ```js
 * const id = modalId.current; // 0
 * modalId.current = modalId.current + 1; // 1
 * return id;
 * ```
 * The bug is that
 * This bug does not trigger when the incremented value is a plain primitive.
 */
function useFoo() {
  const $ = _c(2);
  const modalId = useRef(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      modalId.current = modalId.current + 1;
      const id = modalId.current;
      return id;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const showModal = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    const showModal2 = () => {
      const id_0 = (modalId.current = modalId.current + 1);
      return id_0;
    };

    t1 = { modalId, showModal, showModal2 };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```
      
### Eval output
(kind: ok) {"modalId":{"current":0},"showModal":"[[ function params=0 ]]","showModal2":"[[ function params=0 ]]"}