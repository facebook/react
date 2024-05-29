
## Input

```javascript
import { arrayPush } from "shared-runtime";

function useFoo({ value }) {
  let items = null;
  try {
    // Mutable range of `items` begins here, but its reactive scope block
    // should be aligned to above the try-block
    items = [];
    arrayPush(items, value);
  } catch {
    // ignore
  }
  mutate(items);
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ value: 2 }],
  sequentialRenders: [{ value: 2 }, { value: 2 }, { value: 3 }],
};

```


## Error

```
Invariant: Invalid nesting in program blocks or scopes. Items overlap but are not nested: 3:17(4:20)
```
          
      