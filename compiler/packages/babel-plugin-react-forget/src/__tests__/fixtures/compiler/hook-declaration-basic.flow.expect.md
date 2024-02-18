
## Input

```javascript
// @flow @compilationMode(infer) 
export default hook useFoo(bar: number) {
  return [bar];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function useFoo(bar) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== bar) {
    t0 = [bar];
    $[0] = bar;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      