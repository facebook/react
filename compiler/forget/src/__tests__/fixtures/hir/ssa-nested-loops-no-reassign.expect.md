
## Input

```javascript
// @xonly
function foo(a, b, c) {
  let x = 0;
  while (a) {
    while (b) {
      while (c) {
        x + 1;
      }
    }
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$9_@0 = 0
  [2] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb5
  [3] If (read a$6) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  [4] While test=bb4 loop=bb6 fallthrough=bb5
bb4:
  predecessor blocks: bb3 bb8
  [5] If (read b$7) then:bb6 else:bb5
bb6:
  predecessor blocks: bb4
  [6] While test=bb7 loop=bb9 fallthrough=bb8
bb7:
  predecessor blocks: bb6 bb9
  [7] If (read c$8) then:bb9 else:bb8
bb9:
  predecessor blocks: bb7
  [8] Const mutate $13_@1 = 1
  [9] Binary read x$9_@0 + read $13_@1
  [10] Goto(Continue) bb7
bb8:
  predecessor blocks: bb7
  [11] Goto(Continue) bb4
bb5:
  predecessor blocks: bb4
  [12] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [13] Return read x$9_@0
scope1 [8:9]:
 - read x$9_@0
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$9_@0 = 0
    "]
    bb0_instrs --> bb0_terminal(["While"])
  end
  subgraph bb1
    bb1_terminal(["If (read a$6)"])
  end
  subgraph bb3
    bb3_terminal(["While"])
  end
  subgraph bb4
    bb4_terminal(["If (read b$7)"])
  end
  subgraph bb6
    bb6_terminal(["While"])
  end
  subgraph bb7
    bb7_terminal(["If (read c$8)"])
  end
  subgraph bb9
    bb9_instrs["
      [8] Const mutate $13_@1 = 1
      [9] Binary read x$9_@0 + read $13_@1
    "]
    bb9_instrs --> bb9_terminal(["Goto"])
  end
  subgraph bb8
    bb8_terminal(["Goto"])
  end
  subgraph bb5
    bb5_terminal(["Goto"])
  end
  subgraph bb2
    bb2_terminal(["Return read x$9_@0"])
  end

  %% Jumps
  bb0_terminal -- "test" --> bb1
  bb0_terminal -- "loop" --> bb3
  bb0_terminal -- "fallthrough" --> bb2
  bb1_terminal -- "then" --> bb3
  bb1_terminal -- "else" --> bb2
  bb3_terminal -- "test" --> bb4
  bb3_terminal -- "loop" --> bb6
  bb3_terminal -- "fallthrough" --> bb5
  bb4_terminal -- "then" --> bb6
  bb4_terminal -- "else" --> bb5
  bb6_terminal -- "test" --> bb7
  bb6_terminal -- "loop" --> bb9
  bb6_terminal -- "fallthrough" --> bb8
  bb7_terminal -- "then" --> bb9
  bb7_terminal -- "else" --> bb8
  bb9_terminal --> bb7
  bb8_terminal --> bb4
  bb5_terminal --> bb1

```

## Code

```javascript
function foo$0(a$1, b$2, c$3) {
  let x$4 = 0;
  bb2: while (a$1) {
    bb5: while (b$2) {
      bb8: while (c$3) {
        x$4 + 1;
      }
    }
  }

  return x$4;
}

```
      