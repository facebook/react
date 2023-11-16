
## Input

```javascript
import fbt from "fbt";

const _ = fbt;
function Component({ value }: { value: string }) {
  return (
    <fbt desc="descdesc">
      Before text<fbt:param name="paramName">{value}</fbt:param>After text
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
function Component(t12) {
  const $ = useMemoCache(2);
  const { value } = t12;
  let t0;
  if ($[0] !== value) {
    t0 = fbt._(
      "Before text{paramName}After text",
      [fbt._param("paramName", value)],
      { hk: "aKEGX" }
    );
    $[0] = value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "hello world" }],
};

```
      
### Eval output
(kind: ok) Before texthello worldAfter text