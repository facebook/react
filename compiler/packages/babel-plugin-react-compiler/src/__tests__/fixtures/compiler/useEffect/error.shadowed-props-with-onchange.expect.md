
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

Error: You might not need an effect. Local state shadows parent state.

The setState within a useEffect is deriving from props [startDate]. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there. If you are purposefully initializing state with a prop, and want to update it when a prop changes, do so conditionally in render

error.shadowed-props-with-onchange.ts:7:8
   5 |
   6 |     useEffect(() => {
>  7 |         setLocalStartDate(startDate);
     |         ^^^^^^^^^^^^^^^^^ this derives values from props to synchronize state
   8 |     }, [startDate]);
   9 |
  10 |     const onChange = (date) => {

error.shadowed-props-with-onchange.ts:4:47
  2 |
  3 | function EndDate({startDate, endDate, onStartDateChange}) {
> 4 |    const [localStartDate, setLocalStartDate] = useState(startDate);
    |                                                ^^^^^^^^^^^^^^^^^^^ this useState shadows startDate
  5 |
  6 |     useEffect(() => {
  7 |         setLocalStartDate(startDate);

error.shadowed-props-with-onchange.ts:11:8
   9 |
  10 |     const onChange = (date) => {
> 11 |         setLocalStartDate(date);
     |         ^^^^^^^^^^^^^^^^^ this setState updates the shadowed state, but should call an onChange event from the parent
  12 |         onStartDateChange(date);
  13 |     }
  14 |     return <DateInput value={localStartDate} second={endDate} onChange={onChange} />
```
          
      