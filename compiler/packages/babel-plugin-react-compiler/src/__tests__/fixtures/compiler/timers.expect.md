
## Input

```javascript
function Component(props) {
  const start = performance.now();
  const now = Date.now();
  const time = performance.now() - start;
  return (
    <div>
      rendering took {time} at {now}
    </div>
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(1);
  const start = performance.now();

  const time = performance.now() - start;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const now = Date.now();

    t0 = (
      <div>
        rendering took
        {time} at {now}
      </div>
    );
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      