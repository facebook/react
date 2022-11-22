
## Input

```javascript
function foo(a, b, c, d) {
  while (a) {
    if (b) {
      continue;
    }
    c();
    continue;
  }
  d();
}

```

## HIR

```
bb0:
  [1] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb5 bb4
  [2] If (read a$1) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  [3] If (read b$2) then:bb5 else:bb4
bb5:
  predecessor blocks: bb3
  [4] Goto(Continue) bb1
bb4:
  predecessor blocks: bb3
  [5] Call read c$3()
  [6] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [7] Call read d$4()
  [8] Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_terminal(["While"])
  end
  subgraph bb1
    bb1_terminal(["If (read a$1)"])
  end
  subgraph bb3
    bb3_terminal(["If (read b$2)"])
  end
  subgraph bb5
    bb5_terminal(["Goto"])
  end
  subgraph bb4
    bb4_instrs["
      [5] Call read c$3()
    "]
    bb4_instrs --> bb4_terminal(["Goto"])
  end
  subgraph bb2
    bb2_instrs["
      [7] Call read d$4()
    "]
    bb2_instrs --> bb2_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- "test" --> bb1
  bb0_terminal -- "loop" --> bb3
  bb0_terminal -- "fallthrough" --> bb2
  bb1_terminal -- "then" --> bb3
  bb1_terminal -- "else" --> bb2
  bb3_terminal -- "then" --> bb5
  bb3_terminal -- "else" --> bb4
  bb5_terminal --> bb1
  bb4_terminal --> bb1

```

## Code

```javascript
function foo$0(a$1, b$2, c$3, d$4) {
  bb2: while (a$1) {
    bb4: if (b$2) {
      continue;
    }
    c$3();
  }

  d$4();
}

```
      