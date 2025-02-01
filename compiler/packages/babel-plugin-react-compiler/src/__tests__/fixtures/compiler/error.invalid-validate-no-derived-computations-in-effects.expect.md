
## Input

```javascript
// @validateNoDerivedComputationsInEffects
function Form() {
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
   7 |   const [fullName, setFullName] = useState('');
   8 |   useEffect(() => {
>  9 |     setFullName(capitalize(firstName + ' ' + lastName));
     |     ^^^^^^^^^^^ InvalidReact: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state) (9:9)
  10 |   }, [firstName, lastName]);
  11 |
  12 |   return <div>{fullName}</div>;
```
          
      