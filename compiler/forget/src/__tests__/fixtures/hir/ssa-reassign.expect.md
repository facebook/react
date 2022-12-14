
## Input

```javascript
function foo(a, b, c) {
  let x = 0;
  x = a;
  x = b;
  x = c;
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$8:TPrimitive = 0
  [2] Const mutate x$9 = read a$5
  [3] Const mutate x$10 = read b$6
  [4] Const mutate x$11 = read c$7
  [5] Return read x$11
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  [1] Const mutate x$8:TPrimitive = 0
  [2] Const mutate x$9 = read a$5
  [3] Const mutate x$10 = read b$6
  [4] Const mutate x$11 = read c$7
  return read x$11
}

```

## Code

```javascript
function foo$0(a$5, b$6, c$7) {
  const x$8 = 0;
  const x$9 = a$5;
  const x$10 = b$6;
  const x$11 = c$7;
  return x$11;
}

```
      