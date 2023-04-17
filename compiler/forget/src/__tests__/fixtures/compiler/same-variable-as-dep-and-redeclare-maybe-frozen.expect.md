
## Input

```javascript
// note: comments are for the ideal scopes, not what is currently
// emitted
function foo(props) {
  // scope 0: deps=[props.a] decl=[x] reassign=none
  let x = [];
  x.push(props.a);

  // scope 1: deps=[x] decl=[header] reassign=none
  const header = props.showHeader ? <div>{x}</div> : null;

  // scope 2:
  // deps=[x, props.b, props.c]
  // decl=none
  // reassign=[x]
  const y = [x]; // y depends on the earlier x
  x = []; // x reassigned
  y.push(props.b); // interleaved mutation of x/y
  x.push(props.c); // interleaved mutation

  // scope 3 ...
  const content = (
    <div>
      {x}
      {y}
    </div>
  );

  // scope 4 ...
  return (
    <>
      {header}
      {content}
    </>
  );
}

```

## Code

```javascript
import * as React from "react"; // note: comments are for the ideal scopes, not what is currently
// emitted
function foo(props) {
  const $ = React.unstable_useMemoCache(16);
  const c_0 = $[0] !== props.a;
  let x;
  if (c_0) {
    x = [];
    x.push(props.a);
    $[0] = props.a;
    $[1] = x;
  } else {
    x = $[1];
  }
  const c_2 = $[2] !== props.showHeader;
  const c_3 = $[3] !== x;
  let t0;
  if (c_2 || c_3) {
    t0 = props.showHeader ? <div>{x}</div> : null;
    $[2] = props.showHeader;
    $[3] = x;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  const header = t0;
  const c_5 = $[5] !== x;
  const c_6 = $[6] !== props.b;
  const c_7 = $[7] !== props.c;
  let y;
  if (c_5 || c_6 || c_7) {
    y = [x];
    x = [];
    y.push(props.b);
    x.push(props.c);
    $[5] = x;
    $[6] = props.b;
    $[7] = props.c;
    $[8] = y;
    $[9] = x;
  } else {
    y = $[8];
    x = $[9];
  }
  const c_10 = $[10] !== x;
  const c_11 = $[11] !== y;
  let t1;
  if (c_10 || c_11) {
    t1 = (
      <div>
        {x}
        {y}
      </div>
    );
    $[10] = x;
    $[11] = y;
    $[12] = t1;
  } else {
    t1 = $[12];
  }
  const content = t1;
  const c_13 = $[13] !== header;
  const c_14 = $[14] !== content;
  let t2;
  if (c_13 || c_14) {
    t2 = (
      <>
        {header}
        {content}
      </>
    );
    $[13] = header;
    $[14] = content;
    $[15] = t2;
  } else {
    t2 = $[15];
  }
  return t2;
}

```
      