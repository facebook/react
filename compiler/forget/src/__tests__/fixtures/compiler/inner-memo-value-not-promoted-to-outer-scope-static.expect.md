
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
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(12);
  let t1;
  let t2;
  let t3;
  let t4;
  let t0;
  let t5;
  let t6;
  let t7;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const count = new MaybeMutable();

    t6 = View;
    t7 = "\n      ";
    t3 = View;
    t4 = "\n        ";
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <span>Text</span>;
      $[8] = t0;
    } else {
      t0 = $[8];
    }
    t5 = "\n        ";
    t1 = "span";
    t2 = maybeMutate(count);
    $[0] = t1;
    $[1] = t2;
    $[2] = t3;
    $[3] = t4;
    $[4] = t0;
    $[5] = t5;
    $[6] = t6;
    $[7] = t7;
  } else {
    t1 = $[0];
    t2 = $[1];
    t3 = $[2];
    t4 = $[3];
    t0 = $[4];
    t5 = $[5];
    t6 = $[6];
    t7 = $[7];
  }
  let t8;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = <t1>{t2}</t1>;
    $[9] = t8;
  } else {
    t8 = $[9];
  }
  let t9;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t9 = (
      <t3>
        {t4}
        {t0}
        {t5}
        {t8}
      </t3>
    );
    $[10] = t9;
  } else {
    t9 = $[10];
  }
  let t10;
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = (
      <t6>
        {t7}
        {t9}
      </t6>
    );
    $[11] = t10;
  } else {
    t10 = $[11];
  }
  return t10;
}

```
      