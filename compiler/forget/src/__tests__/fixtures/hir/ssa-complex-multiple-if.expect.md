
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;
  if (y === 2) {
    x = 3;
  }

  if (y === 3) {
    x = 5;
  }
  y = x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$1 = 1
  [2] Let mutate y$8 = 2
  [3] Const mutate $9 = 2
  [4] Const mutate $10 = Binary read y$8 === read $9
  If (read $10) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate x$1 = 3
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [6] Const mutate $12 = 3
  [7] Const mutate $14 = Binary read y$8 === read $12
  If (read $14) then:bb4 else:bb3
bb4:
  predecessor blocks: bb1
  [8] Reassign mutate x$1 = 5
  Goto bb3
bb3:
  predecessor blocks: bb4 bb1
  [9] Reassign mutate y$18 = read x$1
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$1 = 1
      [2] Let mutate y$8 = 2
      [3] Const mutate $9 = 2
      [4] Const mutate $10 = Binary read y$8 === read $9
    "]
    bb0_instrs --> bb0_terminal(["If (read $10)"])
  end
  subgraph bb2
    bb2_instrs["
      [5] Reassign mutate x$1 = 3
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [6] Const mutate $12 = 3
      [7] Const mutate $14 = Binary read y$8 === read $12
    "]
    bb1_instrs --> bb1_terminal(["If (read $14)"])
  end
  subgraph bb4
    bb4_instrs["
      [8] Reassign mutate x$1 = 5
    "]
    bb4_instrs --> bb4_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [9] Reassign mutate y$18 = read x$1
    "]
    bb3_instrs --> bb3_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- then --> bb2
  bb0_terminal -- else --> bb1
  bb2_terminal --> bb1
  bb1_terminal -- then --> bb4
  bb1_terminal -- else --> bb3
  bb4_terminal --> bb3

```

## Code

```javascript
function foo$0() {
  let x$1 = 1;
  let y$8 = 2;
  bb1: if (y$8 === 2) {
    x$1 = 3;
  }

  bb3: if (y$8 === 3) {
    x$1 = 5;
  }

  y$18 = x$1;
  return;
}

```
      