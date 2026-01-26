
## Input

```javascript
// Valid because classes can call functions.
// We don't consider these to be hooks.
class C {
  m() {
    this.useHook();
    super.useHook();
  }
}

```

## Code

```javascript
// Valid because classes can call functions.
// We don't consider these to be hooks.
class C {
  m() {
    this.useHook();
    super.useHook();
  }
}

```
      
### Eval output
(kind: exception) Fixture not implemented