
## Input

```javascript
function Component(props) {
  const item = useFragment(FRAGMENT, props.item);
  useFreeze(item);

  const count = new MaybeMutable(item);
  return (
    <View>
      <View>
        {<span>Text</span>}
        {<span>{maybeMutate(count)}</span>}
      </View>
    </View>
  );
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(21);
  const item = useFragment(FRAGMENT, props.item);
  useFreeze(item);
  const c_0 = $[0] !== item;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  let t7;
  if (c_0) {
    const count = new MaybeMutable(item);

    t6 = View;
    t7 = "\n      ";
    t3 = View;
    t4 = "\n        ";
    let t0;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <span>Text</span>;
      $[8] = t0;
    } else {
      t0 = $[8];
    }
    t5 = "\n        ";
    t1 = "span";
    t2 = maybeMutate(count);
    $[0] = item;
    $[1] = t1;
    $[2] = t2;
    $[3] = t3;
    $[4] = t4;
    $[5] = t5;
    $[6] = t6;
    $[7] = t7;
  } else {
    t1 = $[1];
    t2 = $[2];
    t3 = $[3];
    t4 = $[4];
    t5 = $[5];
    t6 = $[6];
    t7 = $[7];
  }
  const c_9 = $[9] !== t1;
  const c_10 = $[10] !== t2;
  let t8;
  if (c_9 || c_10) {
    t8 = <t1>{t2}</t1>;
    $[9] = t1;
    $[10] = t2;
    $[11] = t8;
  } else {
    t8 = $[11];
  }
  const c_12 = $[12] !== t3;
  const c_13 = $[13] !== t4;
  const c_14 = $[14] !== t5;
  const c_15 = $[15] !== t8;
  let t9;
  if (c_12 || c_13 || c_14 || c_15) {
    t9 = (
      <t3>
        {t4}
        {t0}
        {t5}
        {t8}
      </t3>
    );
    $[12] = t3;
    $[13] = t4;
    $[14] = t5;
    $[15] = t8;
    $[16] = t9;
  } else {
    t9 = $[16];
  }
  const c_17 = $[17] !== t6;
  const c_18 = $[18] !== t7;
  const c_19 = $[19] !== t9;
  let t10;
  if (c_17 || c_18 || c_19) {
    t10 = (
      <t6>
        {t7}
        {t9}
      </t6>
    );
    $[17] = t6;
    $[18] = t7;
    $[19] = t9;
    $[20] = t10;
  } else {
    t10 = $[20];
  }
  return t10;
}

```
      