
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

Error: You might not need an effect. Derive values in render, not effects.

Derived values (From props: [input]) should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.derived-state-from-default-props.ts:8:4
   6 |
   7 |   useEffect(() => {
>  8 |     setCurrInput(input + localConst);
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ This should be computed during render, not in an effect
   9 |   }, [input, localConst]);
  10 |
  11 |   return <div>{currInput}</div>;
```
          
      