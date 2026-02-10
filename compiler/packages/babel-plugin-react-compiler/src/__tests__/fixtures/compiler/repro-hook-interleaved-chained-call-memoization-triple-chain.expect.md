
## Input

```javascript
export function useFoo(id: string) {
  const bar = useBar();
  const b = transform(bar);

  const {data} = useBaz(options(id));
  const c = transform2(b, data);

  useQux();
  const d = transform3(c);

  return d;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
export function useFoo(id) {
  const $ = _c(9);
  const bar = useBar();
  let t0;
  if ($[0] !== bar) {
    t0 = transform(bar);
    $[0] = bar;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const b = t0;
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
  if ($[4] !== b || $[5] !== data) {
    t2 = transform2(b, data);
    $[4] = b;
    $[5] = data;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  const c = t2;

  useQux();
  let t3;
  if ($[7] !== c) {
    t3 = transform3(c);
    $[7] = c;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  const d = t3;

  return d;
}

```
      
### Eval output
(kind: exception) Fixture not implemented