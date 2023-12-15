
## Input

```javascript
function Component(props) {
  const x = makeObject();
  // freeze
  <div>{x}</div>;
  delete x.y;
  return x;
}

```


## Error

```
[ReactForget] InvalidReact: Updating a value used previously in JSX is not allowed. Consider moving the mutation before the JSX. (5:5)
```
          
      