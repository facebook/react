
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;
}

```

## HIR

```
bb0:
  [1] Let mutate x$3_@0 = 1
  [2] Let mutate y$4_@1 = 2
  [3] Return

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$3_@0 = 1
      [2] Let mutate y$4_@1 = 2
    "]
    bb0_instrs --> bb0_terminal(["Return"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function foo$0() {
  const x$3 = 1;
  const y$4 = 2;
}

```
      