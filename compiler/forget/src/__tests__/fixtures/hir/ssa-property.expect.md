
## Input

```javascript
function foo() {
  const x = [];
  const y = {};
  y.x = x;
  return y;
}

```

## HIR

```
bb0:
  [1] Const mutate x$3_@0 = Array []
  [2] Const mutate y$4_@1:TObject[2:4] = Object {  }
  [3] Reassign mutate y$4_@1.x[2:4] = read x$3_@0
  [4] Return freeze y$4_@1:TObject
scope1 [2:4]:
  - dependency: read x$3_@0
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:2] deps=[] {
    [1] Const mutate x$3_@0 = Array []
  }
  scope @1 [2:4] deps=[read x$3_@0] {
    [2] Const mutate y$4_@1:TObject[2:4] = Object {  }
    [3] Reassign mutate y$4_@1.x[2:4] = read x$3_@0
  }
  return freeze y$4_@1:TObject
}

```

## Code

```javascript
function foo$0() {
  const x$3 = [];
  const y$4 = {};
  y$4.x = x$3;
  return y$4;
}

```
      