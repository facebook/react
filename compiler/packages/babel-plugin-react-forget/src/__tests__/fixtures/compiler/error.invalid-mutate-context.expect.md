
## Input

```javascript
function Component(props) {
  const context = useContext(FooContext);
  context.value = props.value;
  return context.value;
}

```


## Error

```
[ReactForget] InvalidReact: Mutating a value returned from 'useContext()', which should not be mutated. (3:3)
```
          
      