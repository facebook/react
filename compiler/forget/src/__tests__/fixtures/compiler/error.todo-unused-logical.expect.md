
## Input

```javascript
function Component(props) {
  let x = 0;
  props.cond ? (x = 1) : (x = 2);
  return x;
}

```


## Error

```
[ReactForget] Todo: TODO: Support ConditionalExpression whose value is unused (3:3)
```
          
      