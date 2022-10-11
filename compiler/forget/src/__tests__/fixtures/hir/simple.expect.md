
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
  If (readonly x$1) then:bb2 else:bb1
bb2:
  Const mutable $3 = false
  Const mutable $4 = Call readonly foo$0(readonly $3, readonly y$2)
  Return freeze $4
bb1:
  Const mutable $5 = 10
  Const mutable $6 = Binary readonly y$2 * readonly $5
  Const mutable $7 = Array [readonly $6]
  Return freeze $7
```

## Code

```javascript
function foo$0(x$1, y$2) {
  if (x$1) {
    return foo$0(false, y$2);
  }
  return [y$2 * 10];
}

```
      