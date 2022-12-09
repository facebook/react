
## Input

```javascript
function foo() {
  let x = 1;
  while (x < 10) {
    x = x + 1;
  }

  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$5_@0[1:9] = 1
  [2] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb3
  [3] Const mutate $6_@1 = 10
  [4] Const mutate $8_@0[1:9] = Binary read x$5_@0 < read $6_@1
  [5] If (read $8_@0) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [6] Const mutate $9_@2 = 1
  [7] Reassign mutate x$5_@0[1:9] = Binary read x$5_@0 + read $9_@2
  [8] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [9] Return read x$5_@0

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$5_@0[1:9] = 1
    "]
    bb0_instrs --> bb0_terminal(["While"])
  end
  subgraph bb1
    bb1_instrs["
      [3] Const mutate $6_@1 = 10
      [4] Const mutate $8_@0[1:9] = Binary read x$5_@0 < read $6_@1
    "]
    bb1_instrs --> bb1_terminal(["If (read $8_@0)"])
  end
  subgraph bb3
    bb3_instrs["
      [6] Const mutate $9_@2 = 1
      [7] Reassign mutate x$5_@0[1:9] = Binary read x$5_@0 + read $9_@2
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb2
    bb2_terminal(["Return read x$5_@0"])
  end

  %% Jumps
  bb0_terminal -- "test" --> bb1
  bb0_terminal -- "loop" --> bb3
  bb0_terminal -- "fallthrough" --> bb2
  bb1_terminal -- "then" --> bb3
  bb1_terminal -- "else" --> bb2
  bb3_terminal --> bb1

```

## Code

```javascript
function foo$0() {
  let x$5 = 1;
  bb2: while (x$5 < 10) {
    x$5 = x$5 + 1;
  }

  return x$5;
}

```
      