
## Input

```javascript
import { useActionState } from "react";

function Component() {
  const [actionState, dispatchAction] = useActionState();
  const onSubmitAction = () => {
    dispatchAction();
  };
  return <Foo onSubmitAction={onSubmitAction} />;
}

function Foo() {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useActionState } from "react";

function Component() {
  const $ = _c(2);
  const [actionState, dispatchAction] = useActionState();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      dispatchAction();
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onSubmitAction = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Foo onSubmitAction={onSubmitAction} />;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

function Foo() {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) 