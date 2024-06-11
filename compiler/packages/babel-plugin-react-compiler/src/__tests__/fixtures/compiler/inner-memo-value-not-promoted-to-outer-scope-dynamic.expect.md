
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
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <span>Text</span>;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== t0) {
    t2 = (
      <View>
        <View>
          {t1}
          <span>{t0}</span>
        </View>
      </View>
    );
    $[3] = t0;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

```
      