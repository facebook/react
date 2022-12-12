
## Input

```javascript
function foo() {
  let x = 1;
  for (let i = 0; i < 10; /* update is intentally a single identifier */ i) {
    x += 1;
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$6_@1[1:13] = 1
  [2] For init=bb3 test=bb1 loop=bb5 update=bb4 fallthrough=bb2
bb3:
  predecessor blocks: bb0
  [3] Const mutate i$7_@1[1:13] = 0
  [4] Goto bb1
bb1:
  predecessor blocks: bb3 bb4
  [5] Const mutate $8_@1[1:13] = 10
  [6] Const mutate $10_@3[6:8] = Binary read i$7_@1 < read $8_@1
  [7] If (read $10_@3) then:bb5 else:bb2 fallthrough=bb2
bb5:
  predecessor blocks: bb1
  [8] Const mutate $11_@4 = 1
  [9] Reassign mutate x$6_@1[1:13] = Binary read x$6_@1 + read $11_@4
  [10] Goto(Continue) bb4
bb4:
  predecessor blocks: bb5
  [11] read i$7_@1
  [12] Goto bb1
bb2:
  predecessor blocks: bb1
  [13] Return read x$6_@1

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$6_@1[1:13] = 1
    "]
    bb0_instrs --> bb0_terminal(["For"])
  end
  subgraph bb3
    bb3_instrs["
      [3] Const mutate i$7_@1[1:13] = 0
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [5] Const mutate $8_@1[1:13] = 10
      [6] Const mutate $10_@3[6:8] = Binary read i$7_@1 < read $8_@1
    "]
    bb1_instrs --> bb1_terminal(["If (read $10_@3)"])
  end
  subgraph bb5
    bb5_instrs["
      [8] Const mutate $11_@4 = 1
      [9] Reassign mutate x$6_@1[1:13] = Binary read x$6_@1 + read $11_@4
    "]
    bb5_instrs --> bb5_terminal(["Goto"])
  end
  subgraph bb4
    bb4_instrs["
      [11] read i$7_@1
    "]
    bb4_instrs --> bb4_terminal(["Goto"])
  end
  subgraph bb2
    bb2_terminal(["Return read x$6_@1"])
  end

  %% Jumps
  bb0_terminal -- "init" --> bb3
  bb0_terminal -- "test" --> bb1
  bb0_terminal -- "update" --> bb4
  bb0_terminal -- "loop" --> bb5
  bb0_terminal -- "fallthrough" --> bb2
  bb3_terminal --> bb1
  bb1_terminal -- "then" --> bb5
  bb1_terminal -- "else" --> bb2
  bb5_terminal --> bb4
  bb4_terminal --> bb1

```

## Code

```javascript
function foo$0() {
  let x$6 = 1;
  bb2: for (const i$7 = 0; i$7 < 10; i$7) {
    x$6 = x$6 + 1;
  }

  return x$6;
}

```
      