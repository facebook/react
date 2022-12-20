
## Input

```javascript
function foo() {}

function Component(props) {
  const a = [];
  const b = {};
  foo(a, b);
  let _ = <div a={a} />;
  foo(b);
  return <div a={a} b={b} />;
}

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
  [1] Const mutate a$10_@0[1:7] = Array []
  [2] Const mutate b$11_@0:TObject[1:7] = Object {  }
  [3] Call mutate foo$4:TFunction(mutate a$10_@0, mutate b$11_@0:TObject)
  [4] Const mutate $12:TPrimitive = "div"
  [5] Const mutate _$13_@1 = JSX <read $12:TPrimitive a={freeze a$10_@0} ></read $12:TPrimitive>
  [6] Call mutate foo$4:TFunction(mutate b$11_@0:TObject)
  [7] Const mutate $14:TPrimitive = "div"
  [8] Const mutate t4$15_@2 = JSX <read $14:TPrimitive a={read a$10_@0} b={freeze b$11_@0:TObject} ></read $14:TPrimitive>
  [9] Return read t4$15_@2
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:7] deps=[] out=[a$10_@0, b$11_@0] {
    [1] Const mutate a$10_@0[1:7] = Array []
    [2] Const mutate b$11_@0:TObject[1:7] = Object {  }
    [3] Call mutate foo$4:TFunction(mutate a$10_@0, mutate b$11_@0:TObject)
    [4] Const mutate $12:TPrimitive = "div"
    [5] Const mutate _$13_@1 = JSX <read $12:TPrimitive a={freeze a$10_@0} ></read $12:TPrimitive>
    [6] Call mutate foo$4:TFunction(mutate b$11_@0:TObject)
  }
  [7] Const mutate $14:TPrimitive = "div"
  scope @2 [8:9] deps=[read a$10_@0, freeze b$11_@0:TObject] out=[$15_@2] {
    [8] Const mutate $15_@2 = JSX <read $14:TPrimitive a={read a$10_@0} b={freeze b$11_@0:TObject} ></read $14:TPrimitive>
  }
  return read $15_@2
}

```

## Code

```javascript
function Component$0(props$9) {
  const $ = React.useMemoCache();
  let a$10;
  let b$11;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a$10 = [];
    b$11 = {};
    foo$4(a$10, b$11);

    const _$13 = <div a={a$10}></div>;

    foo$4(b$11);
    $[0] = a$10;
    $[1] = b$11;
  } else {
    a$10 = $[0];
    b$11 = $[1];
  }

  const c_2 = $[2] !== a$10;
  const c_3 = $[3] !== b$11;
  let t4$15;

  if (c_2 || c_3) {
    t4$15 = <div a={a$10} b={b$11}></div>;
    $[2] = a$10;
    $[3] = b$11;
    $[4] = t4$15;
  } else {
    t4$15 = $[4];
  }

  return t4$15;
}

```
      