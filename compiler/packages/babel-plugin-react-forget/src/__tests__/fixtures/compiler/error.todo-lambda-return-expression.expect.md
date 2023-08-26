
## Input

```javascript
import { invoke } from "shared-runtime";

function useFoo() {
  const x = {};
  const result = invoke(() => x);
  console.log(result);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
  isComponent: false,
};

```


## Error

```
[ReactForget] Invariant: Expected value for identifier `16` to be initialized. (5:5)
```
          
      