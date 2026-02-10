
## Input

```javascript
export function useFoo(id: string) {
  const bar = useBar();
  const value = func(bar);

  const {data} = useBaz(options(id));
  const a = result(data, value);

  return a;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
export function useFoo(id) {
  const $ = _c(7);
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
  if ($[2] !== id) {
    t1 = options(id);
    $[2] = id;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const { data } = useBaz(t1);
  let t2;
  if ($[4] !== data || $[5] !== value) {
    t2 = result(data, value);
    $[4] = data;
    $[5] = value;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  const a = t2;

  return a;
}

```
      
### Eval output
(kind: exception) Fixture not implemented