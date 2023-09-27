
## Input

```javascript
function Component() {
  let [state, setState] = useState(0);
  return (
    <div>
      <Title text="Counter" />
      <span>{state}</span>
      <button data-testid="button" onClick={() => setState(state + 1)}>
        increment
      </button>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component() {
  const $ = useMemoCache(9);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Title text="Counter" />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const c_1 = $[1] !== state;
  let t1;
  if (c_1) {
    t1 = <span>{state}</span>;
    $[1] = state;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const c_3 = $[3] !== state;
  let t2;
  let t3;
  if (c_3) {
    t2 = () => setState(state + 1);
    t3 = (
      <button data-testid="button" onClick={t2}>
        increment
      </button>
    );
    $[3] = state;
    $[4] = t2;
    $[5] = t3;
  } else {
    t2 = $[4];
    t3 = $[5];
  }
  const c_6 = $[6] !== t1;
  const c_7 = $[7] !== t3;
  let t4;
  if (c_6 || c_7) {
    t4 = (
      <div>
        {t0}
        {t1}
        {t3}
      </div>
    );
    $[6] = t1;
    $[7] = t3;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  return t4;
}
export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      