
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

Error: You might not need an effect. Derive values in render, not effects.

Local state [firstName, lastName]. Derived values should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.invalid-derived-computation-in-effect.ts:9:4
   7 |   const [fullName, setFullName] = useState('');
   8 |   useEffect(() => {
>  9 |     setFullName(capitalize(firstName + ' ' + lastName));
     |     ^^^^^^^^^^^ This should be computed during render, not in an effect
  10 |   }, [firstName, lastName]);
  11 |
  12 |   return <div>{fullName}</div>;
```
          
      