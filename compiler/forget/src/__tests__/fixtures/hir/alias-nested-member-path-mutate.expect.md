
## Input

```javascript
function component() {
  let z = [];
  let y = {};
  y.z = z;
  let x = {};
  x.y = y;
  mutate(x.y.z);
}

```

## HIR

```
bb0:
  [1] Const mutate z$5_@0[1:7] = Array []
  [2] Const mutate y$6_@0:TObject[1:7] = Object {  }
  [3] Reassign mutate y$6_@0.z[1:7] = read z$5_@0
  [4] Const mutate x$7_@0:TObject[1:7] = Object {  }
  [5] Reassign mutate x$7_@0.y[1:7] = read y$6_@0:TObject
  [6] Call mutate mutate$4:TFunction(mutate x$7_@0.y.z)
  [7] Return
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:7] deps=[] {
    [1] Const mutate z$5_@0[1:7] = Array []
    [2] Const mutate y$6_@0:TObject[1:7] = Object {  }
    [3] Reassign mutate y$6_@0.z[1:7] = read z$5_@0
    [4] Const mutate x$7_@0:TObject[1:7] = Object {  }
    [5] Reassign mutate x$7_@0.y[1:7] = read y$6_@0:TObject
    [6] Call mutate mutate$4:TFunction(mutate x$7_@0.y.z)
  }
  return
}

```

## Code

```javascript
function component$0() {
  const z$5 = [];
  const y$6 = {};
  y$6.z = z$5;
  const x$7 = {};
  x$7.y = y$6;
  mutate$4(x$7.y.z);
}

```
      