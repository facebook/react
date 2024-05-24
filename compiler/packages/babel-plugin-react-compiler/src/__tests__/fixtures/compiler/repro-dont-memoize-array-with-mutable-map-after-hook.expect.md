
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
        item.flag = true;
        return <span key={item.id}>{item.text}</span>;
      })}
      {mutate(y)}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: { id: 0, text: "Hello", flag: false } }],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useEffect, useState } from "react";
import { mutate } from "shared-runtime";

function Component(props) {
  const $ = _c(12);
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
  let y;
  let t2;
  let t3;
  if ($[2] !== props.value) {
    const x = [{ ...props.value }];
    const onClick = () => {
      console.log(x.length);
    };

    t2 = onClick;
    t3 = x.map((item) => {
      item.flag = true;
      return <span key={item.id}>{item.text}</span>;
    });
    $[2] = props.value;
    $[3] = y;
    $[4] = t2;
    $[5] = t3;
  } else {
    y = $[3];
    t2 = $[4];
    t3 = $[5];
  }
  let t4;
  if ($[6] !== y) {
    t4 = mutate(y);
    $[6] = y;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== t2 || $[9] !== t3 || $[10] !== t4) {
    t5 = (
      <div onClick={t2}>
        {t3}
        {t4}
      </div>
    );
    $[8] = t2;
    $[9] = t3;
    $[10] = t4;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  return t5;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: { id: 0, text: "Hello", flag: false } }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><span>Hello</span></div>