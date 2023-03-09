
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
  const $ = React.unstable_useMemoCache(3);
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
  return <Foo a={a} b={b}></Foo>;
}

function ComponentB(props) {
  const $ = React.unstable_useMemoCache(3);
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
  return <Foo a={a} b={b}></Foo>;
}

function Foo() {}
function mayMutate() {}

```
      