
## Input

```javascript
/**
 * Should produce 1 scope:
 *
 * return: inputs=props.a & props.b; outputs=return
 *   const a = compute(props.a);
 *   const b = compute(props.b);
 *   foo(a, b);
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  foo(a, b);
  return <Foo a={a} b={b} />;
}

function compute() {}
function foo() {}
function Foo() {}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  let a;
  let b;
  if (c_0 || c_1) {
    a = compute(props.a);
    b = compute(props.b);
    foo(a, b);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = a;
    $[3] = b;
  } else {
    a = $[2];
    b = $[3];
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
function compute() {}

```
## Code

```javascript
function foo() {}

```
## Code

```javascript
function Foo() {}

```
      