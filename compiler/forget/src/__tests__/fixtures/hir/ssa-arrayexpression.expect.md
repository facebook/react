
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
  [1] Const mutate a$6:TPrimitive = 1
  [2] Const mutate b$7:TPrimitive = 2
  [3] Const mutate x$8_@0 = Array [read a$6:TPrimitive, read b$7:TPrimitive]
  [4] Return freeze x$8_@0
scope0 [3:4]:
  - dependency: read a$6:TPrimitive
  - dependency: read b$7:TPrimitive
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate a$6:TPrimitive = 1
  [2] Const mutate b$7:TPrimitive = 2
  scope @0 [3:4] deps=[] {
    [3] Const mutate x$8_@0 = Array [read a$6:TPrimitive, read b$7:TPrimitive]
  }
  return freeze x$8_@0
}

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
      