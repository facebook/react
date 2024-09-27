
## Input

```javascript
// @enableTreatRefLikeIdentifiersAsRefs @validatePreserveExistingMemoizationGuarantees
import {useRef, useEffect} from 'react';

function useCustomRef() {
  return useRef({click: () => {}});
}

function Foo() {
  const ref = useCustomRef();

  useEffect(() => {
    ref.current?.click();
  }, []);

  return <div>foo</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableTreatRefLikeIdentifiersAsRefs @validatePreserveExistingMemoizationGuarantees
import { useRef, useEffect } from "react";

function useCustomRef() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { click: _temp };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return useRef(t0);
}
function _temp() {}

function Foo() {
  const $ = _c(3);
  const ref = useCustomRef();
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      ref.current?.click();
    };
    t1 = [];
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  useEffect(t0, t1);
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <div>foo</div>;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>foo</div>