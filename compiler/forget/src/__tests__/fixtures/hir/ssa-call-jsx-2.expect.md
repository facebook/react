
## Input

```javascript
// @Pass runMutableRangeAnalysis
function foo() {}

function Component(props) {
  const a = [];
  const b = {};
  foo(a, b);
  if (foo()) {
    let _ = <div a={a} />;
  }
  foo(a, b);
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
  [1] Const mutate a$11_@0[1:10] = Array []
  [2] Const mutate b$12_@0:TObject[1:10] = Object {  }
  [3] Call mutate foo$4:TFunction(mutate a$11_@0, mutate b$12_@0:TObject)
  [4] Const mutate t2$13_@1 = Call mutate foo$4:TFunction()
  [5] If (read t2$13_@1) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Const mutate $14:TPrimitive = "div"
  [7] Const mutate _$15_@2 = JSX <read $14:TPrimitive a={freeze a$11_@0} ></read $14:TPrimitive>
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [9] Call mutate foo$4:TFunction(read a$11_@0, mutate b$12_@0:TObject)
  [10] Const mutate $19:TPrimitive = "div"
  [11] Const mutate t5$20_@3 = JSX <read $19:TPrimitive a={freeze a$11_@0} b={freeze b$12_@0:TObject} ></read $19:TPrimitive>
  [12] Return read t5$20_@3
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:10] deps=[] out=[a$11_@0, b$12_@0] {
    [1] Const mutate a$11_@0[1:10] = Array []
    [2] Const mutate b$12_@0:TObject[1:10] = Object {  }
    [3] Call mutate foo$4:TFunction(mutate a$11_@0, mutate b$12_@0:TObject)
    scope @1 [4:5] deps=[] out=[$13_@1] {
      [4] Const mutate $13_@1 = Call mutate foo$4:TFunction()
    }
    if (read $13_@1) {
      [6] Const mutate $14:TPrimitive = "div"
      [7] Const mutate _$15_@2 = JSX <read $14:TPrimitive a={freeze a$11_@0} ></read $14:TPrimitive>
    }
    [9] Call mutate foo$4:TFunction(read a$11_@0, mutate b$12_@0:TObject)
  }
  [10] Const mutate $19:TPrimitive = "div"
  scope @3 [11:12] deps=[freeze a$11_@0, freeze b$12_@0:TObject] out=[$20_@3] {
    [11] Const mutate $20_@3 = JSX <read $19:TPrimitive a={freeze a$11_@0} b={freeze b$12_@0:TObject} ></read $19:TPrimitive>
  }
  return read $20_@3
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
    let t2;

    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = foo();
      $[2] = t2;
    } else {
      t2 = $[2];
    }

    if (t2) {
      const _ = <div a={a}></div>;
    }

    foo(a, b);
    $[0] = a;
    $[1] = b;
  } else {
    a = $[0];
    b = $[1];
  }

  const c_3 = $[3] !== a;
  const c_4 = $[4] !== b;
  let t5;

  if (c_3 || c_4) {
    t5 = <div a={a} b={b}></div>;
    $[3] = a;
    $[4] = b;
    $[5] = t5;
  } else {
    t5 = $[5];
  }

  return t5;
}

```
      