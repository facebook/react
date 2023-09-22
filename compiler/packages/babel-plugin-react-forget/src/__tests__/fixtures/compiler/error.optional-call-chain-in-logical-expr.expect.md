
## Input

```javascript
import { useNoAlias } from "shared-runtime";

function useFoo(props: { value: { x: string; y: string } | null }) {
  const value = props.value;
  return useNoAlias(value?.x, value?.y) ?? {};
}

export const FIXTURE_ENTRYPONT = {
  fn: useFoo,
  props: [{ value: null }],
};

```


## Error

```
[ReactForget] Invariant: Unexpected terminal kind 'optional' for logical test block (5:5)
```
          
      