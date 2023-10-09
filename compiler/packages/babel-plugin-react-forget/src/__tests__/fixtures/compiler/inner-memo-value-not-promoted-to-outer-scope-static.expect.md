
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
  const $ = useMemoCache(6);
  let t1;
  let T2;
  let t0;
  let T3;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const count = new MaybeMutable();

    T3 = View;
    T2 = View;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <span>Text</span>;
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    t1 = maybeMutate(count);
    $[0] = t1;
    $[1] = T2;
    $[2] = t0;
    $[3] = T3;
  } else {
    t1 = $[0];
    T2 = $[1];
    t0 = $[2];
    T3 = $[3];
  }
  let t4;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = (
      <T3>
        <T2>
          {t0}
          <span>{t1}</span>
        </T2>
      </T3>
    );
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
}

```
      