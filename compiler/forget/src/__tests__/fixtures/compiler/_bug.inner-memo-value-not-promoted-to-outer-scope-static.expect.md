
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
  const $ = React.unstable_useMemoCache(11);
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  let t7;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const count = new MaybeMutable();

    t6 = View;
    t7 = "\n      ";
    t3 = View;
    t4 = "\n        ";
    let t0;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <span>Text</span>;
      $[7] = t0;
    } else {
      t0 = $[7];
    }
    t5 = "\n        ";
    t1 = "span";
    t2 = maybeMutate(count);
    $[0] = t1;
    $[1] = t2;
    $[2] = t3;
    $[3] = t4;
    $[4] = t5;
    $[5] = t6;
    $[6] = t7;
  } else {
    t1 = $[0];
    t2 = $[1];
    t3 = $[2];
    t4 = $[3];
    t5 = $[4];
    t6 = $[5];
    t7 = $[6];
  }
  let t8;
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    t8 = <t1>{t2}</t1>;
    $[8] = t8;
  } else {
    t8 = $[8];
  }
  let t9;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t9 = (
      <t3>
        {t4}
        {t0}
        {t5}
        {t8}
      </t3>
    );
    $[9] = t9;
  } else {
    t9 = $[9];
  }
  let t10;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = (
      <t6>
        {t7}
        {t9}
      </t6>
    );
    $[10] = t10;
  } else {
    t10 = $[10];
  }
  return t10;
}

```
      