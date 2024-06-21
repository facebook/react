
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
  const $ = _c(7);
  const item = useFragment(FRAGMENT, props.item);
  useFreeze(item);
  let t0;
  if ($[0] !== item) {
    const count = new MaybeMutable(item);

    t0 = maybeMutate(count);
    $[0] = item;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== t0) {
    t1 = <span>{t0}</span>;
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <span>Text</span>;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== t1) {
    t3 = (
      <View>
        <View>
          {t2}
          {t1}
        </View>
      </View>
    );
    $[5] = t1;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

```
      