
## Input

```javascript
function mutate() {}
function foo() {
  let a = {};
  let b = {};
  let c = {};
  a = b;
  b = c;
  c = a;
  mutate(a, b);
  return c;
}

```

## HIR

```
bb0:
  [1] Return

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
  [1] Let mutate a$5_@0 = Object {  }
  [2] Let mutate b$6_@1[0:8] = Object {  }
  [3] Let mutate c$7_@1[0:8] = Object {  }
  [4] Reassign mutate a$8_@1[0:8] = read b$6_@1
  [5] Reassign mutate b$9_@1[0:8] = read c$7_@1
  [6] Reassign mutate c$10_@1[0:8] = read a$8_@1
  [7] Call mutate mutate$4_@1(mutate a$8_@1, mutate b$9_@1)
  [8] Return freeze c$10_@1

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate a$5_@0 = Object {  }
      [2] Let mutate b$6_@1[0:8] = Object {  }
      [3] Let mutate c$7_@1[0:8] = Object {  }
      [4] Reassign mutate a$8_@1[0:8] = read b$6_@1
      [5] Reassign mutate b$9_@1[0:8] = read c$7_@1
      [6] Reassign mutate c$10_@1[0:8] = read a$8_@1
      [7] Call mutate mutate$4_@1(mutate a$8_@1, mutate b$9_@1)
    "]
    bb0_instrs --> bb0_terminal(["Return freeze c$10_@1"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function foo$0() {
  const a$5 = {};
  const b$6 = {};
  const c$7 = {};
  const a$8 = b$6;
  const b$9 = c$7;
  const c$10 = a$8;
  mutate$4(a$8, b$9);
  return c$10;
}

```
      