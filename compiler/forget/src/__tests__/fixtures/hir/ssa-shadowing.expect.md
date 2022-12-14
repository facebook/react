
## Input

```javascript
function log() {}

function Foo(cond) {
  let str = "";
  if (cond) {
    let str = "other test";
    log(str);
  } else {
    str = "fallthrough test";
  }
  log(str);
}

```

## HIR

```
bb0:
  [1] Return

```

## Reactive Scopes

```
function log(
) {
  return
}

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_terminal(["Return"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function log$0() {}

```
## HIR

```
bb0:
  [1] Let mutate str$6_@0:TPrimitive[1:8] = ""
  [2] If (read cond$5) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate str$7_@1:TPrimitive = "other test"
  [4] Call mutate log$4:TFunction(read str$7_@1:TPrimitive)
  [5] Goto bb1
bb3:
  predecessor blocks: bb0
  [6] Reassign mutate str$6_@0:TPrimitive[1:8] = "fallthrough test"
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [8] Call mutate log$4:TFunction(read str$6_@0:TPrimitive)
  [9] Return
scope0 [1:8]:
  - dependency: read cond$5
```

## Reactive Scopes

```
function Foo(
  cond,
) {
  scope @0 [1:8] deps=[read cond$5] {
    [1] Let mutate str$6_@0:TPrimitive[1:8] = ""
    if (read cond$5) {
      [3] Const mutate str$7_@1:TPrimitive = "other test"
      [4] Call mutate log$4:TFunction(read str$7_@1:TPrimitive)
    } else {
      [6] Reassign mutate str$6_@0:TPrimitive[1:8] = "fallthrough test"
    }
  }
  [8] Call mutate log$4:TFunction(read str$6_@0:TPrimitive)
  return
}

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate str$6_@0:TPrimitive[1:8] = ''
    "]
    bb0_instrs --> bb0_terminal(["If (read cond$5)"])
  end
  subgraph bb2
    bb2_instrs["
      [3] Const mutate str$7_@1:TPrimitive = 'other test'
      [4] Call mutate log$4:TFunction(read str$7_@1:TPrimitive)
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [6] Reassign mutate str$6_@0:TPrimitive[1:8] = 'fallthrough test'
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [8] Call mutate log$4:TFunction(read str$6_@0:TPrimitive)
    "]
    bb1_instrs --> bb1_terminal(["Return"])
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
function Foo$0(cond$5) {
  let str$6 = "";
  bb1: if (cond$5) {
    const str$7 = "other test";
    log$4(str$7);
  } else {
    str$6 = "fallthrough test";
  }

  log$4(str$6);
}

```
      