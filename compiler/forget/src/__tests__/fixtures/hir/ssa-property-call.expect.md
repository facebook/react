
## Input

```javascript
function foo() {
  const x = [];
  const y = { x: x };
  y.x.push([]);
  return y;
}

```

## HIR

```
bb0:
  [1] Const mutate x$4_@0 = Array []
  [2] Const mutate y$5_@1:TObject[2:5] = Object { x: read x$4_@0 }
  [3] Const mutate $6_@1[2:5] = Array []
  [4] Call mutate y$5_@1.x.push(mutate $6_@1)
  [5] Return freeze y$5_@1:TObject
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:2] deps=[] out=[x$4_@0] {
    [1] Const mutate x$4_@0 = Array []
  }
  scope @1 [2:5] deps=[read x$4_@0] out=[y$5_@1] {
    [2] Const mutate y$5_@1:TObject[2:5] = Object { x: read x$4_@0 }
    [3] Const mutate $6_@1[2:5] = Array []
    [4] Call mutate y$5_@1.x.push(mutate $6_@1)
  }
  return freeze y$5_@1:TObject
}

```

## Code

```javascript
function foo$0() {
  const x$4 = [];
  const y$5 = {
    x: x$4,
  };
  y$5.x.push([]);
  return y$5;
}

```
      