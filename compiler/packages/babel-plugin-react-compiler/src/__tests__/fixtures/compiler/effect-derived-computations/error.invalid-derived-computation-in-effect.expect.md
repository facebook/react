
## Input

```javascript
// @validateNoDerivedComputationsInEffects
function BadExample() {
  const [firstName, setFirstName] = useState('Taylor');
  const [lastName, setLastName] = useState('Swift');

  // 🔴 Avoid: redundant state and unnecessary Effect
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(capitalize(firstName + ' ' + lastName));
  }, [firstName, lastName]);

  return <div>{fullName}</div>;
}

```


## Error

```
Found 1 error:

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.invalid-derived-computation-in-effect.ts:9:4
   7 |   const [fullName, setFullName] = useState('');
   8 |   useEffect(() => {
>  9 |     setFullName(capitalize(firstName + ' ' + lastName));
     |     ^^^^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  10 |   }, [firstName, lastName]);
  11 |
  12 |   return <div>{fullName}</div>;
```
          
      