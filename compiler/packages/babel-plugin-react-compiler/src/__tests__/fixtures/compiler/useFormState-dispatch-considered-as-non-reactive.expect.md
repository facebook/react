
## Input

```javascript
import { useFormState } from "react-dom";

function Component() {
  const [formState, dispatchForm] = useFormState();
  const onSubmitForm = () => {
    dispatchForm();
  };
  return <Foo onSubmitForm={onSubmitForm} />;
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
import { useFormState } from "react-dom";

function Component() {
  const $ = _c(2);
  const [formState, dispatchForm] = useFormState();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      dispatchForm();
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onSubmitForm = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Foo onSubmitForm={onSubmitForm} />;
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