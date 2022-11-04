
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
  [1] Let mutate x$3 = 1
  [2] Let mutate y$4 = 2
  Return
```

## Code

```javascript
function foo$0() {
  let x$3 = 1;
  let y$4 = 2;
  return;
}

```
      