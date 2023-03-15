
## Input

```javascript
function Component(props) {
  let x = 0;
  (x = 1) && (x = 2);
  return x;
}

```


## Error

```
[ReactForget] Todo: TODO: Support LogicalExpression whose value is unused (3:3)
```
          
      