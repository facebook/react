
## Input

```javascript
function Component(props) {
  const x = makeFunction(props);
  const y = x(
    <div>
      <span>{props.text}</span>
    </div>
  );
  return y;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  const c_0 = $[0] !== props;
  let t1;
  if (c_0) {
    const x = makeFunction(props);
    const c_2 = $[2] !== props.text;
    let t0;
    if (c_2) {
      t0 = (
        <div>
          <span>{props.text}</span>
        </div>
      );
      $[2] = props.text;
      $[3] = t0;
    } else {
      t0 = $[3];
    }
    t1 = x(t0);
    $[0] = props;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const y = t1;
  return y;
}

```
      