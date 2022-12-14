
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;
  if (y === 2) {
    x = 3;
  }

  y = x;
}

```

## HIR

```
bb0:
  [1] Let mutate x$5_@0:TPrimitive[1:8] = 1
  [2] Const mutate y$6_@1:TPrimitive = 2
  [3] Const mutate $7_@2:TPrimitive = 2
  [4] Const mutate $8_@3:TPrimitive = Binary read y$6_@1:TPrimitive === read $7_@2:TPrimitive
  [5] If (read $8_@3:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [6] Reassign mutate x$5_@0:TPrimitive[1:8] = 3
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [8] Const mutate y$11_@4 = read x$5_@0:TPrimitive
  [9] Return
scope3 [4:5]:
  - dependency: read y$6_@1:TPrimitive
  - dependency: read $7_@2:TPrimitive
scope4 [8:9]:
  - dependency: read x$5_@0:TPrimitive
```

## Reactive Scopes

```
function foo(
) {
  scope @0 [1:8] deps=[] {
    [1] Let mutate x$5_@0:TPrimitive[1:8] = 1
    [2] Const mutate y$6_@1:TPrimitive = 2
    [3] Const mutate $7_@2:TPrimitive = 2
    [4] Const mutate $8_@3:TPrimitive = Binary read y$6_@1:TPrimitive === read $7_@2:TPrimitive
    if (read $8_@3:TPrimitive) {
      [6] Reassign mutate x$5_@0:TPrimitive[1:8] = 3
    }
  }
  [8] Const mutate y$11_@4 = read x$5_@0:TPrimitive
  return
}

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$5_@0:TPrimitive[1:8] = 1
      [2] Const mutate y$6_@1:TPrimitive = 2
      [3] Const mutate $7_@2:TPrimitive = 2
      [4] Const mutate $8_@3:TPrimitive = Binary read y$6_@1:TPrimitive === read $7_@2:TPrimitive
    "]
    bb0_instrs --> bb0_terminal(["If (read $8_@3:TPrimitive)"])
  end
  subgraph bb2
    bb2_instrs["
      [6] Reassign mutate x$5_@0:TPrimitive[1:8] = 3
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [8] Const mutate y$11_@4 = read x$5_@0:TPrimitive
    "]
    bb1_instrs --> bb1_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb2
  bb0_terminal -- "else" --> bb1
  bb2_terminal --> bb1

```

## Code

```javascript
function foo$0() {
  let x$5 = 1;
  const y$6 = 2;
  bb1: if (y$6 === 2) {
    x$5 = 3;
  }

  const y$11 = x$5;
}

```
      