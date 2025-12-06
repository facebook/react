
## Input

```javascript
import {StaticText1, StaticText2} from 'shared-runtime';

function Component(props: {value: string}) {
  let Tag = StaticText1;

  // Currently, Forget preserves jsx whitespace in the source text.
  // prettier-ignore
  return (
    <Tag>{((Tag = StaticText2), props.value)}<Tag /></Tag>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'string value 1'}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { StaticText1, StaticText2 } from "shared-runtime";

function Component(props) {
  const $ = _c(3);

  const T0 = StaticText1;
  const t0 = props.value;
  const T1 = StaticText2;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <T1 />;
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] !== t0) {
    t2 = (
      <T0>
        {t0}
        {t1}
      </T0>
    );
    $[1] = t0;
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
      
### Eval output
(kind: ok) <div>StaticText1string value 1<div>StaticText2</div></div>