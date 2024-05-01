
## Input

```javascript
// @enablePreserveExistingMemoizationGuarantees:false @enableTransitivelyFreezeFunctionExpressions:false
import { useCallback } from "react";
import {
  identity,
  logValue,
  makeObject_Primitives,
  useHook,
} from "shared-runtime";

function Component(props) {
  const object = makeObject_Primitives();

  useHook();

  const log = () => {
    logValue(object);
  };

  const onClick = useCallback(() => {
    log();
  }, [log]);

  identity(object);

  return <div onClick={onClick} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
// @enablePreserveExistingMemoizationGuarantees:false @enableTransitivelyFreezeFunctionExpressions:false
import { useCallback, c as useMemoCache } from "react";
import {
  identity,
  logValue,
  makeObject_Primitives,
  useHook,
} from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(1);
  const object = makeObject_Primitives();

  useHook();

  const log = () => {
    logValue(object);
  };

  const onClick = () => {
    log();
  };

  identity(object);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div onClick={onClick} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div></div>