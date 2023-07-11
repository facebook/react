
## Input

```javascript
function foo() {
  const x = 42;
  const f = () => {
    console.log(x);
  };
  f();
  return x;
}

```

## Code

```javascript
function foo() {
  const f = () => {
    console.log(42);
  };

  f();
  return 42;
}

```
      