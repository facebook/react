
## Input

```javascript
import { useEffect, useState } from "react";
import { mutate } from "shared-runtime";

function Component(props) {
  const x = [{ ...props.value }];
  useEffect(() => {}, []);
  const onClick = () => {
    console.log(x.length);
  };
  let y;
  return (
    <div onClick={onClick}>
      {x.map((item) => {
        y = item;
        return <span key={item.id}>{item.text}</span>;
      })}
      {mutate(y)}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: { id: 0, text: "Hello!" } }],
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
import { mutate } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(6);
  const x = [{ ...props.value }];
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

  let y;

  const t2 = x.map((item) => {
    y = item;
    return <span key={item.id}>{item.text}</span>;
  });
  const t3 = mutate(y);
  let t4;
  if ($[2] !== onClick || $[3] !== t2 || $[4] !== t3) {
    t4 = (
      <div onClick={onClick}>
        {t2}
        {t3}
      </div>
    );
    $[2] = onClick;
    $[3] = t2;
    $[4] = t3;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: { id: 0, text: "Hello!" } }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><span>Hello!</span></div>