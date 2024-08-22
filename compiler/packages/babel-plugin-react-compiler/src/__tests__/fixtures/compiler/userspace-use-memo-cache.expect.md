
## Input

```javascript
// @runtimeModule="react-forget-runtime"
function Component(props) {
  const [x, setX] = useState(1);
  let y;
  if (props.cond) {
    y = x * 2;
  }
  return (
    <Button
      onClick={() => {
        setX(10 * y);
      }}></Button>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [true],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react-forget-runtime"; // @runtimeModule="react-forget-runtime"
function Component(props) {
  const $ = _c(7);
  const [x, setX] = useState(1);
  let y;
  if ($[0] !== props.cond || $[1] !== x) {
    if (props.cond) {
      y = x * 2;
    }
    $[0] = props.cond;
    $[1] = x;
    $[2] = y;
  } else {
    y = $[2];
  }

  const t0 = y;
  let t1;
  if ($[3] !== t0) {
    t1 = () => {
      setX(10 * y);
    };
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  let t2;
  if ($[5] !== t1) {
    t2 = <Button onClick={t1} />;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [true],
  isComponent: true,
};

```
      