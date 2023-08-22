
## Input

```javascript
import { StaticText1, StaticText2 } from "shared-runtime";

function Component(props: { value: string }) {
  let Tag = StaticText1;

  // Currently, Forget preserves jsx whitespace in the source text.
  // prettier-ignore
  return (
    <Tag>{((Tag = StaticText2), props.value)}<Tag /></Tag>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "string value 1" }],
  isComponent: true,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { StaticText1, StaticText2 } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(3);

  const t1 = props.value;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <StaticText2 />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const c_1 = $[1] !== t1;
  let t2;
  if (c_1) {
    t2 = (
      <StaticText1>
        {t1}
        {t0}
      </StaticText1>
    );
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "string value 1" }],
  isComponent: true,
};

```
      