
## Input

```javascript
function Component(props) {
  const id = useSelectedEntitytId();
  // this example should infer `id` as mutable, and then infer `onLoad` as mutable,
  // and be rejected because onLoad cannot be passed as a frozen value in the JSX.
  // however, we likely have to allow this example to work, because hook return
  // values are generally immutable in practice and are also widely referenced in
  // callbacks.
  const onLoad = () => {
    log(id);
  };
  return <Foo onLoad={onLoad} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(4);
  const id = useSelectedEntitytId();
  let t0;
  if ($[0] !== id) {
    t0 = () => {
      log(id);
    };
    $[0] = id;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onLoad = t0;
  let t1;
  if ($[2] !== onLoad) {
    t1 = <Foo onLoad={onLoad} />;
    $[2] = onLoad;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      