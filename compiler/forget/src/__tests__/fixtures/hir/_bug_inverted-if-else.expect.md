
## Input

```javascript
function foo(a, b, c) {
  let x = null;
  label: {
    if (a) {
      x = b;
      break label;
    }
    x = c;
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$8_@0:TPrimitive = null
  [2] If (read a$5) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb0
  [3] Const mutate x$9_@1 = read b$6
  [4] Goto bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate x$10_@2 = read c$7
  [6] Goto bb1
bb1:
  predecessor blocks: bb3 bb2
  [7] Return read x$11
scope1 [3:4]:
  - dependency: read b$6
scope2 [5:6]:
  - dependency: read c$7
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  [1] Const mutate x$8_@0:TPrimitive = null
  if (read a$5) {
    [3] Const mutate x$9_@1 = read b$6
  }
  [5] Const mutate x$10_@2 = read c$7
}

```

## Code

```javascript
function foo$0(a$5, b$6, c$7) {
  const x$8 = null;
  bb2: if (a$5) {
    const x$9 = b$6;
  }

  const x$10 = c$7;
}

```
      