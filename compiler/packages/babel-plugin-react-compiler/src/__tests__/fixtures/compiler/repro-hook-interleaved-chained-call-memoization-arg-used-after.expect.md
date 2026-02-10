
## Input

```javascript
export function useFoo(id: string) {
  const bar = useBar();
  const value = func(bar);

  const {data} = useBaz(options(id));
  const a = result(data, value);

  return [a, value];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
export function useFoo(id) {
  const $ = _c(5);
  const bar = useBar();
  const value = func(bar);
  let t0;
  if ($[0] !== id) {
    t0 = options(id);
    $[0] = id;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const { data } = useBaz(t0);
  const a = result(data, value);
  let t1;
  if ($[2] !== a || $[3] !== value) {
    t1 = [a, value];
    $[2] = a;
    $[3] = value;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented