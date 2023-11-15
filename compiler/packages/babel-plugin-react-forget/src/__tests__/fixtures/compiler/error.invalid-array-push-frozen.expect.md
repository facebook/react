
## Input

```javascript
function Component(props) {
  const x = [];
  <div>{x}</div>;
  x.push(props.value);
  return x;
}

```


## Error

```
[ReactForget] InvalidReact: This mutates a global or a variable after it was passed to React, which means that React cannot observe changes to it (4:4)
```
          
      