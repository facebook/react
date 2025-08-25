
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

Error: You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

You are using invalid dependencies:

Invalid deps from props [input].

error.invalid-derived-state-from-props-with-default-value.ts:9:4
   7 |
   8 |   useEffect(() => {
>  9 |     setCurrInput(input)
     |     ^^^^^^^^^^^^ You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  10 |   }, [input]);
  11 |
  12 |   return (
```
          
      