
## Input

```javascript
function Component(props) {
  const x = {};
  let fn;
  if (props.cond) {
    // mutable
    fn = () => {
      x.value = props.value;
    };
  } else {
    // immutable
    fn = () => {
      x.value;
    };
  }
  return fn;
}

```


## Error

```
[ReactForget] InvalidReact: This mutates a variable that is managed by React, where an immutable value or a function was expected (15:15)
```
          
      