
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
function foo$0() {}

```
## HIR

```
bb0:
  [1] Const mutate a$11_@0[1:10] = Array []
  [2] Const mutate b$12_@0:TObject[1:10] = Object {  }
  [3] Call mutate foo$4:TFunction(mutate a$11_@0, mutate b$12_@0:TObject)
  [4] Const mutate $13_@1 = Call mutate foo$4:TFunction()
  [5] If (read $13_@1) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Const mutate $14:TPrimitive = "div"
  [7] Const mutate _$15_@2 = JSX <read $14:TPrimitive a={freeze a$11_@0} ></read $14:TPrimitive>
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [9] Call mutate foo$4:TFunction(read a$11_@0, mutate b$12_@0:TObject)
  [10] Const mutate $19:TPrimitive = "div"
  [11] Const mutate $20_@3 = JSX <read $19:TPrimitive a={freeze a$11_@0} b={freeze b$12_@0:TObject} ></read $19:TPrimitive>
  [12] Return read $20_@3
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:10] deps=[] {
    [1] Const mutate a$11_@0[1:10] = Array []
    [2] Const mutate b$12_@0:TObject[1:10] = Object {  }
    [3] Call mutate foo$4:TFunction(mutate a$11_@0, mutate b$12_@0:TObject)
    scope @1 [4:5] deps=[] {
      [4] Const mutate $13_@1 = Call mutate foo$4:TFunction()
    }
    if (read $13_@1) {
      [6] Const mutate $14:TPrimitive = "div"
      scope @2 [7:8] deps=[freeze a$11_@0] {
        [7] Const mutate _$15_@2 = JSX <read $14:TPrimitive a={freeze a$11_@0} ></read $14:TPrimitive>
      }
    }
    [9] Call mutate foo$4:TFunction(read a$11_@0, mutate b$12_@0:TObject)
  }
  [10] Const mutate $19:TPrimitive = "div"
  scope @3 [11:12] deps=[freeze a$11_@0, freeze b$12_@0:TObject] {
    [11] Const mutate $20_@3 = JSX <read $19:TPrimitive a={freeze a$11_@0} b={freeze b$12_@0:TObject} ></read $19:TPrimitive>
  }
  return read $20_@3
}

```

## Code

```javascript
function Component$0(props$10) {
  const a$11 = [];
  const b$12 = {};
  foo$4(a$11, b$12);
  bb1: if (foo$4()) {
    const _$15 = <div a={a$11}></div>;
  }

  foo$4(a$11, b$12);
  return <div a={a$11} b={b$12}></div>;
}

```
      