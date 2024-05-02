
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
  1 | function Component(props) {
  2 |   const context = useContext(FooContext);
> 3 |   context.value = props.value;
    |   ^^^^^^^ InvalidReact: Mutating a value returned from 'useContext()', which should not be mutated (3:3)
  4 |   return context.value;
  5 | }
  6 |
```
          
      