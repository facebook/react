
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
  Let mutate x$1000 = 1
  Let mutate y$1001 = 2
  Return
```

## Code

```javascript
function foo$0() {
  let x$1000 = 1;
  let y$1001 = 2;
  return;
}

```
      