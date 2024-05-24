
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
  const $ = _c(2);

  let y;
  const [x, setX] = useState(1);
  if (props.cond) {
    y = x * 2;
  }

  const t0 = y;
  let t1;
  if ($[0] !== t0) {
    t1 = (
      <Button
        onClick={() => {
          setX(10 * y);
        }}
      />
    );
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [true],
  isComponent: true,
};

```
      