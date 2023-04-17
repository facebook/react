
## Input

```javascript
function Component(props) {
  return (
    <Sathya.Codes.Forget>
      <Foo.Bar.Baz />
    </Sathya.Codes.Forget>
  );
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Foo.Bar.Baz />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Sathya.Codes.Forget>{t0}</Sathya.Codes.Forget>;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      