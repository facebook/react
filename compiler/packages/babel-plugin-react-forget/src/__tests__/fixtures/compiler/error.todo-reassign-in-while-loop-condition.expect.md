
## Input

```javascript
import { makeArray } from "shared-runtime";

// @flow
function Component() {
  const items = makeArray(0, 1, 2);
  let item;
  let sum = 0;
  while ((item = items.pop())) {
    sum += item;
  }
  return [sum];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```


## Error

```
   6 |   let item;
   7 |   let sum = 0;
>  8 |   while ((item = items.pop())) {
     |           ^^^^ [ReactForget] Invariant: Unexpected StoreLocal in codegenInstructionValue (8:8)
   9 |     sum += item;
  10 |   }
  11 |   return [sum];
```
          
      