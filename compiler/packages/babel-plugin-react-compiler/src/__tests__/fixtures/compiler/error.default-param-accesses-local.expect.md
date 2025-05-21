
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
  1 | function Component(
  2 |   x,
> 3 |   y = () => {
    |       ^^^^^^^
> 4 |     return x;
    | ^^^^^^^^^^^^^
> 5 |   }
    | ^^^^ Todo: (BuildHIR::node.lowerReorderableExpression) Expression type `ArrowFunctionExpression` cannot be safely reordered (3:5)
  6 | ) {
  7 |   return y();
  8 | }
```
          
      