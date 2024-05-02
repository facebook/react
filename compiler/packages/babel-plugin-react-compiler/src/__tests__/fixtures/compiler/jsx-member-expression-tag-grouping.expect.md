
## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  return <Foo.Bar>{maybeMutate(maybeMutable)}</Foo.Bar>;
}

```

## Code

```javascript
import { c as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const maybeMutable = new MaybeMutable();
    t0 = <Foo.Bar>{maybeMutate(maybeMutable)}</Foo.Bar>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      