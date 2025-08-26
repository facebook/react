
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

This setState() appears to derive a value from props [input]. This state value shadows a value passed as a prop. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there.

error.invalid-derived-state-from-props-with-default-value.ts:9:4
   7 |
   8 |   useEffect(() => {
>  9 |     setCurrInput(input)
     |     ^^^^^^^^^^^^ This state value shadows a value passed as a prop.
  10 |   }, [input]);
  11 |
  12 |   return (
```
          
      