
## Input

```javascript
function Component() {
  const a = [];
  useFreeze(a); // should freeze
  useFreeze(a); // should be readonly
  call(a); // should be readonly
  return a;
}

function useFreeze(x) {}
function call(x) {}

```

## HIR

```
bb0:
  [1] Const mutate a$1_@0 = Array []
  [2] Call read useFreeze$2(freeze a$1_@0)
  [3] Call read useFreeze$2(read a$1_@0)
  [4] Call mutate call$3_@1(read a$1_@0)
  Return read a$1_@0
```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$1_@0 = Array []
      [2] Call read useFreeze$2(freeze a$1_@0)
      [3] Call read useFreeze$2(read a$1_@0)
      [4] Call mutate call$3_@1(read a$1_@0)
    "]
    bb0_instrs --> bb0_terminal(["Return read a$1_@0"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function Component$0() {
  const a$1 = [];
  useFreeze$2(a$1);
  useFreeze$2(a$1);
  call$3(a$1);
  return a$1;
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
function useFreeze$0(x$1) {
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
function call$0(x$1) {
  return;
}

```
      