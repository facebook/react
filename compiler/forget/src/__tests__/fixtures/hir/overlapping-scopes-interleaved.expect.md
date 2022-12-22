
## Input

```javascript
function foo(a, b) {
  let x = [];
  let y = [];
  x.push(a);
  y.push(b);
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0[1:5] = Array []
  [2] Const mutate y$8_@0[1:5] = Array []
  [3] Call mutate x$7_@0.push(read a$5)
  [4] Call mutate y$8_@0.push(read b$6)
  [5] Return
```

## Reactive Scopes

```
function foo(
  a,
  b,
) {
  [1] Const mutate x$7_@0[1:5] = Array []
  [2] Const mutate y$8_@0[1:5] = Array []
  [3] Call mutate x$7_@0.push(read a$5)
  [4] Call mutate y$8_@0.push(read b$6)
  return
}

```

## Code

```javascript
function foo(a, b) {
  const x = [];
  const y = [];
  x.push(a);
  y.push(b);
}

```
      