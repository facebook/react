
## Input

```javascript
function Component(props) {
  let x = {};
  // onChange should be inferred as immutable, because the value
  // it captures (`x`) is frozen by the time the function is referenced
  const onChange = (e) => {
    maybeMutate(x, e.target.value);
  };
  if (props.cond) {
    <div>{x}</div>;
  }
  // ideally this call would be outside the memoization block for `x`
  onChange();
  return <Foo value={x} />;
}

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
function Component(props) {
  const $ = useMemoCache(4);
  let x;
  if ($[0] !== props.cond) {
    x = {};

    const onChange = (e) => {
      maybeMutate(x, e.target.value);
    };
    if (props.cond) {
    }

    onChange();
    $[0] = props.cond;
    $[1] = x;
  } else {
    x = $[1];
  }
  let t0;
  if ($[2] !== x) {
    t0 = <Foo value={x} />;
    $[2] = x;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

```
      