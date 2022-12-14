
## Input

```javascript
function foo(cond) {
  let items = [];
  for (const item of items) {
    let y = 0;
    if (cond) {
      y = 1;
    }
  }
  return items;
}

```

## HIR

```
bb0:
  [1] Const mutate items$5_@0 = Array []
  [2] Goto bb1
bb1:
  predecessor blocks: bb0 bb4
  [3] If (read items$5_@0) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [4] Const mutate y$7_@1:TPrimitive = 0
  [5] If (read cond$4) then:bb5 else:bb4 fallthrough=bb4
bb5:
  predecessor blocks: bb3
  [6] Const mutate y$9_@2:TPrimitive = 1
  [7] Goto bb4
bb4:
  predecessor blocks: bb5 bb3
  [8] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [9] Return freeze items$5_@0

```

## Reactive Scopes

```
function foo(
  cond,
) {
  scope @0 [1:2] deps=[] {
    [1] Const mutate items$5_@0 = Array []
  }
}

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate items$5_@0 = Array []
    "]
    bb0_instrs --> bb0_terminal(["Goto"])
  end
  subgraph bb1
    bb1_terminal(["If (read items$5_@0)"])
  end
  subgraph bb3
    bb3_instrs["
      [4] Const mutate y$7_@1:TPrimitive = 0
    "]
    bb3_instrs --> bb3_terminal(["If (read cond$4)"])
  end
  subgraph bb5
    bb5_instrs["
      [6] Const mutate y$9_@2:TPrimitive = 1
    "]
    bb5_instrs --> bb5_terminal(["Goto"])
  end
  subgraph bb4
    bb4_terminal(["Goto"])
  end
  subgraph bb2
    bb2_terminal(["Return freeze items$5_@0"])
  end

  %% Jumps
  bb0_terminal --> bb1
  bb1_terminal -- "then" --> bb3
  bb1_terminal -- "else" --> bb2
  bb3_terminal -- "then" --> bb5
  bb3_terminal -- "else" --> bb4
  bb5_terminal --> bb4
  bb4_terminal --> bb1

```

## Code

```javascript
function foo$0(cond$4) {
  const items$5 = [];
}

```
      