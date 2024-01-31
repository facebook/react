
## Input

```javascript
import { identity } from "shared-runtime";
function useInvalid() {
  const x = identity(x);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useInvalid,
  params: [],
};

```


## Error

```
[ReactForget] Todo: [hoisting] EnterSSA: Expected identifier to be defined before being used. Identifier x$1 is undefined (3:3)
```
          
      