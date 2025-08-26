
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

Error: Derive values in render, not effects.

This setState() appears to derive a value local state [firstName, lastName]. This state value shadows a value passed as a prop. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there.

error.invalid-derived-computation-in-effect.ts:9:4
   7 |   const [fullName, setFullName] = useState('');
   8 |   useEffect(() => {
>  9 |     setFullName(capitalize(firstName + ' ' + lastName));
     |     ^^^^^^^^^^^
  10 |   }, [firstName, lastName]);
  11 |
  12 |   return <div>{fullName}</div>;
```
          
      