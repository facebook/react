
## Input

```javascript
import fbt from "fbt";
/**
 * TODO: remove this from SproutTodoFilter when fixed.
 */

function Component({ value }: { value: string }) {
  return (
    <fbt desc="descdesc">
      Before text
      <fbt:param name="paramName">{value}</fbt:param>
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
/**
 * TODO: remove this from SproutTodoFilter when fixed.
 */

function Component(t11) {
  const $ = useMemoCache(2);
  const { value } = t11;
  let t0;
  if ($[0] !== value) {
    t0 = fbt._(
      "Before text{paramName}",
      [
        fbt._param(
          "paramName",

          value
        ),
      ],
      { hk: "3DIRxJ" }
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
      