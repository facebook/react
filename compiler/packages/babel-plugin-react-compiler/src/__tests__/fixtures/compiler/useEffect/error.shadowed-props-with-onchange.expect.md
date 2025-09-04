
## Input

```javascript
// @validateNoDerivedComputationsInEffects

function EndDate({startDate, endDate, onStartDateChange}) {
   const [localStartDate, setLocalStartDate] = useState(startDate);

    useEffect(() => {
        setLocalStartDate(startDate);
    }, [startDate]);

    const onChange = (date) => {
        setLocalStartDate(date);
        onStartDateChange(date);
    }
    return <DateInput value={localStartDate} second={endDate} onChange={onChange} />
}

```


## Error

```
Found 1 error:

Error: Local state shadows parent state.

This setState() appears to derive a value from props [startDate]. This state value shadows a value passed as a prop. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there.

error.shadowed-props-with-onchange.ts:4:47
  2 |
  3 | function EndDate({startDate, endDate, onStartDateChange}) {
> 4 |    const [localStartDate, setLocalStartDate] = useState(startDate);
    |                                                ^^^^^^^^^^^^^^^^^^^ this useState shadows startDate
  5 |
  6 |     useEffect(() => {
  7 |         setLocalStartDate(startDate);

error.shadowed-props-with-onchange.ts:7:8
   5 |
   6 |     useEffect(() => {
>  7 |         setLocalStartDate(startDate);
     |         ^^^^^^^^^^^^^^^^^ this setState synchronizes the state
   8 |     }, [startDate]);
   9 |
  10 |     const onChange = (date) => {

error.shadowed-props-with-onchange.ts:11:8
   9 |
  10 |     const onChange = (date) => {
> 11 |         setLocalStartDate(date);
     |         ^^^^^^^^^^^^^^^^^ this setState updates the shadowed state, but should call an onChange event from the parent
  12 |         onStartDateChange(date);
  13 |     }
  14 |     return <DateInput value={localStartDate} second={endDate} onChange={onChange} />
```
          
      