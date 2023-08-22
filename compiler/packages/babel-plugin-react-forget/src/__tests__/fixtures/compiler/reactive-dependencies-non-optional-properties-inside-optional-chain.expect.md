
## Input

```javascript
function Component(props) {
  return props.post.feedback.comments?.edges?.map(render);
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.post.feedback.comments;
  let t0;
  if (c_0) {
    t0 = props.post.feedback.comments?.edges?.map(render);
    $[0] = props.post.feedback.comments;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      