
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
  Return
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
function log$0() {
  return;
}

```
## HIR

```
bb0:
  [1] Let mutate str$2_@0[1:5] = ""
  If (read cond$1) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [2] Let mutate str$3_@1 = "other test"
  [3] Call mutate log$4_@2(read str$3_@1)
  Goto bb1
bb3:
  predecessor blocks: bb0
  [4] Reassign mutate str$2_@0[1:5] = "fallthrough test"
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [5] Call mutate log$4_@2(read str$2_@0)
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate str$2_@0[1:5] = ''
    "]
    bb0_instrs --> bb0_terminal(["If (read cond$1)"])
  end
  subgraph bb2
    bb2_instrs["
      [2] Let mutate str$3_@1 = 'other test'
      [3] Call mutate log$4_@2(read str$3_@1)
    "]
    bb2_instrs --> bb2_terminal(["Goto"])
  end
  subgraph bb3
    bb3_instrs["
      [4] Reassign mutate str$2_@0[1:5] = 'fallthrough test'
    "]
    bb3_instrs --> bb3_terminal(["Goto"])
  end
  subgraph bb1
    bb1_instrs["
      [5] Call mutate log$4_@2(read str$2_@0)
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
function Foo$0(cond$1) {
  let str$2 = "";
  bb1: if (cond$1) {
    let str$3 = "other test";
    log$4(str$3);
  } else {
    str$2 = "fallthrough test";
  }

  log$4(str$2);
  return;
}

```
      