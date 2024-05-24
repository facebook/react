
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
import { c as _c } from "react/compiler-runtime";
import { useEffect, useState } from "react";
import { mutate } from "shared-runtime";

function Component(props) {
  const $ = _c(4);
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
    const x = [{ ...props.value }];
    const onClick = () => {
      console.log(x.length);
    };

    let y;

    t2 = (
      <div onClick={onClick}>
        {x.map((item) => {
          y = item;
          return <span key={item.id}>{item.text}</span>;
        })}
        {mutate(y)}
      </div>
    );
    $[2] = props.value;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: { id: 0, text: "Hello!" } }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><span>Hello!</span></div>