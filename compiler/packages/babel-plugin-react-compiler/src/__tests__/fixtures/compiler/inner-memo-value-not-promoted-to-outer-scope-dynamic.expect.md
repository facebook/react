
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
  const $ = _c(5);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <span>Text</span>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const item = useFragment(FRAGMENT, props.item);
  useFreeze(item);
  let t1;
  if ($[1] !== item) {
    const count = new MaybeMutable(item);
    t1 = maybeMutate(count);
    $[1] = item;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== t1) {
    t2 = (
      <View>
        <View>
          {t0}
          <span>{t1}</span>
        </View>
      </View>
    );
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

```
      