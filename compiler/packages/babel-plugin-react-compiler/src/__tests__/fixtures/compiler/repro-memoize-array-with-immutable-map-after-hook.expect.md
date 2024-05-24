
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
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  useEffect(t0, t1);
  let t2;
  if ($[2] !== props.value) {
    t2 = [props.value];
    $[2] = props.value;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const x = t2;
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
    t4 = x.map((item) => <span key={item}>{item}</span>);
    $[6] = x;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== onClick || $[9] !== t4) {
    t5 = <div onClick={onClick}>{t4}</div>;
    $[8] = onClick;
    $[9] = t4;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  return t5;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><span>42</span></div>