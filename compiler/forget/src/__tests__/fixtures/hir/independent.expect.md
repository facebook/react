
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

## HIR

```
bb0:
  [1] Const mutate a$8_@0 = Call mutate compute$3:TFunction(read props$7.a)
  [2] Const mutate b$9_@1 = Call mutate compute$3:TFunction(read props$7.b)
  [3] Const mutate $10_@2 = JSX <read Foo$5 a={freeze a$8_@0} b={freeze b$9_@1} ></read Foo$5>
  [4] Return read $10_@2
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:2] deps=[read props$7.a] {
    [1] Const mutate a$8_@0 = Call mutate compute$3:TFunction(read props$7.a)
  }
  scope @1 [2:3] deps=[read props$7.b] {
    [2] Const mutate b$9_@1 = Call mutate compute$3:TFunction(read props$7.b)
  }
  scope @2 [3:4] deps=[freeze a$8_@0, freeze b$9_@1] {
    [3] Const mutate $10_@2 = JSX <read Foo$5 a={freeze a$8_@0} b={freeze b$9_@1} ></read Foo$5>
  }
  return read $10_@2
}

```

## Code

```javascript
function Component$0(props$7) {
  const a$8 = compute$3(props$7.a);
  const b$9 = compute$3(props$7.b);
  return <Foo$5 a={a$8} b={b$9}></Foo$5>;
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
      