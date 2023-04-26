
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
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(21);
  const item = useFragment(FRAGMENT, props.item);
  useFreeze(item);
  const c_0 = $[0] !== item;
  let t1;
  let T2;
  let t3;
  let t0;
  let t4;
  let T5;
  let t6;
  if (c_0) {
    const count = new MaybeMutable(item);

    T5 = View;
    t6 = "\n      ";
    T2 = View;
    t3 = "\n        ";
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <span>Text</span>;
      $[8] = t0;
    } else {
      t0 = $[8];
    }
    t4 = "\n        ";
    t1 = maybeMutate(count);
    $[0] = item;
    $[1] = t1;
    $[2] = T2;
    $[3] = t3;
    $[4] = t0;
    $[5] = t4;
    $[6] = T5;
    $[7] = t6;
  } else {
    t1 = $[1];
    T2 = $[2];
    t3 = $[3];
    t0 = $[4];
    t4 = $[5];
    T5 = $[6];
    t6 = $[7];
  }
  const c_9 = $[9] !== t1;
  let t7;
  if (c_9) {
    t7 = <span>{t1}</span>;
    $[9] = t1;
    $[10] = t7;
  } else {
    t7 = $[10];
  }
  const c_11 = $[11] !== T2;
  const c_12 = $[12] !== t3;
  const c_13 = $[13] !== t0;
  const c_14 = $[14] !== t4;
  const c_15 = $[15] !== t7;
  let t8;
  if (c_11 || c_12 || c_13 || c_14 || c_15) {
    t8 = (
      <T2>
        {t3}
        {t0}
        {t4}
        {t7}
      </T2>
    );
    $[11] = T2;
    $[12] = t3;
    $[13] = t0;
    $[14] = t4;
    $[15] = t7;
    $[16] = t8;
  } else {
    t8 = $[16];
  }
  const c_17 = $[17] !== T5;
  const c_18 = $[18] !== t6;
  const c_19 = $[19] !== t8;
  let t9;
  if (c_17 || c_18 || c_19) {
    t9 = (
      <T5>
        {t6}
        {t8}
      </T5>
    );
    $[17] = T5;
    $[18] = t6;
    $[19] = t8;
    $[20] = t9;
  } else {
    t9 = $[20];
  }
  return t9;
}

```
      