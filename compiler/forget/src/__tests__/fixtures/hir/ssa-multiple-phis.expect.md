
## Input

```javascript
function foo(a, b, c, d) {
  let x = 0;
  if (true) {
    if (true) {
      x = a;
    } else {
      x = b;
    }
    x;
  } else {
    if (true) {
      x = c;
    } else {
      x = d;
    }
    x;
  }
  x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$13_@0:TPrimitive = 0
  [2] Const mutate $14_@1:TPrimitive = true
  [3] Let mutate x$18_@2[3:20] = undefined
  [3] If (read $14_@1:TPrimitive) then:bb2 else:bb6 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Const mutate $15_@3:TPrimitive = true
  [5] If (read $15_@3:TPrimitive) then:bb4 else:bb5 fallthrough=bb3
bb4:
  predecessor blocks: bb2
  [6] Reassign mutate x$18_@2[3:20] = read a$9
  [7] Goto bb3
bb5:
  predecessor blocks: bb2
  [8] Reassign mutate x$18_@2[3:20] = read b$10
  [9] Goto bb3
bb3:
  predecessor blocks: bb4 bb5
  [10] read x$18_@2
  [11] Goto bb1
bb6:
  predecessor blocks: bb0
  [12] Const mutate $19_@4:TPrimitive = true
  [13] If (read $19_@4:TPrimitive) then:bb8 else:bb9 fallthrough=bb7
bb8:
  predecessor blocks: bb6
  [14] Reassign mutate x$18_@2[3:20] = read c$11
  [15] Goto bb7
bb9:
  predecessor blocks: bb6
  [16] Reassign mutate x$18_@2[3:20] = read d$12
  [17] Goto bb7
bb7:
  predecessor blocks: bb8 bb9
  [18] read x$18_@2
  [19] Goto bb1
bb1:
  predecessor blocks: bb3 bb7
  [20] read x$18_@2
  [21] Return
scope2 [3:20]:
  - dependency: read a$9
  - dependency: read b$10
  - dependency: read c$11
  - dependency: read d$12
  - dependency: read $14_@1:TPrimitive
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
  d,
) {
  [1] Const mutate x$13_@0:TPrimitive = 0
  [2] Const mutate $14_@1:TPrimitive = true
  scope @2 [3:20] deps=[read a$9, read b$10, read c$11, read d$12, read $14_@1:TPrimitive] {
    [3] Let mutate x$18_@2[3:20] = undefined
    if (read $14_@1:TPrimitive) {
      [4] Const mutate $15_@3:TPrimitive = true
      if (read $15_@3:TPrimitive) {
        [6] Reassign mutate x$18_@2[3:20] = read a$9
      } else {
        [8] Reassign mutate x$18_@2[3:20] = read b$10
      }
      [10] read x$18_@2
    } else {
      [12] Const mutate $19_@4:TPrimitive = true
      if (read $19_@4:TPrimitive) {
        [14] Reassign mutate x$18_@2[3:20] = read c$11
      } else {
        [16] Reassign mutate x$18_@2[3:20] = read d$12
      }
      [18] read x$18_@2
    }
  }
  [20] read x$18_@2
  return
}

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate x$13_@0:TPrimitive = 0
      [2] Const mutate $14_@1:TPrimitive = true
      [3] Let mutate x$18_@2[3:20] = undefined
    "]
    bb0_instrs --> bb0_terminal(["If (read $14_@1:TPrimitive)"])
  end
  subgraph bb2
    bb2_instrs["
      [4] Const mutate $15_@3:TPrimitive = true
    "]
    bb2_instrs --> bb2_terminal(["If (read $15_@3:TPrimitive)"])
  end
  subgraph bb4
    bb4_instrs["
      [6] Reassign mutate x$18_@2[3:20] = read a$9
    "]
    bb4_instrs --> bb4_terminal(["Goto"])
  end
  subgraph bb5
    bb5_instrs["
      [8] Reassign mutate x$18_@2[3:20] = read b$10
    "]
    bb5_instrs --> bb5_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [10] read x$18_@2
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb6
    bb6_instrs["
      [12] Const mutate $19_@4:TPrimitive = true
    "]
    bb6_instrs --> bb6_terminal(["If (read $19_@4:TPrimitive)"])
  end
  subgraph bb8
    bb8_instrs["
      [14] Reassign mutate x$18_@2[3:20] = read c$11
    "]
    bb8_instrs --> bb8_terminal(["Goto"])
  end
  subgraph bb9
    bb9_instrs["
      [16] Reassign mutate x$18_@2[3:20] = read d$12
    "]
    bb9_instrs --> bb9_terminal(["Goto"])
  end
  subgraph bb7
    bb7_instrs["
      [18] read x$18_@2
    "]
    bb7_instrs --> bb7_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [20] read x$18_@2
    "]
    bb1_instrs --> bb1_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb2
  bb0_terminal -- "else" --> bb6
  bb0_terminal -- "fallthrough" --> bb1
  bb2_terminal -- "then" --> bb4
  bb2_terminal -- "else" --> bb5
  bb2_terminal -- "fallthrough" --> bb3
  bb4_terminal --> bb3
  bb5_terminal --> bb3
  bb3_terminal --> bb1
  bb6_terminal -- "then" --> bb8
  bb6_terminal -- "else" --> bb9
  bb6_terminal -- "fallthrough" --> bb7
  bb8_terminal --> bb7
  bb9_terminal --> bb7
  bb7_terminal --> bb1

```

## Code

```javascript
function foo$0(a$9, b$10, c$11, d$12) {
  const x$13 = 0;
  let x$18 = undefined;
  bb1: if (true) {
    bb3: if (true) {
      x$18 = a$9;
    } else {
      x$18 = b$10;
    }

    x$18;
  } else {
    bb7: if (true) {
      x$18 = c$11;
    } else {
      x$18 = d$12;
    }

    x$18;
  }

  x$18;
}

```
      