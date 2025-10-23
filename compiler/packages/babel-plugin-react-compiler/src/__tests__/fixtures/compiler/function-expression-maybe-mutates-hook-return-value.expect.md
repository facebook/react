
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
  const $ = _c(2);
  const id = useSelectedEntitytId();
  let t0;
  if ($[0] !== id) {
    const onLoad = () => {
      log(id);
    };

    t0 = <Foo onLoad={onLoad} />;
    $[0] = id;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      