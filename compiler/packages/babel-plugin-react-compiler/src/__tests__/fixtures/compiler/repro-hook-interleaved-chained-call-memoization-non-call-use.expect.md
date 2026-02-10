
## Input

```javascript
export function useFoo(id: string) {
  const bar = useBar();
  const value = func(bar);
  const arr = [value];

  const {data} = useBaz(options(id));
  const a = result(data, value);

  return [a, arr];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
export function useFoo(id) {
  const $ = _c(12);
  const bar = useBar();
  let t0;
  if ($[0] !== bar) {
    t0 = func(bar);
    $[0] = bar;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const value = t0;
  let t1;
  if ($[2] !== value) {
    t1 = [value];
    $[2] = value;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const arr = t1;
  let t2;
  if ($[4] !== id) {
    t2 = options(id);
    $[4] = id;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const { data } = useBaz(t2);
  let t3;
  if ($[6] !== data || $[7] !== value) {
    t3 = result(data, value);
    $[6] = data;
    $[7] = value;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  const a = t3;
  let t4;
  if ($[9] !== a || $[10] !== arr) {
    t4 = [a, arr];
    $[9] = a;
    $[10] = arr;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  return t4;
}

```
      
### Eval output
(kind: exception) Fixture not implemented