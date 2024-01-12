
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import { useCallback } from "react";

function Component({ entity, children }) {
  const showMessage = useCallback(() => entity != null);

  // We currently model functions as if they could escape intor their return value
  // but if we ever changed that (or did optimization to figure out cases where they
  // are known not to) we could get a false positive validation error here, since
  // showMessage doesn't need to be memoized since it doesn't escape in this instance.
  const shouldShowMessage = showMessage();
  return (
    <div>
      <div>{shouldShowMessage}</div>
      <div>{children}</div>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      entity: { name: "Sathya" },
      children: [<div key="gsathya">Hi Sathya!</div>],
    },
  ],
};

```

## Code

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import { useCallback, unstable_useMemoCache as useMemoCache } from "react";

function Component(t26) {
  const $ = useMemoCache(11);
  const { entity, children } = t26;
  let t0;
  if ($[0] !== entity) {
    t0 = () => entity != null;
    $[0] = entity;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const showMessage = t0;
  let t1;
  if ($[2] !== showMessage) {
    t1 = showMessage();
    $[2] = showMessage;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const shouldShowMessage = t1;
  let t2;
  if ($[4] !== shouldShowMessage) {
    t2 = <div>{shouldShowMessage}</div>;
    $[4] = shouldShowMessage;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== children) {
    t3 = <div>{children}</div>;
    $[6] = children;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  let t4;
  if ($[8] !== t2 || $[9] !== t3) {
    t4 = (
      <div>
        {t2}
        {t3}
      </div>
    );
    $[8] = t2;
    $[9] = t3;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      entity: { name: "Sathya" },
      children: [<div key="gsathya">Hi Sathya!</div>],
    },
  ],
};

```
      
### Eval output
(kind: ok) <div><div></div><div><div>Hi Sathya!</div></div></div>