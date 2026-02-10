
## Input

```javascript
export function useFoo(id: string, value: number) {
  const {data} = useBaz(options(id));
  const a = result(data, value);

  return a;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
export function useFoo(id, value) {
  const $ = _c(5);
  let t0;
  if ($[0] !== id) {
    t0 = options(id);
    $[0] = id;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const { data } = useBaz(t0);
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