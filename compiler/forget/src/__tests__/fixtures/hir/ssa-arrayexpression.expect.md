
## Input

```javascript
function Component(props) {
  const a = 1;
  const b = 2;
  const x = [a, b];
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate a$6_@0:TPrimitive = 1
  [2] Const mutate b$7_@1:TPrimitive = 2
  [3] Const mutate x$8_@2 = Array [read a$6_@0:TPrimitive, read b$7_@1:TPrimitive]
  [4] Return freeze x$8_@2
scope2 [3:4]:
  - dependency: read a$6_@0:TPrimitive
  - dependency: read b$7_@1:TPrimitive
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate a$6_@0:TPrimitive = 1
  [2] Const mutate b$7_@1:TPrimitive = 2
  scope @2 [3:4] deps=[read a$6_@0:TPrimitive, read b$7_@1:TPrimitive] {
    [3] Const mutate x$8_@2 = Array [read a$6_@0:TPrimitive, read b$7_@1:TPrimitive]
  }
  return freeze x$8_@2
}

```

### CFG

```mermaid
flowchart TB
  %% Basic Blocks
  subgraph bb0
    bb0_instrs["
      [1] Const mutate a$6_@0:TPrimitive = 1
      [2] Const mutate b$7_@1:TPrimitive = 2
      [3] Const mutate x$8_@2 = Array [read a$6_@0:TPrimitive, read b$7_@1:TPrimitive]
    "]
    bb0_instrs --> bb0_terminal(["Return freeze x$8_@2"])
  end

  %% Jumps
  %% empty
```

## Code

```javascript
function Component$0(props$5) {
  const a$6 = 1;
  const b$7 = 2;
  const x$8 = [a$6, b$7];
  return x$8;
}

```
      