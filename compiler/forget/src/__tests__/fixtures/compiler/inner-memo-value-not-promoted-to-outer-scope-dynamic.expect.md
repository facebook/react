
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
  const $ = useMemoCache(23);
  const item = useFragment(FRAGMENT, props.item);
  useFreeze(item);
  const c_0 = $[0] !== item;
  let T1;
  let t2;
  let T3;
  let t4;
  let t0;
  let t5;
  let T6;
  let t7;
  if (c_0) {
    const count = new MaybeMutable(item);

    T6 = View;
    t7 = "\n      ";
    T3 = View;
    t4 = "\n        ";
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <span>Text</span>;
      $[9] = t0;
    } else {
      t0 = $[9];
    }
    t5 = "\n        ";
    T1 = "span";
    t2 = maybeMutate(count);
    $[0] = item;
    $[1] = T1;
    $[2] = t2;
    $[3] = T3;
    $[4] = t4;
    $[5] = t0;
    $[6] = t5;
    $[7] = T6;
    $[8] = t7;
  } else {
    T1 = $[1];
    t2 = $[2];
    T3 = $[3];
    t4 = $[4];
    t0 = $[5];
    t5 = $[6];
    T6 = $[7];
    t7 = $[8];
  }
  const c_10 = $[10] !== T1;
  const c_11 = $[11] !== t2;
  let t8;
  if (c_10 || c_11) {
    t8 = <T1>{t2}</T1>;
    $[10] = T1;
    $[11] = t2;
    $[12] = t8;
  } else {
    t8 = $[12];
  }
  const c_13 = $[13] !== T3;
  const c_14 = $[14] !== t4;
  const c_15 = $[15] !== t0;
  const c_16 = $[16] !== t5;
  const c_17 = $[17] !== t8;
  let t9;
  if (c_13 || c_14 || c_15 || c_16 || c_17) {
    t9 = (
      <T3>
        {t4}
        {t0}
        {t5}
        {t8}
      </T3>
    );
    $[13] = T3;
    $[14] = t4;
    $[15] = t0;
    $[16] = t5;
    $[17] = t8;
    $[18] = t9;
  } else {
    t9 = $[18];
  }
  const c_19 = $[19] !== T6;
  const c_20 = $[20] !== t7;
  const c_21 = $[21] !== t9;
  let t10;
  if (c_19 || c_20 || c_21) {
    t10 = (
      <T6>
        {t7}
        {t9}
      </T6>
    );
    $[19] = T6;
    $[20] = t7;
    $[21] = t9;
    $[22] = t10;
  } else {
    t10 = $[22];
  }
  return t10;
}

```
      