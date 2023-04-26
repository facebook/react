
## Input

```javascript
function Component(props) {
  const [value, setValue] = useState(null);
  // NOTE: this lambda does not capture any mutable values (only the state setter)
  // and thus should be treated as readonly
  const onChange = (e) => setValue((value) => value + e.target.value);

  useOtherHook();

  // x should be independently memoizeable, since foo(x, onChange) cannot modify onChange
  const x = {};
  foo(x, onChange);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  const [value, setValue] = useState(null);
  const c_0 = $[0] !== setValue;
  let t0;
  if (c_0) {
    t0 = (e) => setValue((value_0) => value_0 + e.target.value);
    $[0] = setValue;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onChange = t0;

  useOtherHook();
  const c_2 = $[2] !== onChange;
  let x;
  if (c_2) {
    x = {};
    foo(x, onChange);
    $[2] = onChange;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

```
      