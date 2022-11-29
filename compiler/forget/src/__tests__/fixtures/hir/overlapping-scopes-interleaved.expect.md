
## Input

```javascript
function foo(a, b) {
  let x = [];
  let y = [];
  x.push(a);
  y.push(b);
}

```

## HIR

```
bb0:
  [1] Let mutate x$7_@0[1:5] = Array []
  [2] Let mutate y$8_@0[1:5] = Array []
  [3] Call mutate x$7_@0.push(read a$5)
  [4] Call mutate y$8_@0.push(read b$6)
  [5] Return
scope0 [1:5]:
 - read a$5
 - read b$6
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Let mutate x$7_@0[1:5] = Array []
      [2] Let mutate y$8_@0[1:5] = Array []
      [3] Call mutate x$7_@0.push(read a$5)
      [4] Call mutate y$8_@0.push(read b$6)
    "]
    bb0_instrs --> bb0_terminal(["Return"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function foo$0(a$1, b$2) {
  let x$3 = [];
  let y$4 = [];
  x$3.push(a$1);
  y$4.push(b$2);
}

```
      