
## Input

```javascript
function Component(
  x,
  y = () => {
    return x;
  }
) {
  return y();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```


## Error

```
[ReactForget] Todo: (BuildHIR::node.lowerReorderableExpression) Expression type 'ArrowFunctionExpression' cannot be safely reordered (3:5)
```
          
      