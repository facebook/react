
## Input

```javascript
function component() {
  let z = [];
  let y = {};
  y.z = z;
  let x = {};
  x.y = y;
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate z$4_@0 = Array []
  [2] Const mutate y$5_@1:TObject[2:4] = Object {  }
  [3] Reassign mutate y$5_@1.z[2:4] = read z$4_@0
  [4] Const mutate x$6_@2:TObject[4:6] = Object {  }
  [5] Reassign mutate x$6_@2.y[4:6] = read y$5_@1:TObject
  [6] Return freeze x$6_@2:TObject
scope1 [2:4]:
  - dependency: read z$4_@0
scope2 [4:6]:
  - dependency: read y$5_@1:TObject
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:2] deps=[] {
    [1] Const mutate z$4_@0 = Array []
  }
  scope @1 [2:4] deps=[read z$4_@0] {
    [2] Const mutate y$5_@1:TObject[2:4] = Object {  }
    [3] Reassign mutate y$5_@1.z[2:4] = read z$4_@0
  }
  scope @2 [4:6] deps=[read y$5_@1:TObject] {
    [4] Const mutate x$6_@2:TObject[4:6] = Object {  }
    [5] Reassign mutate x$6_@2.y[4:6] = read y$5_@1:TObject
  }
  return freeze x$6_@2:TObject
}

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate z$4_@0 = Array []
      [2] Const mutate y$5_@1:TObject[2:4] = Object {  }
      [3] Reassign mutate y$5_@1.z[2:4] = read z$4_@0
      [4] Const mutate x$6_@2:TObject[4:6] = Object {  }
      [5] Reassign mutate x$6_@2.y[4:6] = read y$5_@1:TObject
    "]
    bb0_instrs --> bb0_terminal(["Return freeze x$6_@2:TObject"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function component$0() {
  const z$4 = [];
  const y$5 = {};
  y$5.z = z$4;
  const x$6 = {};
  x$6.y = y$5;
  return x$6;
}

```
      