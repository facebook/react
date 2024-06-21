
## Input

```javascript
// @enableTreatRefLikeIdentifiersAsRefs @validatePreserveExistingMemoizationGuarantees
import { useRef, useEffect } from "react";

function useCustomRef() {
  return useRef({ click: () => {} });
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
    t0 = { click: () => {} };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return useRef(t0);
}

function Foo() {
  const $ = _c(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div>foo</div>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const ref = useCustomRef();
  let t1;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      ref.current?.click();
    };
    t2 = [];
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>foo</div>