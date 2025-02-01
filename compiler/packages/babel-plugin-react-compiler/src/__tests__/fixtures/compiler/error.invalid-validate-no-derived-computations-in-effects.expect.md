
## Input

```javascript
function Form() {
  const [firstName, setFirstName] = useState('Taylor');
  const [lastName, setLastName] = useState('Swift');

  // 🔴 Avoid: redundant state and unnecessary Effect
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);

  return <div>{fullName}</div>;
}

```


## Error

```
   6 |   const [fullName, setFullName] = useState('');
   7 |   useEffect(() => {
>  8 |     setFullName(firstName + ' ' + lastName);
     |     ^^^^^^^^^^^ InvalidReact: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state) (8:8)
   9 |   }, [firstName, lastName]);
  10 |
  11 |   return <div>{fullName}</div>;
```
          
      