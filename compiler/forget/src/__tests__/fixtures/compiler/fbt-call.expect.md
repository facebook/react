
## Input

```javascript
import fbt from "fbt";

function Component(props) {
  const text = fbt(
    `${fbt.param("(key) count", props.count)} items`,
    "(description) Number of items"
  );
  return <div>{text}</div>;
}

```

## Code

```javascript
import fbt from "fbt";

function Component(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props.count;
  let t0;
  if (c_0) {
    t0 = fbt._(
      "{(key) count} items",
      [fbt._param("(key) count", props.count)],
      { hk: "3yW91j" }
    );
    $[0] = props.count;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const text = t0;
  const c_2 = $[2] !== text;
  let t1;
  if (c_2) {
    t1 = <div>{text}</div>;
    $[2] = text;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      