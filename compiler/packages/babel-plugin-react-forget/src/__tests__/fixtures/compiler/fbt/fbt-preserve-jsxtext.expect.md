
## Input

```javascript
import fbt from "fbt";

function Foo(props) {
  return (
    <fbt desc="Some text to be translated">
      <fbt:enum
        enum-range={{ "0": "hello", "1": "goodbye" }}
        value={props.value ? "0" : "1"}
      />{" "}
      <fbt:param name="value">{props.value}</fbt:param>
      {", "}
    </fbt>
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import fbt from "fbt";

function Foo(props) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== props.value) {
    t0 = fbt._(
      { "0": "hello {value},", "1": "goodbye {value}," },
      [
        fbt._enum(props.value ? "0" : "1", { "0": "hello", "1": "goodbye" }),
        fbt._param(
          "value",

          props.value
        ),
      ],
      { hk: "Ri5kJ" }
    );
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      