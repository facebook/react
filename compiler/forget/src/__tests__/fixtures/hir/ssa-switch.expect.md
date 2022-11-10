
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
  [1] Let mutate x$10 = 1
  [2] Const mutate $11 = 2
  [3] Const mutate $12 = Binary read x$10 === read $11
  [4] Const mutate $13 = 1
  [5] Const mutate $14 = Binary read x$10 === read $13
  Switch (read x$10)
    Case read $14: bb5
    Case read $12: bb3
    Default: bb2
bb5:
  predecessor blocks: bb0
  [6] Const mutate $15 = 1
  [7] Reassign mutate x$1 = Binary read x$10 + read $15
  Goto bb1
bb3:
  predecessor blocks: bb0
  [8] Const mutate $17 = 2
  [9] Reassign mutate x$1 = Binary read x$10 + read $17
  Goto bb1
bb2:
  predecessor blocks: bb0
  [10] Const mutate $19 = 3
  [11] Reassign mutate x$1 = Binary read x$10 + read $19
  Goto bb1
bb1:
  predecessor blocks: bb5 bb3 bb2
  [12] Let mutate y$22 = read x$1
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$10 = 1
      [2] Const mutate $11 = 2
      [3] Const mutate $12 = Binary read x$10 === read $11
      [4] Const mutate $13 = 1
      [5] Const mutate $14 = Binary read x$10 === read $13  
    "]    
    bb0_instrs --> bb0_terminal(["Switch (read x$10)"])  
  end
  
  subgraph bb5
    bb5_instrs["
      [6] Const mutate $15 = 1
      [7] Reassign mutate x$1 = Binary read x$10 + read $15  
    "]    
    bb5_instrs --> bb5_terminal(["Goto"])  
  end
  
  subgraph bb3
    bb3_instrs["
      [8] Const mutate $17 = 2
      [9] Reassign mutate x$1 = Binary read x$10 + read $17  
    "]    
    bb3_instrs --> bb3_terminal(["Goto"])  
  end
  
  subgraph bb2
    bb2_instrs["
      [10] Const mutate $19 = 3
      [11] Reassign mutate x$1 = Binary read x$10 + read $19  
    "]    
    bb2_instrs --> bb2_terminal(["Goto"])  
  end
  
  subgraph bb1
    bb1_instrs["
      [12] Let mutate y$22 = read x$1  
    "]    
    bb1_instrs --> bb1_terminal(["Return"])  
  end
  

  %% Jumps
  bb0_terminal -- read $14 --> bb5
  bb0_terminal -- read $12 --> bb3
  bb0_terminal -- default --> bb2
  bb0_terminal -- fallthrough --> bb1
  
  bb5_terminal --> bb1
  
  bb3_terminal --> bb1
  
  bb2_terminal --> bb1
  
```

## Code

```javascript
function foo$0() {
  let x$10 = 1;
  bb1: switch (x$10) {
    case x$10 === 1: {
      x$1 = x$10 + 1;
      break bb1;
    }

    case x$10 === 2: {
      x$1 = x$10 + 2;
      break bb1;
    }

    default: {
      x$1 = x$10 + 3;
    }
  }

  let y$22 = x$1;
  return;
}

```
      