
## Input

```javascript
function foo(x) {
  let y;
  switch (x) {
    case 0: {
      y = 0;
    }
    case 1: {
      y = 1;
    }
    case 2: {
      break;
    }
    case 3: {
      y = 3;
      break;
    }
    case 4: {
      y = 4;
    }
    case 5: {
      y = 5;
    }
    default: {
      y = 0;
    }
  }
}

```

## HIR

```
bb0:
  [1] Let mutate y$2 = undefined
  [2] Const mutate $3 = 5
  [3] Const mutate $4 = 4
  [4] Const mutate $5 = 3
  [5] Const mutate $6 = 2
  [6] Const mutate $7 = 1
  [7] Const mutate $8 = 0
  Switch (read x$1)
    Case read $8: bb10
    Case read $7: bb9
    Case read $6: bb1
    Case read $5: bb5
    Case read $4: bb4
    Case read $3: bb3
    Default: bb2
bb10:
  predecessor blocks: bb0
  [8] Reassign mutate y$2 = 0
  Goto bb9
bb9:
  predecessor blocks: bb10 bb0
  [9] Reassign mutate y$2 = 1
  Goto bb1
bb5:
  predecessor blocks: bb0
  [10] Reassign mutate y$2 = 3
  Goto bb1
bb4:
  predecessor blocks: bb0
  [11] Reassign mutate y$2 = 4
  Goto bb3
bb3:
  predecessor blocks: bb4 bb0
  [12] Reassign mutate y$2 = 5
  Goto bb2
bb2:
  predecessor blocks: bb3 bb0
  [13] Reassign mutate y$2 = 0
  Goto bb1
bb1:
  predecessor blocks: bb9 bb0 bb5 bb2
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate y$2 = undefined
      [2] Const mutate $3 = 5
      [3] Const mutate $4 = 4
      [4] Const mutate $5 = 3
      [5] Const mutate $6 = 2
      [6] Const mutate $7 = 1
      [7] Const mutate $8 = 0
    "]
    bb0_instrs --> bb0_terminal(["Switch (read x$1)"])
  end
  subgraph bb10
    bb10_instrs["
      [8] Reassign mutate y$2 = 0
    "]
    bb10_instrs --> bb10_terminal(["Goto"])
  end
  subgraph bb9
    bb9_instrs["
      [9] Reassign mutate y$2 = 1
    "]
    bb9_instrs --> bb9_terminal(["Goto"])
  end
  subgraph bb5
    bb5_instrs["
      [10] Reassign mutate y$2 = 3
    "]
    bb5_instrs --> bb5_terminal(["Goto"])
  end
  subgraph bb4
    bb4_instrs["
      [11] Reassign mutate y$2 = 4
    "]
    bb4_instrs --> bb4_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [12] Reassign mutate y$2 = 5
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb2
    bb2_instrs["
      [13] Reassign mutate y$2 = 0
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- read $8 --> bb10
  bb0_terminal -- read $7 --> bb9
  bb0_terminal -- read $6 --> bb1
  bb0_terminal -- read $5 --> bb5
  bb0_terminal -- read $4 --> bb4
  bb0_terminal -- read $3 --> bb3
  bb0_terminal -- default --> bb2
  bb0_terminal -- fallthrough --> bb1
  bb10_terminal --> bb9
  bb9_terminal --> bb1
  bb5_terminal --> bb1
  bb4_terminal --> bb3
  bb3_terminal --> bb2
  bb2_terminal --> bb1

```

## Code

```javascript
function foo$0(x$1) {
  let y$2 = undefined;
  bb1: switch (x$1) {
    case 0: {
      y$2 = 0;
    }

    case 1: {
      y$2 = 1;
      break bb1;
    }

    case 2: {
      break bb1;
    }

    case 3: {
      y$2 = 3;
      break bb1;
    }

    case 4: {
      y$2 = 4;
    }

    case 5: {
      y$2 = 5;
    }

    default: {
      y$2 = 0;
    }
  }

  return;
}

```
      