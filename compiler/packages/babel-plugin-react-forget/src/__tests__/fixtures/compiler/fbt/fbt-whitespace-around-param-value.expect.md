
## Input

```javascript
import fbt from "fbt";

const _ = fbt;
function Component({ value }: { value: string }) {
  return (
    <fbt desc="descdesc">
      Before text <fbt:param name="paramName"> {value} </fbt:param> after text
    </fbt>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "hello world" }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import fbt from "fbt";

const _ = fbt;
function Component(t0) {
  const $ = useMemoCache(2);
  const { value } = t0;
  let t1;
  if ($[0] !== value) {
    t1 = fbt._(
      "Before text {paramName} after text",
      [fbt._param("paramName", value)],
      { hk: "26pxNm" }
    );
    $[0] = value;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "hello world" }],
};

```
      
### Eval output
(kind: ok) Before text hello world after text