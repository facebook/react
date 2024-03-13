
## Input

```javascript
function Component(props) {
  const items = [];

  for (let i = 0, length = props.items.length; i < length; i++) {
    items.push(props.items[i]);
  }

  return items;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  let items;
  if ($[0] !== props.items) {
    items = [];
    for (let i = 0; i < length; i++) {
      items.push(props.items[i]);
    }
    $[0] = props.items;
    $[1] = items;
  } else {
    items = $[1];
  }
  return items;
}

```
      