
## Input

```javascript
function component(a, b) {
  if (a > b) {
    let m = {};
  }
}

```

## HIR

```
bb0:
  [1] Const mutate $7_@0:TPrimitive = Binary read a$5:TPrimitive > read b$6:TPrimitive
  [2] If (read $7_@0:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate m$8_@1:TObject = Object {  }
  [4] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [5] Return
scope0 [1:2]:
  - dependency: read a$5:TPrimitive
  - dependency: read b$6:TPrimitive
```

## Reactive Scopes

```
function component(
  a,
  b,
) {
  [1] Const mutate $7_@0:TPrimitive = Binary read a$5:TPrimitive > read b$6:TPrimitive
  if (read $7_@0:TPrimitive) {
    scope @1 [3:4] deps=[] {
      [3] Const mutate m$8_@1:TObject = Object {  }
    }
  }
  return
}

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate $7_@0:TPrimitive = Binary read a$5:TPrimitive > read b$6:TPrimitive
    "]
    bb0_instrs --> bb0_terminal(["If (read $7_@0:TPrimitive)"])
  end
  subgraph bb2
    bb2_instrs["
      [3] Const mutate m$8_@1:TObject = Object {  }
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
function component$0(a$5, b$6) {
  bb1: if (a$5 > b$6) {
    const m$8 = {};
  }
}

```
      