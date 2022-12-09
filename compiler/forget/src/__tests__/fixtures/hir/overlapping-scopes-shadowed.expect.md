
## Input

```javascript
function foo(a, b) {
  let x = [];
  let y = [];
  y.push(b);
  x.push(a);
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0[1:5] = Array []
  [2] Const mutate y$8_@1[2:4] = Array []
  [3] Call mutate y$8_@1.push(read b$6)
  [4] Call mutate x$7_@0.push(read a$5)
  [5] Return
scope1 [2:4]:
  - dependency: read b$6
  - dependency: read a$5
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate x$7_@0[1:5] = Array []
      [2] Const mutate y$8_@1[2:4] = Array []
      [3] Call mutate y$8_@1.push(read b$6)
      [4] Call mutate x$7_@0.push(read a$5)
    "]
    bb0_instrs --> bb0_terminal(["Return"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function foo$0(a$5, b$6) {
  const x$7 = [];
  const y$8 = [];
  y$8.push(b$6);
  x$7.push(a$5);
}

```
      