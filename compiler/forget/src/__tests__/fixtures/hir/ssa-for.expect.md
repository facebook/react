
## Input

```javascript
function foo() {
  let x = 0;
  for (; x < 10; ) {
    x = x + 1;
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$1_@0 = 0
  Goto bb1
bb1:
  predecessor blocks: bb0 bb4
  [2] Const mutate $3_@1 = 10
  [3] Const mutate $4_@2 = Binary read x$1 < read $3_@1
  If (read $4_@2) then:bb4 else:bb2
bb4:
  predecessor blocks: bb1
  [4] Const mutate $2_@3 = 1
  [5] Reassign mutate x$1_@4 = Binary read x$1 + read $2_@3
  Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  Return read x$1
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$1_@0 = 0
    "]
    bb0_instrs --> bb0_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [2] Const mutate $3_@1 = 10
      [3] Const mutate $4_@2 = Binary read x$1 < read $3_@1
    "]
    bb1_instrs --> bb1_terminal(["If (read $4_@2)"])
  end
  subgraph bb4
    bb4_instrs["
      [4] Const mutate $2_@3 = 1
      [5] Reassign mutate x$1_@4 = Binary read x$1 + read $2_@3
    "]
    bb4_instrs --> bb4_terminal(["Goto"])
  end
  subgraph bb2
    bb2_terminal(["Return read x$1"])
  end

  %% Jumps
  bb0_terminal --> bb1
  bb1_terminal -- then --> bb4
  bb1_terminal -- else --> bb2
  bb4_terminal --> bb1

```

## Code

```javascript
function foo$0() {
  let x$1 = 0;
}

```
      