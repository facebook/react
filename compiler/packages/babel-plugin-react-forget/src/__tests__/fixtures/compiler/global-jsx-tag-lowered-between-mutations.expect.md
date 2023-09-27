
## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  // NOTE: this will produce invalid output.
  // The HIR is roughly:
  //                                   ⌵ mutable range of `maybeMutable`
  // StoreLocal maybeMutable = ...     ⌝
  // t0 = LoadGlobal View              ⎮ <-- View is lowered inside this mutable range
  //                                         and thus gets becomes an output of this scope,
  //                                         gets promoted to temporary
  // t1 = LoadGlobal maybeMutate       ⎮
  // t2 = LoadLocal maybeMutable       ⎮
  // t3 = Call t1(t2)                  ⌟
  // t4 = Jsx tag=t0 props=[] children=[t3] <-- `t0` is an invalid tag
  return <View>{maybeMutate(maybeMutable)}</View>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let T0;
  let t1;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const maybeMutable = new MaybeMutable();

    T0 = View;
    t1 = maybeMutate(maybeMutable);
    t2 = <T0>{t1}</T0>;
    $[0] = T0;
    $[1] = t1;
    $[2] = t2;
  } else {
    T0 = $[0];
    t1 = $[1];
    t2 = $[2];
  }
  return t2;
}

```
      