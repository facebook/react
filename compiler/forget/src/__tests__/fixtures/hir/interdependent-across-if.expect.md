
## Input

```javascript
function compute() {}
function foo() {}
function Foo() {}

/**
 * Should produce 1 scope:
 *
 * return: inputs=props.a & props.b & props.c; outputs=return
 *   const a = compute(props.a);
 *   const b = compute(props.b);
 *   if (props.c)
 *     foo(a, b);
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  if (props.c) {
    foo(a, b);
  }
  return <Foo a={a} b={b} />;
}

```

## Code

```javascript
function compute() {}
function foo() {}
function Foo() {}

/**
 * Should produce 1 scope:
 *
 * return: inputs=props.a & props.b & props.c; outputs=return
 *   const a = compute(props.a);
 *   const b = compute(props.b);
 *   if (props.c)
 *     foo(a, b);
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  const c_2 = $[2] !== props.c;
  let a;
  let b;
  if (c_0 || c_1 || c_2) {
    a = compute(props.a);
    b = compute(props.b);
    if (props.c) {
      foo(a, b);
    }
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.c;
    $[3] = a;
    $[4] = b;
  } else {
    a = $[3];
    b = $[4];
  }
  return <Foo a={a} b={b}></Foo>;
}

```
      