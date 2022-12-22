
## Input

```javascript
function foo(a, b) {
  let x = [];
  let y = [];
  y.push(b);
  x.push(a);
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0[1:5] = Array []
  [2] Const mutate y$8_@1[2:4] = Array []
  [3] Call mutate y$8_@1.push(read b$6)
  [4] Call mutate x$7_@0.push(read a$5)
  [5] Return
```

## Reactive Scopes

```
function foo(
  a,
  b,
) {
  [1] Const mutate x$7_@0[1:5] = Array []
  [2] Const mutate y$8_@1[2:4] = Array []
  [3] Call mutate y$8_@1.push(read b$6)
  [4] Call mutate x$7_@0.push(read a$5)
  return
}

```

## Code

```javascript
function foo(a, b) {
  const x = [];
  const y = [];
  y.push(b);
  x.push(a);
}

```
      