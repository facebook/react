
## Input

```javascript
function foo(a, b, c) {
  label: if (a) {
    while (b) {
      if (c) {
        break;
      }
    }
  }
}

```

## HIR

```
bb0:
  If (read a$1) then:bb3 else:bb1
bb3:
  predecessor blocks: bb0
  While test=bb4 loop=bb6 fallthrough=bb1
bb4:
  predecessor blocks: bb3 bb7
  If (read b$2) then:bb6 else:bb1
bb6:
  predecessor blocks: bb4
  If (read c$3) then:bb1 else:bb7
bb7:
  predecessor blocks: bb6
  Goto(Continue) bb4
bb1:
  predecessor blocks: bb6 bb4 bb0
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_terminal(["If (read a$1)"])
  end
  subgraph bb3
    bb3_terminal(["While"])
  end
  subgraph bb4
    bb4_terminal(["If (read b$2)"])
  end
  subgraph bb6
    bb6_terminal(["If (read c$3)"])
  end
  subgraph bb7
    bb7_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb3
  bb0_terminal -- "else" --> bb1
  bb3_terminal -- "test" --> bb4
  bb3_terminal -- "loop" --> bb6
  bb3_terminal -- "fallthrough" --> bb1
  bb4_terminal -- "then" --> bb6
  bb4_terminal -- "else" --> bb1
  bb6_terminal -- "then" --> bb1
  bb6_terminal -- "else" --> bb7
  bb7_terminal --> bb4

```

## Code

```javascript
function foo$0(a$1, b$2, c$3) {
  bb1: if (a$1) {
    while (b$2) {
      bb7: if (c$3) break;
    }
  }
  return;
}

```
      