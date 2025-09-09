
## Input

```javascript
// @validateNoDerivedComputationsInEffects

export default function InProductLobbyGeminiCard(input = 'empty') {
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

Error: You might not need an effect. Derive values in render, not effects.

Props [input]. Derived values should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.invalid-derived-state-from-props-with-default-value.ts:7:4
   5 |
   6 |   useEffect(() => {
>  7 |     setCurrInput(input);
     |     ^^^^^^^^^^^^ This should be computed during render, not in an effect
   8 |   }, [input]);
   9 |
  10 |   return <div>{currInput}</div>;
```
          
      