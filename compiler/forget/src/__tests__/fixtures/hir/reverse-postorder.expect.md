
## Input

```javascript
function Component(props) {
  let x;
  if (props.cond) {
    switch (props.test) {
      case 0: {
        x = props.v0;
        break;
      }
      case 1: {
        x = props.v1;
        break;
      }
      case 2: {
      }
      default: {
        x = props.v2;
      }
    }
  } else {
    if (props.cond2) {
      x = props.b;
    } else {
      x = props.c;
    }
  }
  x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$2_@0 = undefined
  If (read props$1.cond) then:bb2 else:bb10
bb2:
  predecessor blocks: bb0
  [2] Const mutate $3_@1 = 2
  [3] Const mutate $4_@2 = 1
  [4] Const mutate $5_@3 = 0
  Switch (read props$1.test)
    Case read $5_@3: bb8
    Case read $4_@2: bb6
    Case read $3_@1: bb4
    Default: bb4
bb8:
  predecessor blocks: bb2
  [5] Reassign mutate x$2_@4 = read props$1.v0
  Goto bb1
bb6:
  predecessor blocks: bb2
  [6] Reassign mutate x$2_@5 = read props$1.v1
  Goto bb1
bb4:
  predecessor blocks: bb2
  [7] Reassign mutate x$2_@6 = read props$1.v2
  Goto bb1
bb10:
  predecessor blocks: bb0
  If (read props$1.cond2) then:bb12 else:bb13
bb12:
  predecessor blocks: bb10
  [8] Reassign mutate x$2_@7 = read props$1.b
  Goto bb1
bb13:
  predecessor blocks: bb10
  [9] Reassign mutate x$2_@8 = read props$1.c
  Goto bb1
bb1:
  predecessor blocks: bb8 bb6 bb4 bb12 bb13
  [10] read x$2
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$2_@0 = undefined
    "]
    bb0_instrs --> bb0_terminal(["If (read props$1.cond)"])
  end
  subgraph bb2
    bb2_instrs["
      [2] Const mutate $3_@1 = 2
      [3] Const mutate $4_@2 = 1
      [4] Const mutate $5_@3 = 0
    "]
    bb2_instrs --> bb2_terminal(["Switch (read props$1.test)"])
  end
  subgraph bb8
    bb8_instrs["
      [5] Reassign mutate x$2_@4 = read props$1.v0
    "]
    bb8_instrs --> bb8_terminal(["Goto"])
  end
  subgraph bb6
    bb6_instrs["
      [6] Reassign mutate x$2_@5 = read props$1.v1
    "]
    bb6_instrs --> bb6_terminal(["Goto"])
  end
  subgraph bb4
    bb4_instrs["
      [7] Reassign mutate x$2_@6 = read props$1.v2
    "]
    bb4_instrs --> bb4_terminal(["Goto"])
  end
  subgraph bb10
    bb10_terminal(["If (read props$1.cond2)"])
  end
  subgraph bb12
    bb12_instrs["
      [8] Reassign mutate x$2_@7 = read props$1.b
    "]
    bb12_instrs --> bb12_terminal(["Goto"])
  end
  subgraph bb13
    bb13_instrs["
      [9] Reassign mutate x$2_@8 = read props$1.c
    "]
    bb13_instrs --> bb13_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [10] read x$2
    "]
    bb1_instrs --> bb1_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- then --> bb2
  bb0_terminal -- else --> bb10
  bb0_terminal -- fallthrough --> bb1
  bb2_terminal -- read $5_@3 --> bb8
  bb2_terminal -- read $4_@2 --> bb6
  bb2_terminal -- read $3_@1 --> bb4
  bb2_terminal -- default --> bb4
  bb2_terminal -- fallthrough --> bb1
  bb8_terminal --> bb1
  bb6_terminal --> bb1
  bb4_terminal --> bb1
  bb10_terminal -- then --> bb12
  bb10_terminal -- else --> bb13
  bb10_terminal -- fallthrough --> bb1
  bb12_terminal --> bb1
  bb13_terminal --> bb1

```

## Code

```javascript
function Component$0(props$1) {
  let x$2 = undefined;
  bb1: if (props$1.cond) {
    switch (props$1.test) {
      case 0: {
        x$2 = props$1.v0;
        break bb1;
      }

      case 1: {
        x$2 = props$1.v1;
        break bb1;
      }

      case 2: {
      }

      default: {
        x$2 = props$1.v2;
      }
    }
  } else {
    if (props$1.cond2) {
      x$2 = props$1.b;
    } else {
      x$2 = props$1.c;
    }
  }

  x$2;
  return;
}

```
      