
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
[ReactForget] InvalidReact: Updating a value used previously in JSX is not allowed. Consider moving the mutation before the JSX. (4:4)
```
          
      