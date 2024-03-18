
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import { useCallback } from "react";
import { mutate } from "shared-runtime";

function Component({ propA, propB }) {
  return useCallback(() => {
    const x = {};
    if (propA?.a) {
      mutate(x);
      return {
        value: propB.x.y,
      };
    }
  }, [propA?.a, propB.x.y]);
}

```


## Error

```
[ReactForget] Todo: Could not preserve manual memoization because an inferred dependency does not match the dependency list in source. The inferred dependency was `propA`, but the source dependencies were [propA.a, propB.x.y]
```
          
      