
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
  [1] Const mutate a$8_@0 = Call mutate compute$2:TFunction(read props$7.a)
  [2] Const mutate b$9_@1 = Call mutate compute$2:TFunction(read props$7.b)
  [3] Const mutate t6$10_@2 = JSX <read Foo$5 a={freeze a$8_@0} b={freeze b$9_@1} ></read Foo$5>
  [4] Return read t6$10_@2
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:2] deps=[read props$7.a] out=[a$8_@0] {
    [1] Const mutate a$8_@0 = Call mutate compute$2:TFunction(read props$7.a)
  }
  scope @1 [2:3] deps=[read props$7.b] out=[b$9_@1] {
    [2] Const mutate b$9_@1 = Call mutate compute$2:TFunction(read props$7.b)
  }
  scope @2 [3:4] deps=[freeze a$8_@0, freeze b$9_@1] out=[$10_@2] {
    [3] Const mutate $10_@2 = JSX <read Foo$5 a={freeze a$8_@0} b={freeze b$9_@1} ></read Foo$5>
  }
  return read $10_@2
}

```

## Code

```javascript
function Component$0(props$7) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props$7.a;
  let a$8;
  if (c_0) {
    a$8 = compute$2(props$7.a);
    $[0] = props$7.a;
    $[1] = a$8;
  } else {
    a$8 = $[1];
  }

  const c_2 = $[2] !== props$7.b;
  let b$9;

  if (c_2) {
    b$9 = compute$2(props$7.b);
    $[2] = props$7.b;
    $[3] = b$9;
  } else {
    b$9 = $[3];
  }

  const c_4 = $[4] !== a$8;
  const c_5 = $[5] !== b$9;
  let t6$10;

  if (c_4 || c_5) {
    t6$10 = <Foo$5 a={a$8} b={b$9}></Foo$5>;
    $[4] = a$8;
    $[5] = b$9;
    $[6] = t6$10;
  } else {
    t6$10 = $[6];
  }

  return t6$10;
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
      