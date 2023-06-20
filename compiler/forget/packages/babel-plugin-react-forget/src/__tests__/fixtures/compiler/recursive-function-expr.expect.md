
## Input

```javascript
function foo() {
  (() => foo())();
}

```

## Code

```javascript
function foo() {
  (() => foo())();
}

```
      