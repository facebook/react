
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
import { c as _c } from "react/compiler-runtime";
function ComponentA(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    const a = [];
    const b = [];
    if (b) {
      a.push(props.p0);
    }
    if (props.p1) {
      b.push(props.p2);
    }

    t0 = <Foo a={a} b={b} />;
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

function ComponentB(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    const a = [];
    const b = [];
    if (mayMutate(b)) {
      a.push(props.p0);
    }
    if (props.p1) {
      b.push(props.p2);
    }

    t0 = <Foo a={a} b={b} />;
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

function Foo() {}
function mayMutate() {}

```
      