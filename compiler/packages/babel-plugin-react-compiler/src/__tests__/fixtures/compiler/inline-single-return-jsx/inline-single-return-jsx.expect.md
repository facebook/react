
## Input

```javascript
// @enableInlineSingleReturnJSX
function Component({a, b}) {
  return (
    <Child value={a}>
      <div>{b}</div>
    </Child>
  );
}

function Child({value, children}) {
  return (
    <div>
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
import { c as _c } from "react/compiler-runtime"; // @enableInlineSingleReturnJSX
function Component(t0) {
  const $ = _c(2);
  const { a, b } = t0;
  let t1;
  if ($[0] !== b) {
    t1 = <div>{b}</div>;
    $[0] = b;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return Child({ value: a, children: t1 });
}

function Child(t0) {
  const $ = _c(5);
  const { value, children } = t0;
  let t1;
  if ($[0] !== value) {
    t1 = <span>{value}</span>;
    $[0] = value;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== t1 || $[3] !== children) {
    t2 = (
      <div>
        {t1}
        {children}
      </div>
    );
    $[2] = t1;
    $[3] = children;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
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
(kind: ok) <div><span>0</span><div>0</div></div>
<div><span>1</span><div>0</div></div>
<div><span>1</span><div>1</div></div>
<div><span>0</span><div>1</div></div>
<div><span>0</span><div>0</div></div>
<div><span>1</span><div>1</div></div>