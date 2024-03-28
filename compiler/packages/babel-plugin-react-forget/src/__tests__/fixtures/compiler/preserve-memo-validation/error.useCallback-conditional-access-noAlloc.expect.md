
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import { useCallback } from "react";

function Component({ propA, propB }) {
  return useCallback(() => {
    return {
      value: propB?.x.y,
      other: propA,
    };
  }, [propA, propB.x.y]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ propA: 2, propB: { x: { y: [] } } }],
};

```


## Error

```
Todo: Could not preserve manual memoization because an inferred dependency does not match the dependency list in source. The inferred dependency was `propB`, but the source dependencies were [propA, propB.x.y]. Detail: inferred less specific property than source
```
          
      