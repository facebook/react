
## Input

```javascript
function foo() {
  let x = 1;
  if (x === 1) {
    x = 2;
  }

  return x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$1 = 1
  [2] Const mutate $2 = 1
  [3] Const mutate $3 = Binary read x$1 === read $2
  If (read $3) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [4] Reassign mutate x$1 = 2
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  Return read x$1
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$1 = 1
      [2] Const mutate $2 = 1
      [3] Const mutate $3 = Binary read x$1 === read $2
    "]
    bb0_instrs --> bb0_terminal(["If (read $3)"])
  end
  subgraph bb2
    bb2_instrs["
      [4] Reassign mutate x$1 = 2
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return read x$1"])
  end

  %% Jumps
  bb0_terminal -- then --> bb2
  bb0_terminal -- else --> bb1
  bb2_terminal --> bb1

```

## Code

```javascript
function foo$0() {
  let x$1 = 1;
  bb1: if (x$1 === 1) {
    x$1 = 2;
  }

  return x$1;
}

```
      