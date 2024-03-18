
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import { useMemo } from "react";

function useHook(maybeRef, shouldRead) {
  return useMemo(() => {
    return () => [maybeRef.current];
  }, [shouldRead, maybeRef]);
}

```


## Error

```
[ReactForget] Todo: Could not preserve manual memoization because an inferred dependency does not match the dependency list in source. The inferred dependency was `maybeRef.current`, but the source dependencies were [shouldRead, maybeRef]
```
          
      