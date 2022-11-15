
## Input

```javascript
function Component(props) {
  const a = 1;
  const b = 2;
  const x = { a: a, b: b };
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate a$2_@0 = 1
  [2] Const mutate b$3_@1 = 2
  [3] Const mutate x$4_@2 = Object { a: read a$2_@0, b: read b$3_@1 }
  Return freeze x$4_@2
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$2_@0 = 1
      [2] Const mutate b$3_@1 = 2
      [3] Const mutate x$4_@2 = Object { a: read a$2_@0, b: read b$3_@1 }
    "]
    bb0_instrs --> bb0_terminal(["Return freeze x$4_@2"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = 1;
  const b$3 = 2;
  const x$4 = {
    a: a$2,
    b: b$3,
  };
  return x$4;
}

```
      