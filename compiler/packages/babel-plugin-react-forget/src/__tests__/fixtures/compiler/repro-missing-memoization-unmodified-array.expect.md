
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
import {
  useEffect,
  useState,
  unstable_useMemoCache as useMemoCache,
} from "react";

function Component(props) {
  const $ = useMemoCache(5);
  const x = [props.value];
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {};
    t1 = [];
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  useEffect(t0, t1);
  const onClick = () => {
    console.log(x.length);
  };

  const t2 = x.map((item) => <span key={item}>{item}</span>);
  let t3;
  if ($[2] !== onClick || $[3] !== t2) {
    t3 = <div onClick={onClick}>{t2}</div>;
    $[2] = onClick;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
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