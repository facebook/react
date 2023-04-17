
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
  const $ = React.unstable_useMemoCache(6);
  const c_0 = $[0] !== props;
  let a;
  let b;
  if (c_0) {
    a = [];
    b = [];
    if (b) {
      a.push(props.p0);
    }
    if (props.p1) {
      b.push(props.p2);
    }
    $[0] = props;
    $[1] = a;
    $[2] = b;
  } else {
    a = $[1];
    b = $[2];
  }
  const c_3 = $[3] !== a;
  const c_4 = $[4] !== b;
  let t0;
  if (c_3 || c_4) {
    t0 = <Foo a={a} b={b} />;
    $[3] = a;
    $[4] = b;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
}

function ComponentB(props) {
  const $ = React.unstable_useMemoCache(6);
  const c_0 = $[0] !== props;
  let a;
  let b;
  if (c_0) {
    a = [];
    b = [];
    if (mayMutate(b)) {
      a.push(props.p0);
    }
    if (props.p1) {
      b.push(props.p2);
    }
    $[0] = props;
    $[1] = a;
    $[2] = b;
  } else {
    a = $[1];
    b = $[2];
  }
  const c_3 = $[3] !== a;
  const c_4 = $[4] !== b;
  let t0;
  if (c_3 || c_4) {
    t0 = <Foo a={a} b={b} />;
    $[3] = a;
    $[4] = b;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
}

function Foo() {
  return undefined;
}
function mayMutate() {
  return undefined;
}

```
      