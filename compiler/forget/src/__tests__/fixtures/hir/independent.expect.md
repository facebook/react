
## Input

```javascript
/**
 * Should produce 3 scopes:
 *
 * a: inputs=props.a, outputs=a
 *   a = compute(props.a);
 * b: inputs=props.b, outputs=b
 *   b = compute(props.b);
 * return: inputs=a, b outputs=return
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  return <Foo a={a} b={b} />;
}

function compute() {}
function foo() {}
function Foo() {}

```

## Code

```javascript
/**
 * Should produce 3 scopes:
 *
 * a: inputs=props.a, outputs=a
 *   a = compute(props.a);
 * b: inputs=props.b, outputs=b
 *   b = compute(props.b);
 * return: inputs=a, b outputs=return
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.a;
  let a;
  if (c_0) {
    a = compute(props.a);
    $[0] = props.a;
    $[1] = a;
  } else {
    a = $[1];
  }
  const c_2 = $[2] !== props.b;
  let b;
  if (c_2) {
    b = compute(props.b);
    $[2] = props.b;
    $[3] = b;
  } else {
    b = $[3];
  }
  const c_4 = $[4] !== a;
  const c_5 = $[5] !== b;
  let t0;
  if (c_4 || c_5) {
    t0 = <Foo a={a} b={b}></Foo>;
    $[4] = a;
    $[5] = b;
    $[6] = t0;
  } else {
    t0 = $[6];
  }
  return t0;
}

function compute() {}
function foo() {}
function Foo() {}

```
      