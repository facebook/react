
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
  [2] Const mutate x$0$9 = read a$5
  [3] Const mutate x$1$10 = read b$6
  [4] Const mutate x$2$11 = read c$7
  [5] Return read x$2$11
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  [1] Const mutate x$8:TPrimitive = 0
  [2] Const mutate x$0$9 = read a$5
  [3] Const mutate x$1$10 = read b$6
  [4] Const mutate x$2$11 = read c$7
  return read x$2$11
}

```

## Code

```javascript
function foo(a, b, c) {
  const x = 0;
  const x$0 = a;
  const x$1 = b;
  const x$2 = c;
  return x$2;
}

```
      