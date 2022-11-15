
## Input

```javascript
function foo() {
  let x = 1;

  switch (x) {
    case x === 1: {
      x = x + 1;
      break;
    }
    case x === 2: {
      x = x + 2;
      break;
    }
    default: {
      x = x + 3;
    }
  }

  let y = x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$1 = 1
  [2] Const mutate $4 = 2
  [3] Const mutate $5 = Binary read x$1 === read $4
  [4] Const mutate $7 = 1
  [5] Const mutate $8 = Binary read x$1 === read $7
  Switch (read x$1)
    Case read $8: bb5
    Case read $5: bb3
    Default: bb2
bb5:
  predecessor blocks: bb0
  [6] Const mutate $6 = 1
  [7] Reassign mutate x$1 = Binary read x$1 + read $6
  Goto bb1
bb3:
  predecessor blocks: bb0
  [8] Const mutate $3 = 2
  [9] Reassign mutate x$1 = Binary read x$1 + read $3
  Goto bb1
bb2:
  predecessor blocks: bb0
  [10] Const mutate $2 = 3
  [11] Reassign mutate x$1 = Binary read x$1 + read $2
  Goto bb1
bb1:
  predecessor blocks: bb5 bb3 bb2
  [12] Let mutate y$9 = read x$1
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$1 = 1
      [2] Const mutate $4 = 2
      [3] Const mutate $5 = Binary read x$1 === read $4
      [4] Const mutate $7 = 1
      [5] Const mutate $8 = Binary read x$1 === read $7
    "]
    bb0_instrs --> bb0_terminal(["Switch (read x$1)"])
  end
  subgraph bb5
    bb5_instrs["
      [6] Const mutate $6 = 1
      [7] Reassign mutate x$1 = Binary read x$1 + read $6
    "]
    bb5_instrs --> bb5_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [8] Const mutate $3 = 2
      [9] Reassign mutate x$1 = Binary read x$1 + read $3
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb2
    bb2_instrs["
      [10] Const mutate $2 = 3
      [11] Reassign mutate x$1 = Binary read x$1 + read $2
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [12] Let mutate y$9 = read x$1
    "]
    bb1_instrs --> bb1_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- read $8 --> bb5
  bb0_terminal -- read $5 --> bb3
  bb0_terminal -- default --> bb2
  bb0_terminal -- fallthrough --> bb1
  bb5_terminal --> bb1
  bb3_terminal --> bb1
  bb2_terminal --> bb1

```

## Code

```javascript
function foo$0() {
  let x$1 = 1;
  bb1: switch (x$1) {
    case x$1 === 1: {
      x$1 = x$1 + 1;
      break bb1;
    }

    case x$1 === 2: {
      x$1 = x$1 + 2;
      break bb1;
    }

    default: {
      x$1 = x$1 + 3;
    }
  }

  let y$9 = x$1;
  return;
}

```
      