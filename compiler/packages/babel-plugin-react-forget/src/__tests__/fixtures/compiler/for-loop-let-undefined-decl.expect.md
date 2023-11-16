
## Input

```javascript
function useFoo() {
  for (let i = 0; i <= 5; i++) {
    let color;
    if (isSelected) {
      color = isCurrent ? "#FFCC22" : "#FF5050";
    } else {
      color = isCurrent ? "#CCFF03" : "#CCCCCC";
    }
    console.log(color);
  }
}

export const FIXTURE_ENTRYPOINT = {
  params: [],
  fn: useFoo,
};

```

## Code

```javascript
function useFoo() {
  for (let i = 0; i <= 5; i++) {
    let color;
    if (isSelected) {
      color = isCurrent ? "#FFCC22" : "#FF5050";
    } else {
      color = isCurrent ? "#CCFF03" : "#CCCCCC";
    }

    console.log(color);
  }
}

export const FIXTURE_ENTRYPOINT = {
  params: [],
  fn: useFoo,
};

```
      
### Eval output
(kind: exception) isSelected is not defined
logs: ['The above error occurred in the <WrapperTestComponent> component:\n' +
  '\n' +
  '    at WrapperTestComponent (<project_root>/packages/sprout/dist/runner-evaluator.js:50:26)\n' +
  '\n' +
  'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
  'Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.']