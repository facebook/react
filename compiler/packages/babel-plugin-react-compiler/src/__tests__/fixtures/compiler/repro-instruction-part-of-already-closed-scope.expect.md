
## Input

```javascript
// @enableAssumeHooksFollowRulesOfReact
import { Stringify, identity, useHook } from "shared-runtime";

function Component({ index }) {
  const data = useHook();

  const a = identity(data, index);
  const b = identity(data, index);
  const c = identity(data, index);

  return (
    <div>
      <Stringify value={identity(b)} />
      <Stringify value={identity(a)} />
      <Stringify value={identity(c)} />
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ index: 0 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableAssumeHooksFollowRulesOfReact
import { Stringify, identity, useHook } from "shared-runtime";

function Component(t0) {
  const $ = _c(19);
  const data = useHook();
  const { index } = t0;
  let t1;
  if ($[0] !== data || $[1] !== index) {
    const b = identity(data, index);

    t1 = identity(b);
    $[0] = data;
    $[1] = index;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== t1) {
    t2 = <Stringify value={t1} />;
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== data || $[6] !== index) {
    const a = identity(data, index);
    t3 = identity(a);
    $[5] = data;
    $[6] = index;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  let t4;
  if ($[8] !== t3) {
    t4 = <Stringify value={t3} />;
    $[8] = t3;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  let t5;
  if ($[10] !== data || $[11] !== index) {
    const c = identity(data, index);
    t5 = identity(c);
    $[10] = data;
    $[11] = index;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  let t6;
  if ($[13] !== t5) {
    t6 = <Stringify value={t5} />;
    $[13] = t5;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  let t7;
  if ($[15] !== t2 || $[16] !== t4 || $[17] !== t6) {
    t7 = (
      <div>
        {t2}
        {t4}
        {t6}
      </div>
    );
    $[15] = t2;
    $[16] = t4;
    $[17] = t6;
    $[18] = t7;
  } else {
    t7 = $[18];
  }
  return t7;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ index: 0 }],
};

```
      
### Eval output
(kind: ok) <div><div>{"value":{"a":0,"b":"value1","c":true}}</div><div>{"value":{"a":0,"b":"value1","c":true}}</div><div>{"value":{"a":0,"b":"value1","c":true}}</div></div>