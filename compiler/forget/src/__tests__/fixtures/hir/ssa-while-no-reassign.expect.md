
## Input

```javascript
function foo() {
  let x = 1;
  while (x < 10) {
    x + 1;
  }

  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$5 = 1
  While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb3
  [2] Const mutate $6 = 10
  [3] Const mutate $8 = Binary read x$5 < read $6
  If (read $8) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  [4] Const mutate $9 = 1
  [5] Binary read x$5 + read $9
  Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  Return read x$5
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$5 = 1
    "]
    bb0_instrs --> bb0_terminal(["While"])
  end
  subgraph bb1
    bb1_instrs["
      [2] Const mutate $6 = 10
      [3] Const mutate $8 = Binary read x$5 < read $6
    "]
    bb1_instrs --> bb1_terminal(["If (read $8)"])
  end
  subgraph bb3
    bb3_instrs["
      [4] Const mutate $9 = 1
      [5] Binary read x$5 + read $9
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb2
    bb2_terminal(["Return read x$5"])
  end

  %% Jumps
  bb0_terminal -- test --> bb1
  bb0_terminal -- loop --> bb3
  bb0_terminal -- fallthrough --> bb2
  bb1_terminal -- then --> bb3
  bb1_terminal -- else --> bb2
  bb3_terminal --> bb1

```

## Code

```javascript
function foo$0() {
  let x$5 = 1;
  bb2: while (x$5 < 10) {
    x$5 + 1;
  }

  return x$5;
}

```
      