
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
Cannot read properties of undefined (reading 'depth')
```
          
      