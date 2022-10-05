
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
  If (frozen x$1) then:bb2 else:bb1
bb2:
  readonly $3 = false
  readonly $4 = Call mutable foo$0(mutable $3, frozen y$2)
  Return frozen $4
bb1:
  readonly $5 = 10
  frozen $6 = Binary frozen y$2 * readonly $5
  readonly $7 = Array [frozen $6]
  Return frozen $7
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
      