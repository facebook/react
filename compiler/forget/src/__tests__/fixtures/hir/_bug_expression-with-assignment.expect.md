
## Input

```javascript
function f() {
  let x = 1;
  // BUG: `x` has different values within this expression. Currently, the
  // assignment is evaluated too early.
  return x + (x = 2) + x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$4:TPrimitive = 1
  [2] Const mutate x$0$5:TPrimitive = 2
  [3] Const mutate $6:TPrimitive = Binary read x$0$5:TPrimitive + read x$0$5:TPrimitive
  [4] Const mutate $7:TPrimitive = Binary read $6:TPrimitive + read x$0$5:TPrimitive
  [5] Return read $7:TPrimitive
```

## Reactive Scopes

```
function f(
) {
  [1] Const mutate x$4:TPrimitive = 1
  [2] Const mutate x$0$5:TPrimitive = 2
  [3] Const mutate $6:TPrimitive = Binary read x$0$5:TPrimitive + read x$0$5:TPrimitive
  [4] Const mutate $7:TPrimitive = Binary read $6:TPrimitive + read x$0$5:TPrimitive
  return read $7:TPrimitive
}

```

## Code

```javascript
function f() {
  const x = 1;
  const x$0 = 2;
  return x$0 + x$0 + x$0;
}

```
      