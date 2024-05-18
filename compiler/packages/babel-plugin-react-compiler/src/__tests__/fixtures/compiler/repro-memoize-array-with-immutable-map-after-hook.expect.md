
## Input

```javascript
import { useEffect, useState } from "react";

function Component(props) {
  const x = [props.value];
  useEffect(() => {}, []);
  const onClick = () => {
    console.log(x.length);
  };
  return (
    <div onClick={onClick}>
      {x.map((item) => {
        return <span key={item}>{item}</span>;
      })}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useEffect, useState } from "react";

function Component(props) {
  const $ = _c(8);
  let t0;
  if ($[0] !== props.value) {
    t0 = [props.value];
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  let t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {};
    t2 = [];
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  let t3;
  if ($[4] !== x.length) {
    t3 = () => {
      console.log(x.length);
    };
    $[4] = x.length;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const onClick = t3;
  let t4;
  if ($[6] !== x) {
    t4 = (
      <div onClick={onClick}>
        {x.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    );
    $[6] = x;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><span>42</span></div>