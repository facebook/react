
## Input

```javascript
function Foo() {}

function Component(props) {
  const a = [];
  const b = {};
  let c = new Foo(a, b);
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
function Foo$0() {}

```
## HIR

```
bb0:
  [1] Const mutate a$7_@0[0:4] = Array []
  [2] Const mutate b$8_@0[0:4] = Object {  }
  [3] Let mutate c$9_@0[0:4] = New mutate Foo$5_@0(mutate a$7_@0, mutate b$8_@0)
  [4] Return freeze c$9_@0

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$7_@0[0:4] = Array []
      [2] Const mutate b$8_@0[0:4] = Object {  }
      [3] Let mutate c$9_@0[0:4] = New mutate Foo$5_@0(mutate a$7_@0, mutate b$8_@0)
    "]
    bb0_instrs --> bb0_terminal(["Return freeze c$9_@0"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = [];
  const b$3 = {};
  let c$4 = new Foo$5(a$2, b$3);
  return c$4;
}

```
      