
## Input

```javascript
// @validateNoDerivedComputationsInEffects

export default function Component(input = 'empty') {
  const [currInput, setCurrInput] = useState(input);

  useEffect(() => {
    setCurrInput(input);
  }, [input]);

  return <div>{currInput}</div>;
}

```


## Error

```
Found 1 error:

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.derived-state-from-default-props.ts:7:4
   5 |
   6 |   useEffect(() => {
>  7 |     setCurrInput(input);
     |     ^^^^^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
   8 |   }, [input]);
   9 |
  10 |   return <div>{currInput}</div>;
```
          
      