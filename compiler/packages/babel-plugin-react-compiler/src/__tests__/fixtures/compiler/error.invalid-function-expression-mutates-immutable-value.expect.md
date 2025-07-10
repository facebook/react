
## Input

```javascript
function Component(props) {
  const [x, setX] = useState({value: ''});
  const onChange = e => {
    // INVALID! should use copy-on-write and pass the new value
    x.value = e.target.value;
    setX(x);
  };
  return <input value={x.value} onChange={onChange} />;
}

```


## Error

```
Found 1 error:
Error: Mutating a value returned from 'useState()', which should not be mutated. Use the setter function to update instead

Found mutation of `x`.

error.invalid-function-expression-mutates-immutable-value.ts:5:4
  3 |   const onChange = e => {
  4 |     // INVALID! should use copy-on-write and pass the new value
> 5 |     x.value = e.target.value;
    |     ^ Mutating a value returned from 'useState()', which should not be mutated. Use the setter function to update instead
  6 |     setX(x);
  7 |   };
  8 |   return <input value={x.value} onChange={onChange} />;


```
          
      