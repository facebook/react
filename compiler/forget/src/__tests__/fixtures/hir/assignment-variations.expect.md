
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
  [1] Const mutate x$5_@0:TPrimitive = 1
  [2] Const mutate $6_@1:TPrimitive = 1
  [3] Const mutate x$7_@2:TPrimitive = Binary read x$5_@0:TPrimitive + read $6_@1:TPrimitive
  [4] Const mutate $8_@3:TPrimitive = 1
  [5] Const mutate x$9_@4:TPrimitive = Binary read x$7_@2:TPrimitive + read $8_@3:TPrimitive
  [6] Const mutate $10_@5:TPrimitive = 1
  [7] Const mutate x$11_@6:TPrimitive = Binary read x$9_@4:TPrimitive >>> read $10_@5:TPrimitive
  [8] Return
scope2 [3:4]:
  - dependency: read x$5_@0:TPrimitive
  - dependency: read $6_@1:TPrimitive
scope4 [5:6]:
  - dependency: read x$7_@2:TPrimitive
  - dependency: read $8_@3:TPrimitive
scope6 [7:8]:
  - dependency: read x$9_@4:TPrimitive
  - dependency: read $10_@5:TPrimitive
```

## Reactive Scopes

```
function f(
) {
  [1] Const mutate x$5_@0:TPrimitive = 1
  [2] Const mutate $6_@1:TPrimitive = 1
  [3] Const mutate x$7_@2:TPrimitive = Binary read x$5_@0:TPrimitive + read $6_@1:TPrimitive
  [4] Const mutate $8_@3:TPrimitive = 1
  [5] Const mutate x$9_@4:TPrimitive = Binary read x$7_@2:TPrimitive + read $8_@3:TPrimitive
  [6] Const mutate $10_@5:TPrimitive = 1
  [7] Const mutate x$11_@6:TPrimitive = Binary read x$9_@4:TPrimitive >>> read $10_@5:TPrimitive
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
  [1] Const mutate $5_@0:TPrimitive = 1
  [2] Reassign mutate a$4_@1.b.c[0:5] = Binary read a$4_@1.b.c + read $5_@0:TPrimitive
  [3] Const mutate $6_@2:TPrimitive = 2
  [4] Reassign mutate a$4_@1.b.c[0:5] = Binary read a$4_@1.b.c * read $6_@2:TPrimitive
  [5] Return
scope2 [3:4]:
  - dependency: mutate a$4_@1.b.c
```

## Reactive Scopes

```
function g(
  a,
) {
  [1] Const mutate $5_@0:TPrimitive = 1
  scope @1 [0:5] deps=[] {
    [2] Reassign mutate a$4_@1.b.c[0:5] = Binary read a$4_@1.b.c + read $5_@0:TPrimitive
    [3] Const mutate $6_@2:TPrimitive = 2
    [4] Reassign mutate a$4_@1.b.c[0:5] = Binary read a$4_@1.b.c * read $6_@2:TPrimitive
  }
  return
}

```

## Code

```javascript
function g$0(a$4) {
  a$4.c.b = a$4.b.c + 1;
  a$4.c.b = a$4.b.c * 2;
}

```
      