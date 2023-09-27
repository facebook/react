
## Input

```javascript
function Component(props) {
  const count = new MaybeMutable();
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
  const $ = useMemoCache(11);
  let t1;
  let T2;
  let t3;
  let t0;
  let t4;
  let T5;
  let t6;
  let t7;
  let t8;
  let t9;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const count = new MaybeMutable();

    T5 = View;
    t6 = "\n      ";
    T2 = View;
    t3 = "\n        ";
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <span>Text</span>;
      $[10] = t0;
    } else {
      t0 = $[10];
    }
    t4 = "\n        ";
    t1 = maybeMutate(count);
    t7 = <span>{t1}</span>;
    t8 = (
      <T2>
        {t3}
        {t0}
        {t4}
        {t7}
      </T2>
    );
    t9 = (
      <T5>
        {t6}
        {t8}
      </T5>
    );
    $[0] = t1;
    $[1] = T2;
    $[2] = t3;
    $[3] = t0;
    $[4] = t4;
    $[5] = T5;
    $[6] = t6;
    $[7] = t7;
    $[8] = t8;
    $[9] = t9;
  } else {
    t1 = $[0];
    T2 = $[1];
    t3 = $[2];
    t0 = $[3];
    t4 = $[4];
    T5 = $[5];
    t6 = $[6];
    t7 = $[7];
    t8 = $[8];
    t9 = $[9];
  }
  return t9;
}

```
      