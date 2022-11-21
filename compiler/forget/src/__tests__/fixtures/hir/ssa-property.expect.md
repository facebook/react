
## Input

```javascript
function foo() {
  const x = [];
  const y = {};
  y.x = x;
  return y;
}

```

## HIR

```
bb0:
  [1] Const mutate x$1_@0 = Array []
  [2] Const mutate y$2_@1[2:4] = Object {  }
  [3] Reassign mutate y$2_@1.x[2:4] = read x$1_@0
  [4] Return freeze y$2_@1
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate x$1_@0 = Array []
      [2] Const mutate y$2_@1[2:4] = Object {  }
      [3] Reassign mutate y$2_@1.x[2:4] = read x$1_@0
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
  const y$2 = {};
  y$2.x = x$1;
  return y$2;
}

```
      