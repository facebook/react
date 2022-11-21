
## Input

```javascript
function foo() {
  let x = 1;
  if (x === 1) {
    x = 2;
  }
  throw x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$1_@0[1:6] = 1
  [2] Const mutate $2_@1 = 1
  [3] Const mutate $3_@2 = Binary read x$1_@0 === read $2_@1
  [4] If (read $3_@2) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate x$1_@0[1:6] = 2
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Throw read x$1_@0
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$1_@0[1:6] = 1
      [2] Const mutate $2_@1 = 1
      [3] Const mutate $3_@2 = Binary read x$1_@0 === read $2_@1
    "]
    bb0_instrs --> bb0_terminal(["If (read $3_@2)"])
  end
  subgraph bb2
    bb2_instrs["
      [5] Reassign mutate x$1_@0[1:6] = 2
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Throw read x$1_@0"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb2
  bb0_terminal -- "else" --> bb1
  bb2_terminal --> bb1

```

## Code

```javascript
function foo$0() {
  let x$1 = 1;
  bb1: if (x$1 === 1) {
    x$1 = 2;
  }

  throw x$1;
}

```
      