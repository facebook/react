
## Input

```javascript
function component() {
  let x = 1;
  let y = 2;
}

```

## HIR

```
bb0:
  [1] Const mutate x$3:TPrimitive = 1
  [2] Const mutate y$4:TPrimitive = 2
  [3] Return
```

## Reactive Scopes

```
function component(
) {
  [1] Const mutate x$3:TPrimitive = 1
  [2] Const mutate y$4:TPrimitive = 2
  return
}

```

## Code

```javascript
function component() {
  const x = 1;
  const y = 2;
}

```
      