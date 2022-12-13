
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
  [1] Return

```

## Reactive Scopes

```
function mutate(
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
function mutate$0() {}

```
## HIR

```
bb0:
  [1] Return

```

## Reactive Scopes

```
function cond(
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
function cond$0() {}

```
## HIR

```
bb0:
  [1] Const mutate a$12_@0[1:18] = Object {  }
  [2] Const mutate b$13_@0[1:18] = Object {  }
  [3] Const mutate c$14_@1 = Object {  }
  [4] Const mutate d$15_@0[1:18] = Object {  }
  [5] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb4
  [6] Const mutate $16_@3[6:8] = true
  [7] If (read $16_@3) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [8] Call mutate mutate$6(mutate a$12_@0, mutate b$13_@0)
  [9] Const mutate $21_@0[1:18] = Call mutate cond$7(mutate a$12_@0)
  [10] If (read $21_@0) then:bb2 else:bb4 fallthrough=bb4
bb4:
  predecessor blocks: bb3
  [11] Goto(Continue) bb1
bb2:
  predecessor blocks: bb3 bb1
  [12] If (read a$12_@0) then:bb7 else:bb7 fallthrough=bb7
bb7:
  predecessor blocks: bb2
  [13] If (read b$13_@0) then:bb9 else:bb9 fallthrough=bb9
bb9:
  predecessor blocks: bb7
  [14] If (read c$14_@1) then:bb11 else:bb11 fallthrough=bb11
bb11:
  predecessor blocks: bb9
  [15] If (read d$15_@0) then:bb13 else:bb13 fallthrough=bb13
bb13:
  predecessor blocks: bb11
  [16] Const mutate $28_@4 = null
  [17] Call mutate mutate$6(mutate d$15_@0, read $28_@4)
  [18] Return

```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:18] deps=[] {
    [1] Const mutate a$12_@0[1:18] = Object {  }
    [2] Const mutate b$13_@0[1:18] = Object {  }
    scope @1 [3:4] deps=[] {
      [3] Const mutate c$14_@1 = Object {  }
    }
    [4] Const mutate d$15_@0[1:18] = Object {  }
    scope @3 [6:8] deps=[] {
      while (
        [6] Const mutate $16_@3[6:8] = true
        read $16_@3
      ) {
        [8] Call mutate mutate$6(mutate a$12_@0, mutate b$13_@0)
        [9] Const mutate $21_@0[1:18] = Call mutate cond$7(mutate a$12_@0)
        if (read $21_@0) {
          break
        }
      }
    }
    if (read a$12_@0) {
    }
    if (read b$13_@0) {
    }
    if (read c$14_@1) {
    }
    if (read d$15_@0) {
    }
    [16] Const mutate $28_@4 = null
    [17] Call mutate mutate$6(mutate d$15_@0, read $28_@4)
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
      [1] Const mutate a$12_@0[1:18] = Object {  }
      [2] Const mutate b$13_@0[1:18] = Object {  }
      [3] Const mutate c$14_@1 = Object {  }
      [4] Const mutate d$15_@0[1:18] = Object {  }
    "]
    bb0_instrs --> bb0_terminal(["While"])
  end
  subgraph bb1
    bb1_instrs["
      [6] Const mutate $16_@3[6:8] = true
    "]
    bb1_instrs --> bb1_terminal(["If (read $16_@3)"])
  end
  subgraph bb3
    bb3_instrs["
      [8] Call mutate mutate$6(mutate a$12_@0, mutate b$13_@0)
      [9] Const mutate $21_@0[1:18] = Call mutate cond$7(mutate a$12_@0)
    "]
    bb3_instrs --> bb3_terminal(["If (read $21_@0)"])
  end
  subgraph bb4
    bb4_terminal(["Goto"])
  end
  subgraph bb2
    bb2_terminal(["If (read a$12_@0)"])
  end
  subgraph bb7
    bb7_terminal(["If (read b$13_@0)"])
  end
  subgraph bb9
    bb9_terminal(["If (read c$14_@1)"])
  end
  subgraph bb11
    bb11_terminal(["If (read d$15_@0)"])
  end
  subgraph bb13
    bb13_instrs["
      [16] Const mutate $28_@4 = null
      [17] Call mutate mutate$6(mutate d$15_@0, read $28_@4)
    "]
    bb13_instrs --> bb13_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- "test" --> bb1
  bb0_terminal -- "loop" --> bb3
  bb0_terminal -- "fallthrough" --> bb2
  bb1_terminal -- "then" --> bb3
  bb1_terminal -- "else" --> bb2
  bb3_terminal -- "then" --> bb2
  bb3_terminal -- "else" --> bb4
  bb4_terminal --> bb1
  bb2_terminal -- "then" --> bb7
  bb2_terminal -- "else" --> bb7
  bb7_terminal -- "then" --> bb9
  bb7_terminal -- "else" --> bb9
  bb9_terminal -- "then" --> bb11
  bb9_terminal -- "else" --> bb11
  bb11_terminal -- "then" --> bb13
  bb11_terminal -- "else" --> bb13

```

## Code

```javascript
function Component$0(props$11) {
  const a$12 = {};
  const b$13 = {};
  const c$14 = {};
  const d$15 = {};
  bb2: while (true) {
    mutate$6(a$12, b$13);

    bb4: if (cond$7(a$12)) {
      break;
    }
  }

  bb7: if (a$12) {
  }

  bb9: if (b$13) {
  }

  bb11: if (c$14) {
  }

  bb13: if (d$15) {
  }

  mutate$6(d$15, null);
}

```
      