
## Input

```javascript
function Component(props) {
  const x = new Foo(...props.foo, null, ...[props.bar]);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== props.bar;
  const c_1 = $[1] !== props.foo;
  let t0;
  if (c_0 || c_1) {
    t0 = new Foo(...props.foo, null, ...[props.bar]);
    $[0] = props.bar;
    $[1] = props.foo;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const x = t0;
  return x;
}

```
      