
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
import { c as useMemoCache } from "react/compiler-runtime";
function ComponentA(props) {
  const $ = useMemoCache(6);
  let a;
  let b;
  if ($[0] !== props) {
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
  let t0;
  if ($[3] !== a || $[4] !== b) {
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
  const $ = useMemoCache(6);
  let a;
  let b;
  if ($[0] !== props) {
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
  let t0;
  if ($[3] !== a || $[4] !== b) {
    t0 = <Foo a={a} b={b} />;
    $[3] = a;
    $[4] = b;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
}

function Foo() {}
function mayMutate() {}

```
      