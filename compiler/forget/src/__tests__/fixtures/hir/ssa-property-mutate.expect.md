
## Input

```javascript
function foo() {
  const x = [];
  const y = {};
  y.x = x;
  mutate(y);
  return y;
}

```

## HIR

```
bb0:
  [1] Const mutate x$4_@0[1:5] = Array []
  [2] Const mutate y$5_@0:TObject[1:5] = Object {  }
  [3] Reassign mutate y$5_@0.x[1:5] = read x$4_@0
  [4] Call mutate mutate$3:TFunction(mutate y$5_@0:TObject)
  [5] Return freeze y$5_@0:TObject

```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:5] deps=[] {
    [1] Const mutate x$4_@0[1:5] = Array []
    [2] Const mutate y$5_@0:TObject[1:5] = Object {  }
    [3] Reassign mutate y$5_@0.x[1:5] = read x$4_@0
    [4] Call mutate mutate$3:TFunction(mutate y$5_@0:TObject)
  }
  return freeze y$5_@0:TObject
}

```

## Code

```javascript
function foo$0() {
  const x$4 = [];
  const y$5 = {};
  y$5.x = x$4;
  mutate$3(y$5);
  return y$5;
}

```
      