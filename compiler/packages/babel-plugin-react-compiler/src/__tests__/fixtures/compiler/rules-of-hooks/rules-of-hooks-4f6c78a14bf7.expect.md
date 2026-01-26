
## Input

```javascript
// Valid although unconditional return doesn't make sense and would fail other rules.
// We could make it invalid but it doesn't matter.
function useUnreachable() {
  return;
  useHook();
}

```

## Code

```javascript
// Valid although unconditional return doesn't make sense and would fail other rules.
// We could make it invalid but it doesn't matter.
function useUnreachable() {}

```
      
### Eval output
(kind: exception) Fixture not implemented