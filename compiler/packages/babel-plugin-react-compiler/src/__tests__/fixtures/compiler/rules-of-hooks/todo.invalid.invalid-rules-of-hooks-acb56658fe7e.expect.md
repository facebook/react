
## Input

```javascript
// @skip
// Passed but should have failed

class C {
  m() {
    This.useHook();
    Super.useHook();
  }
}

```

## Code

```javascript
// @skip
// Passed but should have failed

class C {
  m() {
    This.useHook();
    Super.useHook();
  }
}

```
      