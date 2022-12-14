
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
  [1] Const mutate a$9_@0[1:4] = Call mutate compute$3:TFunction(read props$8.a)
  [2] Const mutate b$10_@0[1:4] = Call mutate compute$3:TFunction(read props$8.b)
  [3] Call mutate foo$5:TFunction(mutate a$9_@0, mutate b$10_@0)
  [4] Const mutate $11_@1 = JSX <read Foo$6 a={freeze a$9_@0} b={freeze b$10_@0} ></read Foo$6>
  [5] Return read $11_@1
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:4] deps=[read props$8.a, read props$8.b] {
    [1] Const mutate a$9_@0[1:4] = Call mutate compute$3:TFunction(read props$8.a)
    [2] Const mutate b$10_@0[1:4] = Call mutate compute$3:TFunction(read props$8.b)
    [3] Call mutate foo$5:TFunction(mutate a$9_@0, mutate b$10_@0)
  }
  scope @1 [4:5] deps=[freeze a$9_@0, freeze b$10_@0] {
    [4] Const mutate $11_@1 = JSX <read Foo$6 a={freeze a$9_@0} b={freeze b$10_@0} ></read Foo$6>
  }
  return read $11_@1
}

```

## Code

```javascript
function Component$0(props$8) {
  const a$9 = compute$3(props$8.a);
  const b$10 = compute$3(props$8.b);
  foo$5(a$9, b$10);
  return <Foo$6 a={a$9} b={b$10}></Foo$6>;
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
function compute$0() {}

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
function foo$0() {}

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
function Foo$0() {}

```
      