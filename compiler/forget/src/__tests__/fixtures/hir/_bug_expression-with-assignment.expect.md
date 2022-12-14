
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
  [2] Const mutate x$5:TPrimitive = 2
  [3] Const mutate $6:TPrimitive = Binary read x$5:TPrimitive + read x$5:TPrimitive
  [4] Const mutate $7:TPrimitive = Binary read $6:TPrimitive + read x$5:TPrimitive
  [5] Return read $7:TPrimitive

```

## Reactive Scopes

```
function f(
) {
  [1] Const mutate x$4:TPrimitive = 1
  [2] Const mutate x$5:TPrimitive = 2
  [3] Const mutate $6:TPrimitive = Binary read x$5:TPrimitive + read x$5:TPrimitive
  [4] Const mutate $7:TPrimitive = Binary read $6:TPrimitive + read x$5:TPrimitive
  return read $7:TPrimitive
}

```

## Code

```javascript
function f$0() {
  const x$4 = 1;
  const x$5 = 2;
  return x$5 + x$5 + x$5;
}

```
      