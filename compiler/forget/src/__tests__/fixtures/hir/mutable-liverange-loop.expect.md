
## Input

```javascript
function mutate() {}
function cond() {}

function Component(props) {
  let a = {};
  let b = {};
  let c = {};
  let d = {};
  while (true) {
    mutate(a, b);
    if (cond(a)) {
      break;
    }
  }

  // all of these tests are seemingly readonly, since the values are never directly
  // mutated again. but they are all aliased by `d`, which is later modified, and
  // these are therefore mutable references:
  if (a) {
  }
  if (b) {
  }
  if (c) {
  }
  if (d) {
  }

  mutate(d, null);
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
function mutate$0() {
  return;
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
function cond$0() {
  return;
}

```
## HIR

```
bb0:
  [1] Let mutate a$2_@0[1:7] = Object {  }
  [2] Let mutate b$3_@0[2:6] = Object {  }
  [3] Let mutate c$4_@1 = Object {  }
  [4] Let mutate d$5_@0[4:9] = Object {  }
  While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb4
  [5] Const mutate $9_@2 = true
  If (read $9_@2) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  [6] Call mutate mutate$6_@0(mutate a$2_@0, mutate b$3_@0)
  [7] Const mutate $8_@0 = Call mutate cond$7_@0(mutate a$2_@0)
  If (read $8_@0) then:bb2 else:bb4
bb4:
  predecessor blocks: bb3
  Goto(Continue) bb1
bb2:
  predecessor blocks: bb3 bb1
  If (read a$2_@0) then:bb7 else:bb7
bb7:
  predecessor blocks: bb2
  If (read b$3_@0) then:bb9 else:bb9
bb9:
  predecessor blocks: bb7
  If (read c$4_@1) then:bb11 else:bb11
bb11:
  predecessor blocks: bb9
  If (read d$5_@0) then:bb13 else:bb13
bb13:
  predecessor blocks: bb11
  [8] Const mutate $10_@3 = null
  [9] Call mutate mutate$6_@0(mutate d$5_@0, read $10_@3)
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate a$2_@0[1:7] = Object {  }
      [2] Let mutate b$3_@0[2:6] = Object {  }
      [3] Let mutate c$4_@1 = Object {  }
      [4] Let mutate d$5_@0[4:9] = Object {  }
    "]
    bb0_instrs --> bb0_terminal(["While"])
  end
  subgraph bb1
    bb1_instrs["
      [5] Const mutate $9_@2 = true
    "]
    bb1_instrs --> bb1_terminal(["If (read $9_@2)"])
  end
  subgraph bb3
    bb3_instrs["
      [6] Call mutate mutate$6_@0(mutate a$2_@0, mutate b$3_@0)
      [7] Const mutate $8_@0 = Call mutate cond$7_@0(mutate a$2_@0)
    "]
    bb3_instrs --> bb3_terminal(["If (read $8_@0)"])
  end
  subgraph bb4
    bb4_terminal(["Goto"])
  end
  subgraph bb2
    bb2_terminal(["If (read a$2_@0)"])
  end
  subgraph bb7
    bb7_terminal(["If (read b$3_@0)"])
  end
  subgraph bb9
    bb9_terminal(["If (read c$4_@1)"])
  end
  subgraph bb11
    bb11_terminal(["If (read d$5_@0)"])
  end
  subgraph bb13
    bb13_instrs["
      [8] Const mutate $10_@3 = null
      [9] Call mutate mutate$6_@0(mutate d$5_@0, read $10_@3)
    "]
    bb13_instrs --> bb13_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- test --> bb1
  bb0_terminal -- loop --> bb3
  bb0_terminal -- fallthrough --> bb2
  bb1_terminal -- then --> bb3
  bb1_terminal -- else --> bb2
  bb3_terminal -- then --> bb2
  bb3_terminal -- else --> bb4
  bb4_terminal --> bb1
  bb2_terminal -- then --> bb7
  bb2_terminal -- else --> bb7
  bb7_terminal -- then --> bb9
  bb7_terminal -- else --> bb9
  bb9_terminal -- then --> bb11
  bb9_terminal -- else --> bb11
  bb11_terminal -- then --> bb13
  bb11_terminal -- else --> bb13

```

## Code

```javascript
function Component$0(props$1) {
  let a$2 = {};
  let b$3 = {};
  let c$4 = {};
  let d$5 = {};
  bb2: while (true) {
    mutate$6(a$2, b$3);

    bb4: if (cond$7(a$2)) break;
  }

  a$2;
  b$3;
  c$4;
  d$5;
  mutate$6(d$5, null);
  return;
}

```
      