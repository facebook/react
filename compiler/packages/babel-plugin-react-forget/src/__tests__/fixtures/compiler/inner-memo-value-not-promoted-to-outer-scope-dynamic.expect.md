
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
  let t1;
  let T2;
  let t0;
  let T3;
  if ($[0] !== item) {
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
  let t4;
  if ($[6] !== t1) {
    t4 = <span>{t1}</span>;
    $[6] = t1;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== T2 || $[9] !== t0 || $[10] !== t4) {
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
  let t6;
  if ($[12] !== T3 || $[13] !== t5) {
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
      