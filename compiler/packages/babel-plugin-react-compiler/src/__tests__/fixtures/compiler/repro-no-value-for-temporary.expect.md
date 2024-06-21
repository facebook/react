
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
  const $ = _c(6);
  let t0;
  let t1;
  if ($[0] !== thread.threadType || $[1] !== listItem) {
    const isFoo = isFooThread(thread.threadType);
    t1 = listItem;
    t0 = getBadgeText(listItem, isFoo);
    $[0] = thread.threadType;
    $[1] = listItem;
    $[2] = t0;
    $[3] = t1;
  } else {
    t0 = $[2];
    t1 = $[3];
  }
  let t2;
  if ($[4] !== t0) {
    t2 = [t0];
    $[4] = t0;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const body = useBar(t1, t2);
  return body;
}

```
      
### Eval output
(kind: exception) Fixture not implemented