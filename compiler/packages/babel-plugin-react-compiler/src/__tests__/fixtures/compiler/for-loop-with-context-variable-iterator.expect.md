
## Input

```javascript
function Component() {
  const data = useData();
  const items = [];
  // NOTE: `i` is a context variable because it's reassigned and also referenced
  // within a closure, the `onClick` handler of each item
  for (let i = MIN; i <= MAX; i += INCREMENT) {
    items.push(<div key={i} onClick={() => data.set(i)} />);
  }
  return <>{items}</>;
}

const MIN = 0;
const MAX = 3;
const INCREMENT = 1;

function useData() {
  return new Map();
}

export const FIXTURE_ENTRYPOINT = {
  params: [],
  fn: Component,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(2);
  const data = useData();
  let t0;
  if ($[0] !== data) {
    const items = [];
    for (let i = MIN; i <= MAX; i = i + INCREMENT, i) {
      items.push(<div key={i} onClick={() => data.set(i)} />);
    }

    t0 = <>{items}</>;
    $[0] = data;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

const MIN = 0;
const MAX = 3;
const INCREMENT = 1;

function useData() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = new Map();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  params: [],
  fn: Component,
};

```
      
### Eval output
(kind: ok) <div></div><div></div><div></div><div></div>