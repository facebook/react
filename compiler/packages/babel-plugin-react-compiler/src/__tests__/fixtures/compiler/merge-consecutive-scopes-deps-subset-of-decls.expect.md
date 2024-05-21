
## Input

```javascript
import { useState } from "react";

function Component() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      {/**
       * The scope for the <button> depends on just the scope for the callback,
       * but the previous scope (after merging) will declare both the above
       * <button> and the callback.
       */}
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useState } from "react";

function Component() {
  const $ = _c(8);
  const [count, setCount] = useState(0);
  let t0;
  let t1;
  if ($[0] !== count) {
    t0 = <button onClick={() => setCount(count - 1)}>Decrement</button>;

    t1 = () => setCount(count + 1);
    $[0] = count;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  let t2;
  if ($[3] !== t1) {
    t2 = <button onClick={t1}>Increment</button>;
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== t0 || $[6] !== t2) {
    t3 = (
      <div>
        {t0}
        {t2}
      </div>
    );
    $[5] = t0;
    $[6] = t2;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div><button>Decrement</button><button>Increment</button></div>