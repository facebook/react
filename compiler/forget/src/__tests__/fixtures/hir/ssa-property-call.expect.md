
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
  [1] Const mutate x$4 = Array []
  [2] Const mutate y$5[2:4] = Object { x: read x$4 }
  [3] Const mutate $6[3:4] = Array []
  [4] Call mutate y$5.x.push(mutate $6)
  Return freeze y$5
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate x$4 = Array []
      [2] Const mutate y$5[2:4] = Object { x: read x$4 }
      [3] Const mutate $6[3:4] = Array []
      [4] Call mutate y$5.x.push(mutate $6)
    "]
    bb0_instrs --> bb0_terminal(["Return freeze y$5"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function foo$0() {
  const x$4 = [];
  const y$5 = {
    x: x$4,
  };
  y$5.x.push([]);
  return y$5;
}

```
      