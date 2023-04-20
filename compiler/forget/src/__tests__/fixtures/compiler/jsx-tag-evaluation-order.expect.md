
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
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <HScroll />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const c_1 = $[1] !== props.value;
  let t1;
  if (c_1) {
    t1 = (
      <View>
        {props.value}
        {t0}
      </View>
    );
    $[1] = props.value;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      