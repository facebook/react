
## Input

```javascript
import { useMemo } from "react";
import { Stringify } from "shared-runtime";

function Component(props) {
  let Component = Stringify;

  Component = useMemo(() => {
    return Component;
  });

  return <Component {...props} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ name: "Sathya" }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { Stringify } from "shared-runtime";

function Component(props) {
  const $ = _c(4);
  let t0;
  let Component;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    Component = Stringify;

    Component;
    t0 = Component;
    Component = t0;
    $[0] = Component;
    $[1] = t0;
  } else {
    Component = $[0];
    t0 = $[1];
  }
  let t1;
  if ($[2] !== props) {
    t1 = <Component {...props} />;
    $[2] = props;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ name: "Sathya" }],
};

```
      
### Eval output
(kind: ok) <div>{"name":"Sathya"}</div>