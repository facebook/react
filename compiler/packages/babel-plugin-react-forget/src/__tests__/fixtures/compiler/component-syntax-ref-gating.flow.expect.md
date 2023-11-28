
## Input

```javascript
// @flow @gating
component Foo(ref: React.RefSetter<Controls>) {
  return <Bar ref={ref}/>;
}
```

## Code

```javascript
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag";
import { unstable_useMemoCache as useMemoCache } from "react";
const Foo = React.forwardRef(Foo_withRef);
const Foo_withRef = isForgetEnabled_Fixtures()
  ? function Foo_withRef(_$$empty_props_placeholder$$, ref) {
      const $ = useMemoCache(2);
      let t0;
      if ($[0] !== ref) {
        t0 = <Bar ref={ref} />;
        $[0] = ref;
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      return t0;
    }
  : function Foo_withRef(
      _$$empty_props_placeholder$$: $ReadOnly<{ ... }>,
      ref: React.RefSetter<Controls>
    ) {
      return <Bar ref={ref} />;
    };

```
      