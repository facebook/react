
## Input

```javascript
// @flow @validateRefAccessDuringRender @validatePreserveExistingMemoizationGuarantees

component Foo() {
  const ref = useRef();

  const s = useCallback(() => {
    return ref.current;
  });

  return <a r={s} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";

function Foo() {
  const $ = _c(2);
  const ref = useRef();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => ref.current;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const s = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <a r={s} />;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```
      
### Eval output
(kind: exception) useRef is not defined