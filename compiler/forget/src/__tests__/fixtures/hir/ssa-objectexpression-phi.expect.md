
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (x > 1) {
    x = 2;
  } else {
    y = 3;
  }

  let t = { x: x, y: y };
  return t;
}

```

## HIR

```
bb0:
  [1] Let mutate x$6_@0[1:10] = 1
  [2] Let mutate y$7_@0[1:10] = 2
  [3] Const mutate $8_@2 = 1
  [4] Const mutate $9_@0[1:10] = Binary read x$6_@0 > read $8_@2
  [5] If (read $9_@0) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Reassign mutate x$6_@0[1:10] = 2
  [7] Goto bb1
bb3:
  predecessor blocks: bb0
  [8] Reassign mutate y$7_@0[1:10] = 3
  [9] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [10] Const mutate t$14_@3 = Object { x: read x$6_@0, y: read y$7_@0 }
  [11] Return freeze t$14_@3
scope3 [10:11]:
  - dependency: read x$6_@0
  - dependency: read y$7_@0
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$6_@0[1:10] = 1
      [2] Let mutate y$7_@0[1:10] = 2
      [3] Const mutate $8_@2 = 1
      [4] Const mutate $9_@0[1:10] = Binary read x$6_@0 > read $8_@2
    "]
    bb0_instrs --> bb0_terminal(["If (read $9_@0)"])
  end
  subgraph bb2
    bb2_instrs["
      [6] Reassign mutate x$6_@0[1:10] = 2
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [8] Reassign mutate y$7_@0[1:10] = 3
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [10] Const mutate t$14_@3 = Object { x: read x$6_@0, y: read y$7_@0 }
    "]
    bb1_instrs --> bb1_terminal(["Return freeze t$14_@3"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb2
  bb0_terminal -- "else" --> bb3
  bb0_terminal -- "fallthrough" --> bb1
  bb2_terminal --> bb1
  bb3_terminal --> bb1

```

## Code

```javascript
function foo$0() {
  let x$6 = 1;
  let y$7 = 2;
  bb1: if (x$6 > 1) {
    x$6 = 2;
  } else {
    y$7 = 3;
  }

  const t$14 = {
    x: x$6,
    y: y$7,
  };
  return t$14;
}

```
      