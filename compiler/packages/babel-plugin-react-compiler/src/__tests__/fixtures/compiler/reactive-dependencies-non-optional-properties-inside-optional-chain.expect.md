
## Input

```javascript
function Component(props) {
  return props.post.feedback.comments?.edges?.map(render);
}

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
function Component(props) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== props.post.feedback.comments) {
    t0 = props.post.feedback.comments?.edges?.map(render);
    $[0] = props.post.feedback.comments;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      