
## Input

```javascript
function component() {
  let x = { t: 1 };
  let p = x.t;
}

```

## HIR

```
bb0:
  [1] Const mutate $4:TPrimitive = 1
  [2] Const mutate x$5_@0:TObject = Object { t: read $4:TPrimitive }
  [3] Const mutate p$6:TPrimitive = read x$5_@0.t
  [4] Return
scope0 [2:3]:
  - dependency: read $4:TPrimitive
```

## Reactive Scopes

```
function component(
) {
  [1] Const mutate $4:TPrimitive = 1
  scope @0 [2:3] deps=[] {
    [2] Const mutate x$5_@0:TObject = Object { t: read $4:TPrimitive }
  }
  [3] Const mutate p$6:TPrimitive = read x$5_@0.t
  return
}

```

## Code

```javascript
function component$0() {
  const x$5 = {
    t: 1,
  };
  const p$6 = x$5.t;
}

```
      