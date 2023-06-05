
## Input

```javascript
import fbt from "fbt";

export function Component(props) {
  let count = 0;
  if (props.items) {
    count = props.items.length;
  }
  return (
    <View>
      {fbt(
        `for ${fbt.param("count", count)} experiences`,
        `Label for the number of items`,
        { project: "public" }
      )}
    </View>
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import fbt from "fbt";

export function Component(props) {
  const $ = useMemoCache(4);
  let count = 0;
  if (props.items) {
    count = props.items.length;
  }
  const c_0 = $[0] !== count;
  let t0;
  if (c_0) {
    t0 = fbt._("for {count} experiences", [fbt._param("count", count)], {
      hk: "nmYpm",
    });
    $[0] = count;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const c_2 = $[2] !== t0;
  let t1;
  if (c_2) {
    t1 = <View>{t0}</View>;
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      