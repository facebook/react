
## Input

```javascript
// @enableInlineSingleReturnJSX @compilationMode(infer)
import {useEffect, useState} from 'react';

function Component({a, b}) {
  let Tag = a === 0 ? Child1 : Child2;
  return (
    <Tag value={a}>
      <div>{b}</div>
    </Tag>
  );
}

function Child1(props) {
  'use no forget';
  return <Child {...props} />;
}

function Child2(props) {
  'use no forget';
  return <Child {...props} />;
}

function Child({value, children}) {
  const [state, setState] = useState(value);
  useEffect(() => {
    if (state === 0 && value === 0) {
      setState(1);
    }
  }, [state]);
  return (
    <div>
      {state}
      <span>{value}</span>
      {children}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0, b: 0}],
  sequentialRenders: [
    {a: 0, b: 0},
    {a: 1, b: 0},
    {a: 1, b: 1},
    {a: 0, b: 1},
    {a: 0, b: 0},
    {a: 1, b: 1},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableInlineSingleReturnJSX @compilationMode(infer)
import { useEffect, useState } from "react";

function Component(t0) {
  const $ = _c(6);
  const { a, b } = t0;
  const Tag = a === 0 ? Child1 : Child2;
  let t1;
  if ($[0] !== b) {
    t1 = <div>{b}</div>;
    $[0] = b;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== Tag || $[3] !== a || $[4] !== t1) {
    t2 = <Tag value={a}>{t1}</Tag>;
    $[2] = Tag;
    $[3] = a;
    $[4] = t1;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

function Child1(props) {
  "use no forget";
  return <Child {...props} />;
}

function Child2(props) {
  "use no forget";
  return <Child {...props} />;
}

function Child(t0) {
  const $ = _c(11);
  const { value, children } = t0;
  const [state, setState] = useState(value);
  let t1;
  if ($[0] !== state || $[1] !== value) {
    t1 = () => {
      if (state === 0 && value === 0) {
        setState(1);
      }
    };
    $[0] = state;
    $[1] = value;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== state) {
    t2 = [state];
    $[3] = state;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== value) {
    t3 = <span>{value}</span>;
    $[5] = value;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] !== state || $[8] !== t3 || $[9] !== children) {
    t4 = (
      <div>
        {state}
        {t3}
        {children}
      </div>
    );
    $[7] = state;
    $[8] = t3;
    $[9] = children;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 0, b: 0 }],
  sequentialRenders: [
    { a: 0, b: 0 },
    { a: 1, b: 0 },
    { a: 1, b: 1 },
    { a: 0, b: 1 },
    { a: 0, b: 0 },
    { a: 1, b: 1 },
  ],
};

```
      
### Eval output
(kind: ok) <div>1<span>0</span><div>0</div></div>
<div>1<span>1</span><div>0</div></div>
<div>1<span>1</span><div>1</div></div>
<div>1<span>0</span><div>1</div></div>
<div>1<span>0</span><div>0</div></div>
<div>1<span>1</span><div>1</div></div>