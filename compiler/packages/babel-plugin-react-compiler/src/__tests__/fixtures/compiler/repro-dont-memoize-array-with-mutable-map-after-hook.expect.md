
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
  const $ = _c(9);
  let t0;
  let t1;
  if ($[0] !== props.value) {
    const x = [{ ...props.value }];

    const onClick = () => {
      console.log(x.length);
    };

    t0 = onClick;
    t1 = x.map((item) => {
      item.flag = true;
      return <span key={item.id}>{item.text}</span>;
    });
    $[0] = props.value;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  let y;
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = mutate(y);
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t0 || $[5] !== t1) {
    t3 = (
      <div onClick={t0}>
        {t1}
        {t2}
      </div>
    );
    $[4] = t0;
    $[5] = t1;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  let t5;
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = () => {};
    t5 = [];
    $[7] = t4;
    $[8] = t5;
  } else {
    t4 = $[7];
    t5 = $[8];
  }
  useEffect(t4, t5);
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: { id: 0, text: "Hello", flag: false } }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><span>Hello</span></div>