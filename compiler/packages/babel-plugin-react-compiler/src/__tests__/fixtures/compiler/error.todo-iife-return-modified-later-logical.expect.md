
## Input

```javascript
import { getNull } from "shared-runtime";

function Component(props) {
  const items = (() => {
    return getNull() ?? [];
  })();
  items.push(props.a);
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: {} }],
};

```


## Error

```
Invariant: Invalid nesting in program blocks or scopes. Items overlap but are not nested: 2:15(3:22)
```
          
      