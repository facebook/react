
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
function foo() {}

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
function Component(props) {
  const $ = React.useMemoCache();
  let a;
  let b;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    b = {};
    foo(a, b);

    const _ = <div a={a}></div>;

    foo(b);
    $[0] = a;
    $[1] = b;
  } else {
    a = $[0];
    b = $[1];
  }

  const c_2 = $[2] !== a;
  const c_3 = $[3] !== b;
  let t4;

  if (c_2 || c_3) {
    t4 = <div a={a} b={b}></div>;
    $[2] = a;
    $[3] = b;
    $[4] = t4;
  } else {
    t4 = $[4];
  }

  return t4;
}

```
      