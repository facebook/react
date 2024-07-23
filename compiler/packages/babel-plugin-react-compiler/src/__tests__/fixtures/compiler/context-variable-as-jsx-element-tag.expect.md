
## Input

```javascript
import {useMemo} from 'react';
import {Stringify} from 'shared-runtime';

function Component(props) {
  let Component = Stringify;

  Component = useMemo(() => {
    return Component;
  });

  return <Component {...props} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{name: 'Sathya'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { Stringify } from "shared-runtime";

function Component(props) {
  const $ = _c(3);
  let Component;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    Component = Stringify;

    Component;
    let t0;
    t0 = Component;
    Component = t0;
    $[0] = Component;
  } else {
    Component = $[0];
  }
  let t0;
  if ($[1] !== props) {
    t0 = <Component {...props} />;
    $[1] = props;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ name: "Sathya" }],
};

```
      
### Eval output
(kind: ok) <div>{"name":"Sathya"}</div>