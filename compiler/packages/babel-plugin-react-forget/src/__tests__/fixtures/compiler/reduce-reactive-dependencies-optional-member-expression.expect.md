
## Input

```javascript
function Component(props) {
  const x = [];
  x.push(props.items?.length);
  x.push(props.items?.edges?.map?.(render)?.filter?.(Boolean) ?? []);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  let x;
  if ($[0] !== props.items) {
    x = [];
    x.push(props.items?.length);
    x.push(props.items?.edges?.map?.(render)?.filter?.(Boolean) ?? []);
    $[0] = props.items;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      