
## Input

```javascript
function Component(props) {
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

function Component(props) {
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
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p1;
  const c_2 = $[2] !== props.p2;
  let a;
  if (c_0 || c_1 || c_2) {
    a = [];
    const b = [];

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
  } else {
    a = $[3];
  }

  const c_4 = $[4] !== a;
  const c_5 = $[5] !== b;
  let t6;

  if (c_4 || c_5) {
    t6 = <Foo a={a} b={b}></Foo>;
    $[4] = a;
    $[5] = b;
    $[6] = t6;
  } else {
    t6 = $[6];
  }

  return t6;
}

```
## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p1;
  const c_2 = $[2] !== props.p2;
  let a;
  if (c_0 || c_1 || c_2) {
    a = [];
    const b = [];

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
  } else {
    a = $[3];
  }

  const c_4 = $[4] !== a;
  const c_5 = $[5] !== b;
  let t6;

  if (c_4 || c_5) {
    t6 = <Foo a={a} b={b}></Foo>;
    $[4] = a;
    $[5] = b;
    $[6] = t6;
  } else {
    t6 = $[6];
  }

  return t6;
}

```
## Code

```javascript
function Foo() {}

```
## Code

```javascript
function mayMutate() {}

```
      