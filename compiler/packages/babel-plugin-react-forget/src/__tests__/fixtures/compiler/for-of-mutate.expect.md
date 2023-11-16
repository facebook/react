
## Input

```javascript
import { makeObject_Primitives, mutate, Stringify } from "shared-runtime";

function Component(_props) {
  const collection = [makeObject_Primitives()];
  const results = [];
  for (const item of collection) {
    results.push(<div key={Stringify(item)}>{Stringify(mutate(item))}</div>);
  }
  return <div>{results}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { makeObject_Primitives, mutate, Stringify } from "shared-runtime";

function Component(_props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const collection = [makeObject_Primitives()];
    const results = [];
    for (const item of collection) {
      results.push(<div key={Stringify(item)}>{Stringify(mutate(item))}</div>);
    }

    t0 = <div>{results}</div>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><div><div></div></div></div>