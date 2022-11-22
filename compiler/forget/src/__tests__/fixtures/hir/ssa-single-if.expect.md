
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (y) {
    let z = x + y;
  }
}

```

## HIR

```
bb0:
  [1] Let mutate x$4_@0 = 1
  [2] Let mutate y$5_@1 = 2
  [3] If (read y$5_@1) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [4] Let mutate z$6_@2 = Binary read x$4_@0 + read y$5_@1
  [5] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [6] Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$4_@0 = 1
      [2] Let mutate y$5_@1 = 2
    "]
    bb0_instrs --> bb0_terminal(["If (read y$5_@1)"])
  end
  subgraph bb2
    bb2_instrs["
      [4] Let mutate z$6_@2 = Binary read x$4_@0 + read y$5_@1
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["Return"])
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
  let y$2 = 2;
  bb1: if (y$2) {
    let z$3 = x$1 + y$2;
  }
}

```
      