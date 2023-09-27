
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
  const $ = useMemoCache(5);
  const c_0 = $[0] !== props;
  let t2;
  if (c_0) {
    const x = makeFunction(props);
    const c_2 = $[2] !== props.text;
    let t0;
    let t1;
    if (c_2) {
      t0 = <span>{props.text}</span>;
      t1 = <div>{t0}</div>;
      $[2] = props.text;
      $[3] = t0;
      $[4] = t1;
    } else {
      t0 = $[3];
      t1 = $[4];
    }
    t2 = x(t1);
    $[0] = props;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const y = t2;
  return y;
}

```
      