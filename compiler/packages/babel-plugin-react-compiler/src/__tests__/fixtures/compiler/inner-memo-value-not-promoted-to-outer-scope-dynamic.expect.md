
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(8);
  const item = useFragment(FRAGMENT, props.item);
  useFreeze(item);
  let t0;
  let T0;
  let t1;
  let T1;
  if ($[0] !== item) {
    const count = new MaybeMutable(item);

    T1 = View;
    T0 = View;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = <span>Text</span>;
      $[5] = t1;
    } else {
      t1 = $[5];
    }
    t0 = maybeMutate(count);
    $[0] = item;
    $[1] = t0;
    $[2] = T0;
    $[3] = t1;
    $[4] = T1;
  } else {
    t0 = $[1];
    T0 = $[2];
    t1 = $[3];
    T1 = $[4];
  }
  let t2;
  if ($[6] !== t0) {
    t2 = (
      <T1>
        <T0>
          {t1}
          <span>{t0}</span>
        </T0>
      </T1>
    );
    $[6] = t0;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}

```
      