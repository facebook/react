
## Input

```javascript
function Component(props) {
  let Tag = View;
  return (
    <Tag>
      {((Tag = HScroll), props.value)}
      <Tag />
    </Tag>
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);

  const t1 = props.value;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <HScroll />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const c_1 = $[1] !== t1;
  let t2;
  if (c_1) {
    t2 = (
      <View>
        {t1}
        {t0}
      </View>
    );
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

```
      