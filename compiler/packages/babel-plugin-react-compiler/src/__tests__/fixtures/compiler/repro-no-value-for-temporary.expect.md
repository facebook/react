
## Input

```javascript
// @flow @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
function Component(listItem, thread) {
  const isFoo = isFooThread(thread.threadType);
  const body = useBar(listItem, [getBadgeText(listItem, isFoo)]);

  return body;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(listItem, thread) {
  const $ = _c(5);
  let t0;
  if ($[0] !== thread.threadType || $[1] !== listItem) {
    const isFoo = isFooThread(thread.threadType);
    t0 = getBadgeText(listItem, isFoo);
    $[0] = thread.threadType;
    $[1] = listItem;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  let t1;
  if ($[3] !== t0) {
    t1 = [t0];
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const body = useBar(listItem, t1);
  return body;
}

```
      
### Eval output
(kind: exception) Fixture not implemented