
## Input

```javascript
export function useFormatRelativeTime(opts = {}) {
  const {timeZone, minimal} = opts;
  const format = useCallback(function formatWithUnit() {}, [minimal]);
  // We record `{timeZone}` as capturing timeZone into the object,
  // then assume that dateTimeFormat() mutates that object,
  // which in turn can mutate timeZone and the object it came from,
  // which means that the value `minimal` is derived from can change.
  //
  // The bug is that we shouldn't be recording a Capture effect given
  // that `opts` is known maybe-frozen. If we correctly recorded
  // an ImmutableCapture, this wouldn't be mistaken as mutating
  // opts/minimal
  dateTimeFormat({timeZone});
  return format;
}

```


## Error

```
Found 1 error:

Compilation Skipped: Existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This dependency may be mutated later, which could cause the value to change unexpectedly.

error.todo-repro-destructure-from-prop-with-default-value.ts:3:60
  1 | export function useFormatRelativeTime(opts = {}) {
  2 |   const {timeZone, minimal} = opts;
> 3 |   const format = useCallback(function formatWithUnit() {}, [minimal]);
    |                                                             ^^^^^^^ This dependency may be modified later
  4 |   // We record `{timeZone}` as capturing timeZone into the object,
  5 |   // then assume that dateTimeFormat() mutates that object,
  6 |   // which in turn can mutate timeZone and the object it came from,
```
          
      