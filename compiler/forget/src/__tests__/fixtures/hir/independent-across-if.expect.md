
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
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  const c_2 = $[2] !== props.c;
  let a;
  if (c_0 || c_1 || c_2) {
    a = compute(props.a);
    const b = compute(props.b);
    if (props.c) {
      mutate(a);
      mutate(b);
    }
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.c;
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
      