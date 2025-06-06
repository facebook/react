
## Input

```javascript
function Component() {
  let callback = () => {
    onClick = () => {};
  };
  let onClick;

  return <div onClick={callback} />;
}

```


## Error

```
  5 |   let onClick;
  6 |
> 7 |   return <div onClick={callback} />;
    |                        ^^^^^^^^ InvalidReact: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead (7:7)

InvalidReact: The function modifies a local variable here (3:3)
  8 | }
  9 |
```
          
      