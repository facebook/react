
## Input

```javascript
// @validateNoDerivedComputationsInEffects

function Component({value}) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    setLocalValue(value);
    document.title = `Value: ${value}`;
  }, [value]);

  return <div>{localValue}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'test'}],
};

```


## Error

```
Found 1 error:

Error: You might not need an effect. Derive values in render, not effects.

Derived values (From props: [value]) should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.derived-state-from-prop-with-side-effect.ts:7:4
   5 |
   6 |   useEffect(() => {
>  7 |     setLocalValue(value);
     |     ^^^^^^^^^^^^^^^^^^^^ This should be computed during render, not in an effect
   8 |     document.title = `Value: ${value}`;
   9 |   }, [value]);
  10 |
```
          
      