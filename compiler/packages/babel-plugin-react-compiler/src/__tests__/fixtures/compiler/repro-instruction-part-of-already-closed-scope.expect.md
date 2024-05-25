
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
  const $ = _c(15);
  const { index } = t0;
  const data = useHook();
  let t1;
  let t2;
  let t3;
  if ($[0] !== data || $[1] !== index) {
    const a = identity(data, index);
    const b = identity(data, index);
    const c = identity(data, index);

    t3 = identity(b);
    t2 = identity(a);
    t1 = identity(c);
    $[0] = data;
    $[1] = index;
    $[2] = t1;
    $[3] = t2;
    $[4] = t3;
  } else {
    t1 = $[2];
    t2 = $[3];
    t3 = $[4];
  }
  let t4;
  if ($[5] !== t1) {
    t4 = <Stringify value={t1} />;
    $[5] = t1;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] !== t2) {
    t5 = <Stringify value={t2} />;
    $[7] = t2;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  let t6;
  if ($[9] !== t3) {
    t6 = <Stringify value={t3} />;
    $[9] = t3;
    $[10] = t6;
  } else {
    t6 = $[10];
  }
  let t7;
  if ($[11] !== t6 || $[12] !== t5 || $[13] !== t4) {
    t7 = (
      <div>
        {t6}
        {t5}
        {t4}
      </div>
    );
    $[11] = t6;
    $[12] = t5;
    $[13] = t4;
    $[14] = t7;
  } else {
    t7 = $[14];
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