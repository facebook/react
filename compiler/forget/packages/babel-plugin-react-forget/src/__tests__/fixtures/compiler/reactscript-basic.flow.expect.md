
## Input

```javascript
// @reactScriptDirective 
export default component Foo(bar: number) {
  return <Bar bar={bar} />;
}
```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
export default function Foo(t7) {
  const $ = useMemoCache(2);
  const { bar } = t7;
  const c_0 = $[0] !== bar;
  let t0;
  if (c_0) {
    t0 = <Bar bar={bar} />;
    $[0] = bar;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      