
## Input

```javascript
import {Stringify, useIdentity} from 'shared-runtime';

function Component({prop1, prop2}) {
  'use memo';

  const data = useIdentity(
    new Map([
      [0, 'value0'],
      [1, 'value1'],
    ])
  );
  let i = 0;
  const items = [];
  items.push(
    <Stringify
      key={i}
      onClick={() => data.get(i) + prop1}
      shouldInvokeFns={true}
    />
  );
  i = i + 1;
  items.push(
    <Stringify
      key={i}
      onClick={() => data.get(i) + prop2}
      shouldInvokeFns={true}
    />
  );
  return <>{items}</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prop1: 'prop1', prop2: 'prop2'}],
  sequentialRenders: [
    {prop1: 'prop1', prop2: 'prop2'},
    {prop1: 'prop1', prop2: 'prop2'},
    {prop1: 'changed', prop2: 'prop2'},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify, useIdentity } from "shared-runtime";

function Component(t0) {
  "use memo";
  const $ = _c(12);
  const { prop1, prop2 } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = new Map([
      [0, "value0"],
      [1, "value1"],
    ]);
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const data = useIdentity(t1);
  let t2;
  if ($[1] !== data || $[2] !== prop1 || $[3] !== prop2) {
    let i = 0;
    const items = [];
    items.push(
      <Stringify
        key={i}
        onClick={() => data.get(i) + prop1}
        shouldInvokeFns={true}
      />,
    );
    i = i + 1;

    const t3 = i;
    let t4;
    if ($[5] !== data || $[6] !== i || $[7] !== prop2) {
      t4 = () => data.get(i) + prop2;
      $[5] = data;
      $[6] = i;
      $[7] = prop2;
      $[8] = t4;
    } else {
      t4 = $[8];
    }
    let t5;
    if ($[9] !== t3 || $[10] !== t4) {
      t5 = <Stringify key={t3} onClick={t4} shouldInvokeFns={true} />;
      $[9] = t3;
      $[10] = t4;
      $[11] = t5;
    } else {
      t5 = $[11];
    }
    items.push(t5);
    t2 = <>{items}</>;
    $[1] = data;
    $[2] = prop1;
    $[3] = prop2;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ prop1: "prop1", prop2: "prop2" }],
  sequentialRenders: [
    { prop1: "prop1", prop2: "prop2" },
    { prop1: "prop1", prop2: "prop2" },
    { prop1: "changed", prop2: "prop2" },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"onClick":{"kind":"Function","result":"value1prop1"},"shouldInvokeFns":true}</div><div>{"onClick":{"kind":"Function","result":"value1prop2"},"shouldInvokeFns":true}</div>
<div>{"onClick":{"kind":"Function","result":"value1prop1"},"shouldInvokeFns":true}</div><div>{"onClick":{"kind":"Function","result":"value1prop2"},"shouldInvokeFns":true}</div>
<div>{"onClick":{"kind":"Function","result":"value1changed"},"shouldInvokeFns":true}</div><div>{"onClick":{"kind":"Function","result":"value1prop2"},"shouldInvokeFns":true}</div>