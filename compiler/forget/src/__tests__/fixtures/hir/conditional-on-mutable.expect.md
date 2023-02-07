
## Input

```javascript
function ComponentA(props) {
  const a = [];
  const b = [];
  if (b) {
    a.push(props.p0);
  }
  if (props.p1) {
    b.push(props.p2);
  }
  return <Foo a={a} b={b} />;
}

function ComponentB(props) {
  const a = [];
  const b = [];
  if (mayMutate(b)) {
    a.push(props.p0);
  }
  if (props.p1) {
    b.push(props.p2);
  }
  return <Foo a={a} b={b} />;
}

function Foo() {}
function mayMutate() {}

```

## Code

```javascript
function ComponentA(props) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p1;
  const c_2 = $[2] !== props.p2;
  let a;
  let b;
  if (c_0 || c_1 || c_2) {
    a = [];
    b = [];
    if (b) {
      a.push(props.p0);
    }
    if (props.p1) {
      b.push(props.p2);
    }
    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = props.p2;
    $[3] = a;
    $[4] = b;
  } else {
    a = $[3];
    b = $[4];
  }
  const c_5 = $[5] !== a;
  const c_6 = $[6] !== b;
  let t0;
  if (c_5 || c_6) {
    t0 = <Foo a={a} b={b}></Foo>;
    $[5] = a;
    $[6] = b;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

function ComponentB(props) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p1;
  const c_2 = $[2] !== props.p2;
  let a;
  let b;
  if (c_0 || c_1 || c_2) {
    a = [];
    b = [];
    if (mayMutate(b)) {
      a.push(props.p0);
    }
    if (props.p1) {
      b.push(props.p2);
    }
    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = props.p2;
    $[3] = a;
    $[4] = b;
  } else {
    a = $[3];
    b = $[4];
  }
  const c_5 = $[5] !== a;
  const c_6 = $[6] !== b;
  let t0;
  if (c_5 || c_6) {
    t0 = <Foo a={a} b={b}></Foo>;
    $[5] = a;
    $[6] = b;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

function Foo() {}
function mayMutate() {}

```
      