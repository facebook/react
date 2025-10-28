
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp

function Component({ value }) {
  const [checked, setChecked] = useState('');

  useEffect(() => {
    setChecked(value === '' ? [] : value.split(','));
  }, [value]);

  return (
    <div>{checked}</div>
  )
}

```


## Error

```
Found 1 error:

Error: You might not need an effect. Derive values in render, not effects.

Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user

This setState call is setting a derived value that depends on the following reactive sources:

Props: [value]

Data Flow Tree:
└── value (Prop)

See: https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state.

error.derived-state-from-prop-setter-ternary.ts:7:4
   5 |
   6 |   useEffect(() => {
>  7 |     setChecked(value === '' ? [] : value.split(','));
     |     ^^^^^^^^^^ This should be computed during render, not in an effect
   8 |   }, [value]);
   9 |
  10 |   return (
```
          
      