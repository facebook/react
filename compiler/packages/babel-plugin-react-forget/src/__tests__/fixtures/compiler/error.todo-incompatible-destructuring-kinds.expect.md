
## Input

```javascript
import { useMemo } from "react";
import { Stringify } from "shared-runtime";

function Component({}) {
  let a = "a";
  let b = "";
  [a, b] = [null, null];
  return <Stringify a={a} b={b} onClick={() => a} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```


## Error

```
   5 |   let a = "a";
   6 |   let b = "";
>  7 |   [a, b] = [null, null];
     |       ^ [ReactForget] Invariant: Expected consistent kind for destructuring. Other places were 'Const' but 'store b$36[10:12]' is reassigned (7:7)
   8 |   return <Stringify a={a} b={b} onClick={() => a} />;
   9 | }
  10 |
```
          
      