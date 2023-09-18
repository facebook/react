
## Input

```javascript
function Component(props) {
  const user = useFragment(graphql`fragment on User { name }`, props.user);
  return user.name;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = graphql`fragment on User { name }`;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const user = useFragment(t0, props.user);
  return user.name;
}

```
      