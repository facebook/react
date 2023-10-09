
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
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.text;
  let t0;
  if (c_0) {
    t0 = (
      <Foo
        value={fbt._(
          "{value}%",
          [fbt._param("value", <>{identity(props.text)}</>)],
          { hk: "10F5Cc" }
        )}
      />
    );
    $[0] = props.text;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      