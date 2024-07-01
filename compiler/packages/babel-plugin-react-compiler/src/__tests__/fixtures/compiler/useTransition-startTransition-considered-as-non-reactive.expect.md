
## Input

```javascript
import { useTransition, useState } from "react";

function Component() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState(1);
  return (
    <div onClick={() => startTransition(() => setState((prev) => prev + 1))}>
      {isPending ? "pending" : state}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useTransition, useState } from "react";

function Component() {
  const $ = _c(3);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => startTransition(() => setState((prev) => prev + 1));
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const t1 = isPending ? "pending" : state;
  let t2;
  if ($[1] !== t1) {
    t2 = <div onClick={t0}>{t1}</div>;
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) <div>1</div>