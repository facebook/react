
## Input

```javascript
export function useFoo(id: string) {
  const bar = useBar();
  const value = func(bar);

  const {data} = useBaz(value);
  const a = result(data, value);

  return a;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
export function useFoo(id) {
  const $ = _c(5);
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

  const { data } = useBaz(value);
  let t1;
  if ($[2] !== data || $[3] !== value) {
    t1 = result(data, value);
    $[2] = data;
    $[3] = value;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const a = t1;

  return a;
}

```
      
### Eval output
(kind: exception) Fixture not implemented