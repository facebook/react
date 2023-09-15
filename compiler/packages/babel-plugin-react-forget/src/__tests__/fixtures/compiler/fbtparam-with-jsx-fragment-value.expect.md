
## Input

```javascript
import fbt from "fbt";
import { identity } from "shared-runtime";

function Component(props) {
  return (
    <Foo
      value={
        <fbt desc="Description of the parameter">
          <fbt:param name="value">{<>{identity(props.text)}</>}</fbt:param>%
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
import { identity } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(4);
  const c_0 = $[0] !== props.text;
  let t0;
  if (c_0) {
    t0 = fbt._("{value}%", [fbt._param("value", <>{identity(props.text)}</>)], {
      hk: "10F5Cc",
    });
    $[0] = props.text;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const c_2 = $[2] !== t0;
  let t1;
  if (c_2) {
    t1 = <Foo value={t0} />;
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      