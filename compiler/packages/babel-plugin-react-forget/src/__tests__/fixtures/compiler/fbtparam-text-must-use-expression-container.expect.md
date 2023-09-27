
## Input

```javascript
import fbt from "fbt";

function Component(props) {
  return (
    <Foo
      value={
        <fbt desc="Description of the parameter">
          <fbt:param name="value">{"0"}</fbt:param>%
        </fbt>
      }
    />
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import fbt from "fbt";

function Component(props) {
  const $ = useMemoCache(2);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = fbt._("{value}%", [fbt._param("value", "0")], { hk: "10F5Cc" });
    t1 = <Foo value={t0} />;
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  return t1;
}

```
      