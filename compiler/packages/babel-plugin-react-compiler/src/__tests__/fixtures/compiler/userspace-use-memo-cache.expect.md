
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
      }}
    ></Button>
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
  const t0 = useState(1);
  let y;
  let setX;
  if ($[0] !== t0 || $[1] !== props.cond) {
    const [x, t1] = t0;
    setX = t1;
    if (props.cond) {
      y = x * 2;
    }
    $[0] = t0;
    $[1] = props.cond;
    $[2] = y;
    $[3] = setX;
  } else {
    y = $[2];
    setX = $[3];
  }

  const t1 = y;
  let t2;
  if ($[4] !== setX || $[5] !== t1) {
    t2 = (
      <Button
        onClick={() => {
          setX(10 * y);
        }}
      />
    );
    $[4] = setX;
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
      