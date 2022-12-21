
## Input

```javascript
function f() {
  let x = 1;
  x = x + 1;
  x += 1;
  x >>>= 1;
}

function g(a) {
  a.b.c = a.b.c + 1;
  a.b.c *= 2;
}

```

## HIR

```
bb0:
  [1] Const mutate x$5:TPrimitive = 1
  [2] Const mutate $6:TPrimitive = 1
  [3] Const mutate x$7:TPrimitive = Binary read x$5:TPrimitive + read $6:TPrimitive
  [4] Const mutate $8:TPrimitive = 1
  [5] Const mutate x$9:TPrimitive = Binary read x$7:TPrimitive + read $8:TPrimitive
  [6] Const mutate $10:TPrimitive = 1
  [7] Const mutate x$11:TPrimitive = Binary read x$9:TPrimitive >>> read $10:TPrimitive
  [8] Return
```

## Reactive Scopes

```
function f(
) {
  [1] Const mutate x$5:TPrimitive = 1
  [2] Const mutate $6:TPrimitive = 1
  [3] Const mutate x$7:TPrimitive = Binary read x$5:TPrimitive + read $6:TPrimitive
  [4] Const mutate $8:TPrimitive = 1
  [5] Const mutate x$9:TPrimitive = Binary read x$7:TPrimitive + read $8:TPrimitive
  [6] Const mutate $10:TPrimitive = 1
  [7] Const mutate x$11:TPrimitive = Binary read x$9:TPrimitive >>> read $10:TPrimitive
  return
}

```

## Code

```javascript
function f$0() {
  const x$5 = 1;
  const x$7 = x$5 + 1;
  const x$9 = x$7 + 1;
  const x$11 = x$9 >>> 1;
}

```
## HIR

```
bb0:
  [1] Const mutate $6:TPrimitive = 1
  [2] Const mutate $7:TPrimitive = Binary read a$5_@0.b.c + read $6:TPrimitive
  [3] Reassign store a$5_@0.b.c[0:6] = read $7:TPrimitive
  [4] Const mutate $8:TPrimitive = 2
  [5] Reassign mutate a$5_@0.b.c[0:6] = Binary read a$5_@0.b.c * read $8:TPrimitive
  [6] Return
```

## Reactive Scopes

```
function g(
  a,
) {
  [1] Const mutate $6:TPrimitive = 1
  [2] Const mutate $7:TPrimitive = Binary read a$5_@0.b.c + read $6:TPrimitive
  [3] Reassign store a$5_@0.b.c[0:6] = read $7:TPrimitive
  [4] Const mutate $8:TPrimitive = 2
  [5] Reassign mutate a$5_@0.b.c[0:6] = Binary read a$5_@0.b.c * read $8:TPrimitive
  return
}

```

## Code

```javascript
function g$0(a$5) {
  a$5.c.b = a$5.b.c + 1;
  a$5.c.b = a$5.b.c * 2;
}

```
      