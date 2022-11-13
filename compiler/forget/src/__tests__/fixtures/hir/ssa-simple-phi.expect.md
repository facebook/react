
## Input

```javascript
function foo() {
  let y = 2;

  if (y > 1) {
    y = 1;
  } else {
    y = 2;
  }

  let x = y;
}

```

## HIR

```
bb0:
  [1] Let mutate y$5 = 2
  [2] Const mutate $6 = 1
  [3] Const mutate $7 = Binary read y$5 > read $6
  If (read $7) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [4] Reassign mutate y$1 = 1
  Goto bb1
bb3:
  predecessor blocks: bb0
  [5] Reassign mutate y$1 = 2
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [6] Let mutate x$11 = read y$1
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate y$5 = 2
      [2] Const mutate $6 = 1
      [3] Const mutate $7 = Binary read y$5 > read $6
    "]
    bb0_instrs --> bb0_terminal(["If (read $7)"])
  end
  subgraph bb2
    bb2_instrs["
      [4] Reassign mutate y$1 = 1
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [5] Reassign mutate y$1 = 2
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [6] Let mutate x$11 = read y$1
    "]
    bb1_instrs --> bb1_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- then --> bb2
  bb0_terminal -- else --> bb3
  bb0_terminal -- fallthrough --> bb1
  bb2_terminal --> bb1
  bb3_terminal --> bb1

```

## Code

```javascript
function foo$0() {
  let y$5 = 2;
  bb1: if (y$5 > 1) {
    y$1 = 1;
  } else {
    y$1 = 2;
  }

  let x$11 = y$1;
  return;
}

```
      