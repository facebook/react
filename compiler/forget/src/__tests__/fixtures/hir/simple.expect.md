
## Input

```javascript
function foo(x, y) {
  if (x) {
    return foo(false, y);
  }
  return [y * 10];
}

```

## HIR

```
bb0:
  [1] If (read x$8) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [2] Const mutate $10_@0:TPrimitive = false
  [3] Const mutate $11_@1 = Call read foo$0:TFunction(read $10_@0:TPrimitive, read y$9:TPrimitive)
  [4] Return freeze $11_@1
bb1:
  predecessor blocks: bb0
  [5] Const mutate $12_@2:TPrimitive = 10
  [6] Const mutate $13_@3:TPrimitive = Binary read y$9:TPrimitive * read $12_@2:TPrimitive
  [7] Const mutate $14_@4 = Array [read $13_@3:TPrimitive]
  [8] Return freeze $14_@4
scope1 [3:4]:
  - dependency: read foo$0:TFunction
  - dependency: read $10_@0:TPrimitive
  - dependency: read y$9:TPrimitive
scope3 [6:7]:
  - dependency: read y$9:TPrimitive
  - dependency: read $12_@2:TPrimitive
scope4 [7:8]:
  - dependency: read $13_@3:TPrimitive
```

## Reactive Scopes

```
function foo(
  x,
  y,
) {
  if (read x$8) {
    [2] Const mutate $10_@0:TPrimitive = false
    scope @1 [3:4] deps=[read foo$0:TFunction, read $10_@0:TPrimitive, read y$9:TPrimitive] {
      [3] Const mutate $11_@1 = Call read foo$0:TFunction(read $10_@0:TPrimitive, read y$9:TPrimitive)
    }
    return freeze $11_@1
  }
  [5] Const mutate $12_@2:TPrimitive = 10
  [6] Const mutate $13_@3:TPrimitive = Binary read y$9:TPrimitive * read $12_@2:TPrimitive
  scope @4 [7:8] deps=[read $13_@3:TPrimitive] {
    [7] Const mutate $14_@4 = Array [read $13_@3:TPrimitive]
  }
  return freeze $14_@4
}

```

## Code

```javascript
function foo$0(x$8, y$9) {
  bb1: if (x$8) {
    return foo$0(false, y$9);
  }
  return [y$9 * 10];
}

```
      