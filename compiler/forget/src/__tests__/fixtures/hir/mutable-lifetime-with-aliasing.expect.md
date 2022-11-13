
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
function mutate$0(x$3, y$4) {
  return;
}

```
## HIR

```
bb0:
  [1] Const mutate a$11 = Object {  }
  [2] Const mutate b$12 = Array [read a$11]
  [3] Const mutate c$13 = Object {  }
  [4] Const mutate d$14[4:7] = Object { c: read c$13 }
  [5] Const mutate x$15[5:9] = Object {  }
  [6] Reassign mutate x$15.b[5:9] = read b$12
  [7] Const mutate y$16 = Call mutate mutate$8(mutate x$15, mutate d$14)
  If (read a$11) then:bb1 else:bb1
bb1:
  predecessor blocks: bb0
  If (read b$12) then:bb3 else:bb3
bb3:
  predecessor blocks: bb1
  If (read c$13) then:bb5 else:bb5
bb5:
  predecessor blocks: bb3
  If (read d$14) then:bb7 else:bb7
bb7:
  predecessor blocks: bb5
  If (read y$16) then:bb9 else:bb9
bb9:
  predecessor blocks: bb7
  [8] Const mutate $17 = null
  [9] Call mutate mutate$8(mutate x$15, read $17)
  Return
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$11 = Object {  }
      [2] Const mutate b$12 = Array [read a$11]
      [3] Const mutate c$13 = Object {  }
      [4] Const mutate d$14[4:7] = Object { c: read c$13 }
      [5] Const mutate x$15[5:9] = Object {  }
      [6] Reassign mutate x$15.b[5:9] = read b$12
      [7] Const mutate y$16 = Call mutate mutate$8(mutate x$15, mutate d$14)
    "]
    bb0_instrs --> bb0_terminal(["If (read a$11)"])
  end
  subgraph bb1
    bb1_terminal(["If (read b$12)"])
  end
  subgraph bb3
    bb3_terminal(["If (read c$13)"])
  end
  subgraph bb5
    bb5_terminal(["If (read d$14)"])
  end
  subgraph bb7
    bb7_terminal(["If (read y$16)"])
  end
  subgraph bb9
    bb9_instrs["
      [8] Const mutate $17 = null
      [9] Call mutate mutate$8(mutate x$15, read $17)
    "]
    bb9_instrs --> bb9_terminal(["Return"])
  end

  %% Jumps
  bb0_terminal -- then --> bb1
  bb0_terminal -- else --> bb1
  bb1_terminal -- then --> bb3
  bb1_terminal -- else --> bb3
  bb3_terminal -- then --> bb5
  bb3_terminal -- else --> bb5
  bb5_terminal -- then --> bb7
  bb5_terminal -- else --> bb7
  bb7_terminal -- then --> bb9
  bb7_terminal -- else --> bb9

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
  x$15 = b$12;
  const y$16 = mutate$8(x$15, d$14);
  a$11;
  b$12;
  c$13;
  d$14;
  y$16;
  mutate$8(x$15, null);
  return;
}

```
      