
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (y) {
    let z = x + y;
  } else {
    let z = x;
  }
}

```

## HIR

```
bb0:
  [1] Let mutate x$1 = 1
  [2] Let mutate y$2 = 2
  If (read y$2) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [3] Let mutate z$3 = Binary read x$1 + read y$2
  Goto bb1
bb3:
  predecessor blocks: bb0
  [4] Let mutate z$4 = read x$1
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$1 = 1
      [2] Let mutate y$2 = 2
    "]
    bb0_instrs --> bb0_terminal(["If (read y$2)"])
  end
  subgraph bb2
    bb2_instrs["
      [3] Let mutate z$3 = Binary read x$1 + read y$2
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [4] Let mutate z$4 = read x$1
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return"])
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
  let x$1 = 1;
  let y$2 = 2;
  bb1: if (y$2) {
    let z$3 = x$1 + y$2;
  } else {
    let z$4 = x$1;
  }

  return;
}

```
      