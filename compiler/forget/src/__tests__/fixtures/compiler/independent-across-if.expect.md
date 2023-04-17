
## Input

```javascript
function compute() {}
function mutate() {}
function foo() {}
function Foo() {}

/**
 * Should produce 3 scopes:
 *
 * a: inputs=props.a & props.c; outputs=a
 *   a = compute(props.a);
 *   if (props.c)
 *     mutate(a)
 * b: inputs=props.b & props.c; outputs=b
 *   b = compute(props.b);
 *   if (props.c)
 *     mutate(b)
 * return: inputs=a, b outputs=return
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  if (props.c) {
    mutate(a);
    mutate(b);
  }
  return <Foo a={a} b={b} />;
}

```

## Code

```javascript
import * as React from "react";
function compute() {
  return undefined;
}
function mutate() {
  return undefined;
}
function foo() {
  return undefined;
}
function Foo() {
  return undefined;
}

/**
 * Should produce 3 scopes:
 *
 * a: inputs=props.a & props.c; outputs=a
 *   a = compute(props.a);
 *   if (props.c)
 *     mutate(a)
 * b: inputs=props.b & props.c; outputs=b
 *   b = compute(props.b);
 *   if (props.c)
 *     mutate(b)
 * return: inputs=a, b outputs=return
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const $ = React.unstable_useMemoCache(8);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  const c_2 = $[2] !== props.c;
  let a;
  let b;
  if (c_0 || c_1 || c_2) {
    a = compute(props.a);
    b = compute(props.b);
    if (props.c) {
      mutate(a);
      mutate(b);
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
  const c_5 = $[5] !== a;
  const c_6 = $[6] !== b;
  let t0;
  if (c_5 || c_6) {
    t0 = <Foo a={a} b={b} />;
    $[5] = a;
    $[6] = b;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

```
      