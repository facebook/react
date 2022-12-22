
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

## HIR

```
bb0:
  [1] Const mutate a$9_@0[1:4] = Call mutate compute$2:TFunction(read props$8.a)
  [2] Const mutate b$10_@0[1:4] = Call mutate compute$2:TFunction(read props$8.b)
  [3] Call mutate foo$5:TFunction(mutate a$9_@0, mutate b$10_@0)
  [4] Const mutate t6$11_@1 = JSX <read Foo$6 a={freeze a$9_@0} b={freeze b$10_@0} ></read Foo$6>
  [5] Return read t6$11_@1
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:4] deps=[read props$8.a, read props$8.b] out=[a$9_@0, b$10_@0] {
    [1] Const mutate a$9_@0[1:4] = Call mutate compute$2:TFunction(read props$8.a)
    [2] Const mutate b$10_@0[1:4] = Call mutate compute$2:TFunction(read props$8.b)
    [3] Call mutate foo$5:TFunction(mutate a$9_@0, mutate b$10_@0)
  }
  scope @1 [4:5] deps=[freeze a$9_@0, freeze b$10_@0] out=[$11_@1] {
    [4] Const mutate $11_@1 = JSX <read Foo$6 a={freeze a$9_@0} b={freeze b$10_@0} ></read Foo$6>
  }
  return read $11_@1
}

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
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function compute(
) {
  return
}

```

## Code

```javascript
function compute() {}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function foo(
) {
  return
}

```

## Code

```javascript
function foo() {}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function Foo(
) {
  return
}

```

## Code

```javascript
function Foo() {}

```
      