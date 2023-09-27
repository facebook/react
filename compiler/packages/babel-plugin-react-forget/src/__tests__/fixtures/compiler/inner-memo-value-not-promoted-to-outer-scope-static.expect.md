
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
  const $ = useMemoCache(2);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const count = new MaybeMutable();
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <span>Text</span>;
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    t1 = (
      <View>
        <View>
          {t0}
          <span>{maybeMutate(count)}</span>
        </View>
      </View>
    );
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  return t1;
}

```
      