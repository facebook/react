
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
  const $ = _c(11);
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
  if ($[2] !== x.length) {
    t1 = () => {
      console.log(x.length);
    };
    $[2] = x.length;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const onClick = t1;
  let t2;
  if ($[4] !== x) {
    t2 = x.map((item) => <span key={item}>{item}</span>);
    $[4] = x;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] !== onClick || $[7] !== t2) {
    t3 = <div onClick={onClick}>{t2}</div>;
    $[6] = onClick;
    $[7] = t2;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  let t4;
  let t5;
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = () => {};
    t5 = [];
    $[9] = t4;
    $[10] = t5;
  } else {
    t4 = $[9];
    t5 = $[10];
  }
  useEffect(t4, t5);
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><span>42</span></div>