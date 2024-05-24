
## Input

```javascript
import { useState } from "react";

function Component(props) {
  const [_state, setState] = useState();
  const a = () => {
    return b();
  };
  const b = () => {
    return (
      <>
        <div onClick={() => onClick(true)}>a</div>
        <div onClick={() => onClick(false)}>b</div>
      </>
    );
  };
  const onClick = (value) => {
    setState(value);
  };

  return <div>{a()}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useState } from "react";

function Component(props) {
  const $ = _c(4);
  const t0 = useState();
  let t1;
  if ($[0] !== t0) {
    const b = () => (
      <>
        <div onClick={() => onClick(true)}>a</div>
        <div onClick={() => onClick(false)}>b</div>
      </>
    );
    const [_state, setState] = t0;

    const onClick = (value) => {
      setState(value);
    };
    const a = () => b();

    t1 = a();
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== t1) {
    t2 = <div>{t1}</div>;
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div><div>a</div><div>b</div></div>