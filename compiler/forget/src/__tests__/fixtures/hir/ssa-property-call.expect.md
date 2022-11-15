
## Input

```javascript
function foo() {
  const x = [];
  const y = { x: x };
  y.x.push([]);
  return y;
}

```

## HIR

```
bb0:
  [1] Const mutate x$1_@0 = Array []
  [2] Const mutate y$2_@1[2:4] = Object { x: read x$1_@0 }
  [3] Const mutate $3_@1[3:4] = Array []
  [4] Call mutate y$2_@1.x.push(mutate $3_@1)
  Return freeze y$2_@1
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate x$1_@0 = Array []
      [2] Const mutate y$2_@1[2:4] = Object { x: read x$1_@0 }
      [3] Const mutate $3_@1[3:4] = Array []
      [4] Call mutate y$2_@1.x.push(mutate $3_@1)
    "]
    bb0_instrs --> bb0_terminal(["Return freeze y$2_@1"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function foo$0() {
  const x$1 = [];
  const y$2 = {
    x: x$1,
  };
  y$2.x.push([]);
  return y$2;
}

```
      