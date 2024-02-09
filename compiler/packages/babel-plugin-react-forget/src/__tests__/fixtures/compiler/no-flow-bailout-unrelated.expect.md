
## Input

```javascript
// @enableFlowSuppressions

function Foo(props) {
    // $FlowFixMe[incompatible-type]
    useX();
    const x = new Foo(...props.foo, null, ...[props.bar]);
    return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableFlowSuppressions

function Foo(props) {
  const $ = useMemoCache(3);

  useX();
  let t0;
  if ($[0] !== props.bar || $[1] !== props.foo) {
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
      