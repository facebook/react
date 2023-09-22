
## Input

```javascript
import { getNumber } from "shared-runtime";

function useFoo() {
  try {
    return getNumber();
  } catch {}
}
export const FIXTURE_ENTRYPONT = {
  fn: useFoo,
  params: [],
};

```


## Error

```
[ReactForget] Invariant: Cannot emit the same block twice: bb2
```
          
      