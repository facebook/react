
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const count = new MaybeMutable();

    t0 = <span>{maybeMutate(count)}</span>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (
      <View>
        <View>
          <span>Text</span>
          {t0}
        </View>
      </View>
    );
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      