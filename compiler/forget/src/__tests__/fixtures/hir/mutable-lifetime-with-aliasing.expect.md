
## Input

```javascript
function mutate(x, y) {}

function Component(props) {
  const a = {};
  const b = [a]; // array elements alias
  const c = {};
  const d = { c }; // object values alias

  // capture all the values into this object
  const x = {};
  x.b = b;
  const y = mutate(x, d); // mutation aliases the arg and return value

  // all of these tests are seemingly readonly, since the values are never directly
  // mutated again. but they are all aliased by `x`, which is later modified, and
  // these are therefore mutable references:
  if (a) {
  }
  if (b) {
  }
  if (c) {
  }
  if (d) {
  }
  if (y) {
  }

  // could in theory mutate any of a/b/c/x/z, so the above should be inferred as mutable
  mutate(x, null);
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
  x,
  y,
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
function mutate$0(x$3, y$4) {}

```
## HIR

```
bb0:
  [1] Const mutate a$11_@0 = Object {  }
  [2] Const mutate b$12_@1[2:15] = Array [read a$11_@0]
  [3] Const mutate c$13_@2 = Object {  }
  [4] Const mutate d$14_@1[2:15] = Object { c: read c$13_@2 }
  [5] Const mutate x$15_@1[2:15] = Object {  }
  [6] Reassign mutate x$15_@1.b[2:15] = read b$12_@1
  [7] Const mutate y$16_@1[2:15] = Call mutate mutate$8(mutate x$15_@1, mutate d$14_@1)
  [8] If (read a$11_@0) then:bb1 else:bb1 fallthrough=bb1
bb1:
  predecessor blocks: bb0
  [9] If (read b$12_@1) then:bb3 else:bb3 fallthrough=bb3
bb3:
  predecessor blocks: bb1
  [10] If (read c$13_@2) then:bb5 else:bb5 fallthrough=bb5
bb5:
  predecessor blocks: bb3
  [11] If (read d$14_@1) then:bb7 else:bb7 fallthrough=bb7
bb7:
  predecessor blocks: bb5
  [12] If (read y$16_@1) then:bb9 else:bb9 fallthrough=bb9
bb9:
  predecessor blocks: bb7
  [13] Const mutate $17_@3 = null
  [14] Call mutate mutate$8(mutate x$15_@1, read $17_@3)
  [15] Return
scope1 [2:15]:
  - dependency: read a$11_@0
  - dependency: read a$11_@0
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:2] deps=[] {
    [1] Const mutate a$11_@0 = Object {  }
  }
  scope @1 [2:15] deps=[read a$11_@0, read a$11_@0] {
    [2] Const mutate b$12_@1[2:15] = Array [read a$11_@0]
    scope @2 [3:4] deps=[] {
      [3] Const mutate c$13_@2 = Object {  }
    }
    [4] Const mutate d$14_@1[2:15] = Object { c: read c$13_@2 }
    [5] Const mutate x$15_@1[2:15] = Object {  }
    [6] Reassign mutate x$15_@1.b[2:15] = read b$12_@1
    [7] Const mutate y$16_@1[2:15] = Call mutate mutate$8(mutate x$15_@1, mutate d$14_@1)
    if (read a$11_@0) {
    }
    if (read b$12_@1) {
    }
    if (read c$13_@2) {
    }
    if (read d$14_@1) {
    }
    if (read y$16_@1) {
    }
    [13] Const mutate $17_@3 = null
    [14] Call mutate mutate$8(mutate x$15_@1, read $17_@3)
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
      [1] Const mutate a$11_@0 = Object {  }
      [2] Const mutate b$12_@1[2:15] = Array [read a$11_@0]
      [3] Const mutate c$13_@2 = Object {  }
      [4] Const mutate d$14_@1[2:15] = Object { c: read c$13_@2 }
      [5] Const mutate x$15_@1[2:15] = Object {  }
      [6] Reassign mutate x$15_@1.b[2:15] = read b$12_@1
      [7] Const mutate y$16_@1[2:15] = Call mutate mutate$8(mutate x$15_@1, mutate d$14_@1)
    "]
    bb0_instrs --> bb0_terminal(["If (read a$11_@0)"])
  end
  subgraph bb1
    bb1_terminal(["If (read b$12_@1)"])
  end
  subgraph bb3
    bb3_terminal(["If (read c$13_@2)"])
  end
  subgraph bb5
    bb5_terminal(["If (read d$14_@1)"])
  end
  subgraph bb7
    bb7_terminal(["If (read y$16_@1)"])
  end
  subgraph bb9
    bb9_instrs["
      [13] Const mutate $17_@3 = null
      [14] Call mutate mutate$8(mutate x$15_@1, read $17_@3)
    "]
    bb9_instrs --> bb9_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- "then" --> bb1
  bb0_terminal -- "else" --> bb1
  bb1_terminal -- "then" --> bb3
  bb1_terminal -- "else" --> bb3
  bb3_terminal -- "then" --> bb5
  bb3_terminal -- "else" --> bb5
  bb5_terminal -- "then" --> bb7
  bb5_terminal -- "else" --> bb7
  bb7_terminal -- "then" --> bb9
  bb7_terminal -- "else" --> bb9

```

## Code

```javascript
function Component$0(props$10) {
  const a$11 = {};
  const b$12 = [a$11];
  const c$13 = {};
  const d$14 = {
    c: c$13,
  };
  const x$15 = {};
  x$15.b = b$12;
  const y$16 = mutate$8(x$15, d$14);
  bb1: if (a$11) {
  }

  bb3: if (b$12) {
  }

  bb5: if (c$13) {
  }

  bb7: if (d$14) {
  }

  bb9: if (y$16) {
  }

  mutate$8(x$15, null);
}

```
      