
## Input

```javascript
function foo(a, b) {
  while (a) {
    break;
  }
  return b;
}

```

## HIR

```
bb0:
  [1] While test=bb1 loop=bb2 fallthrough=bb2
bb1:
  predecessor blocks: bb0
  [2] If (read a$3) then:bb2 else:bb2 fallthrough=bb2
bb2:
  predecessor blocks: bb1
  [3] Return read b$4
```

## Reactive Scopes

```
function foo(
  a,
  b,
) {
  while (
    read a$3
  ) {
    break
  }
  return read b$4
}

```

## Code

```javascript
function foo$0(a$3, b$4) {
  while (a$3) {
    break;
  }
  return b$4;
}

```
      