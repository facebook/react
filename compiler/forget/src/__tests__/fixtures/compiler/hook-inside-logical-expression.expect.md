
## Input

```javascript
function Component(props) {
  const user = useFragment(graphql`...`, props.user) ?? {};
  return user.name;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.user;
  let t0;
  if (c_0) {
    t0 = useFragment(graphql`...`, props.user) ?? {};
    $[0] = props.user;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const user = t0;
  return user.name;
}

```
      