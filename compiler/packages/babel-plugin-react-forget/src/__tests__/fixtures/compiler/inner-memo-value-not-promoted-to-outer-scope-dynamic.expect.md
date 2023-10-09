
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
  const $ = useMemoCache(15);
  const item = useFragment(FRAGMENT, props.item);
  useFreeze(item);
  const c_0 = $[0] !== item;
  let t1;
  let T2;
  let t0;
  let T3;
  if (c_0) {
    const count = new MaybeMutable(item);

    T3 = View;
    T2 = View;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <span>Text</span>;
      $[5] = t0;
    } else {
      t0 = $[5];
    }
    t1 = maybeMutate(count);
    $[0] = item;
    $[1] = t1;
    $[2] = T2;
    $[3] = t0;
    $[4] = T3;
  } else {
    t1 = $[1];
    T2 = $[2];
    t0 = $[3];
    T3 = $[4];
  }
  const c_6 = $[6] !== t1;
  let t4;
  if (c_6) {
    t4 = <span>{t1}</span>;
    $[6] = t1;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  const c_8 = $[8] !== T2;
  const c_9 = $[9] !== t0;
  const c_10 = $[10] !== t4;
  let t5;
  if (c_8 || c_9 || c_10) {
    t5 = (
      <T2>
        {t0}
        {t4}
      </T2>
    );
    $[8] = T2;
    $[9] = t0;
    $[10] = t4;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  const c_12 = $[12] !== T3;
  const c_13 = $[13] !== t5;
  let t6;
  if (c_12 || c_13) {
    t6 = <T3>{t5}</T3>;
    $[12] = T3;
    $[13] = t5;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  return t6;
}

```
      