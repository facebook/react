
## Input

```javascript
// @validateNoDerivedComputationsInEffects

export default function InProductLobbyGeminiCard(
  input = 'empty',
) {
  const [currInput, setCurrInput] = useState(input);

  useEffect(() => {
    setCurrInput(input)
  }, [input]);

  return (
    <div>{currInput}</div>
  )
}

```


## Error

```
Found 1 error:

Error: Derive values in render, not effects.

This setState() appears to derive a value from props [input]. Derived values should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.invalid-derived-state-from-props-with-default-value.ts:9:4
   7 |
   8 |   useEffect(() => {
>  9 |     setCurrInput(input)
     |     ^^^^^^^^^^^^ This should be computed during render, not in an effect
  10 |   }, [input]);
  11 |
  12 |   return (
```
          
      