
## Input

```javascript
// @validateNoDerivedComputationsInEffects

export default function Component(input = 'empty') {
  const [currInput, setCurrInput] = useState(input);
  const localConst = 'local const';

  useEffect(() => {
    setCurrInput(input + localConst);
  }, [input, localConst]);

  return <div>{currInput}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{input: 'test'}],
};

```


## Error

```
Found 1 error:

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.derived-state-from-default-props.ts:8:4
   6 |
   7 |   useEffect(() => {
>  8 |     setCurrInput(input + localConst);
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
   9 |   }, [input, localConst]);
  10 |
  11 |   return <div>{currInput}</div>;
```
          
      