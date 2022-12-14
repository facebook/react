
## Input

```javascript
function foo(a, b, c) {
  const x = [];
  const y = [];

  if (x) {
  }

  y.push(a);
  x.push(b);
}

```

## HIR

```
bb0:
  [1] Const mutate x$9_@0:TFunction[1:6] = Array []
  [2] Const mutate y$10_@0:TFunction[1:6] = Array []
  [3] If (read x$9_@0:TFunction) then:bb1 else:bb1 fallthrough=bb1
bb1:
  predecessor blocks: bb0
  [4] Call mutate y$10_@0.push(read a$6)
  [5] Call mutate x$9_@0.push(read b$7)
  [6] Return

```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:6] deps=[] {
    [1] Const mutate x$9_@0:TFunction[1:6] = Array []
    [2] Const mutate y$10_@0:TFunction[1:6] = Array []
    if (read x$9_@0:TFunction) {
    }
    [4] Call mutate y$10_@0.push(read a$6)
    [5] Call mutate x$9_@0.push(read b$7)
  }
  return
}

```

## Code

```javascript
function foo$0(a$6, b$7, c$8) {
  const x$9 = [];
  const y$10 = [];
  bb1: if (x$9) {
  }

  y$10.push(a$6);
  x$9.push(b$7);
}

```
      