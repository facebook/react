
## Input

```javascript
// Regression test for incorrectly flagged valid code.
function RegressionTest() {
  const foo = cond ? a : b;
  useState();
}

```

## Code

```javascript
// Regression test for incorrectly flagged valid code.
function RegressionTest() {
  cond ? a : b;
  useState();
}

```
      
### Eval output
(kind: exception) Fixture not implemented