
## Input

```javascript
function Component(props) {
  const object = makeObject(props);
  return object?.[props.key];
}

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
function Component(props) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== props) {
    t0 = makeObject(props);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const object = t0;
  return object?.[props.key];
}

```
      