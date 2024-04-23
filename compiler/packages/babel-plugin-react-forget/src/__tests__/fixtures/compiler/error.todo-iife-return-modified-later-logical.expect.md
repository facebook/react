
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
Invariant: Invalid nesting in program blocks or scopes. Blocks overlap but are not nested: ProgramBlockSubtree@0(2:15) Scope@0(3:21)
```
          
      