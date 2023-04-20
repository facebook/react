
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
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(3);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const maybeMutable = new MaybeMutable();

    t0 = View;
    t1 = maybeMutate(maybeMutable);
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <t0>{t1}</t0>;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

```
      