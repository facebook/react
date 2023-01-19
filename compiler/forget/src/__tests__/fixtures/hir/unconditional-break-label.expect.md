
## Input

```javascript
function foo(a) {
  let x = 0;
  bar: {
    x = 1;
    break bar;
  }
  return a + x;
}

```

## Code

```javascript
function foo(a) {
  const x = 0;

  const x$0 = 1;
  return a + x$0;
}

```
      