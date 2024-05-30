
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  const [value, setValue] = useState(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (e) => setValue((value_0) => value_0 + e.target.value);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onChange = t0;

  useOtherHook();
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    const x = {};

    t1 = x;
    foo(x, onChange);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      