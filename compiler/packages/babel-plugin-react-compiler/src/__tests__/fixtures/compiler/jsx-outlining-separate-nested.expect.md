
## Input

```javascript
// @enableJsxOutlining
function Component({arr}) {
  const x = useX();
  return (
    <>
      {arr.map((i, id) => {
        return (
          <Bar key={id} x={x}>
            <Baz i={i}></Baz>
            <Baz i={i}></Baz>
            <Baz i={i}></Baz>
          </Bar>
        );
      })}
    </>
  );
}
function Bar({x, children}) {
  return (
    <>
      {x}
      {children}
    </>
  );
}

function Baz({i}) {
  return i;
}

function useX() {
  return 'x';
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{arr: ['foo', 'bar']}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableJsxOutlining
function Component(t0) {
  const $ = _c(7);
  const { arr } = t0;
  const x = useX();
  let t1;
  if ($[0] !== x || $[1] !== arr) {
    let t2;
    if ($[3] !== x) {
      t2 = (i, id) => {
        const T0 = _temp;
        return <T0 i={i} i={i} i={i} key={id} x={x} />;
      };
      $[3] = x;
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    t1 = arr.map(t2);
    $[0] = x;
    $[1] = arr;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[5] !== t1) {
    t2 = <>{t1}</>;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}
function _temp(t0) {
  const $ = _c(11);
  const { i: i, i: i$0, i: i$1, x: x } = t0;
  let t1;
  if ($[0] !== i) {
    t1 = <Baz i={i} />;
    $[0] = i;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== i$0) {
    t2 = <Baz i={i$0} />;
    $[2] = i$0;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== i$1) {
    t3 = <Baz i={i$1} />;
    $[4] = i$1;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== x || $[7] !== t1 || $[8] !== t2 || $[9] !== t3) {
    t4 = (
      <Bar x={x}>
        {t1}
        {t2}
        {t3}
      </Bar>
    );
    $[6] = x;
    $[7] = t1;
    $[8] = t2;
    $[9] = t3;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
}

function Bar(t0) {
  const $ = _c(3);
  const { x, children } = t0;
  let t1;
  if ($[0] !== x || $[1] !== children) {
    t1 = (
      <>
        {x}
        {children}
      </>
    );
    $[0] = x;
    $[1] = children;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

function Baz(t0) {
  const { i } = t0;
  return i;
}

function useX() {
  return "x";
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ arr: ["foo", "bar"] }],
};

```
      
### Eval output
(kind: ok) xfoofoofooxbarbarbar