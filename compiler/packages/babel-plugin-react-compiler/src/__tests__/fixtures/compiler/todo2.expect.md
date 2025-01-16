
## Input

```javascript
// @enableTransitivelyFreezeFunctionExpressions:false @enablePropagateDepsInHIR

function useFoo(reactive) {
  const now = localNow();
  useHook();

  const previousDate = subtractDays(reactive);

  // now  aliased to previousDate
  const res1 = captureInto(previousDate, now);
  const res2 = () => onDateChange(previousDate);
  const res3 = mutate(now); // might overwrite previousDate.day
  return [res1, res2, res3];
}

export const FIXTURE_ENTRYPOINT = {
  fn: () => {},
  params: [],
};

// function useRLDSPrivateCalendarMeetingPickerHeader(
//   disabled: boolean,
//   onDateChange: (date: DateTime) => void
// ) {
//   const now = DateTime.localNow();

//   const {date} = useDate();

//   const previousDate = date.subtractDays(1);
//   const nextDate = date.addDays(1);

//   return (
//     <RLDSButton
//       disabled1={now.getSince(previousDate.getUnixTimestampSeconds())}
//       label={translatedServerString(getDate(previousDate))}
//       onPress={() => onDateChange(previousDate)}
//       disabled2={now.getSince(nextDate.getUnixTimestampSeconds())}
//       onPress={() => onDateChange(nextDate)}
//     />
//   );
// }

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableTransitivelyFreezeFunctionExpressions:false @enablePropagateDepsInHIR

function useFoo(reactive) {
  const $ = _c(4);
  const now = localNow();
  useHook();

  const previousDate = subtractDays(reactive);

  const res1 = captureInto(previousDate, now);
  const res2 = () => onDateChange(previousDate);
  const res3 = mutate(now);
  let t0;
  if ($[0] !== res1 || $[1] !== res2 || $[2] !== res3) {
    t0 = [res1, res2, res3];
    $[0] = res1;
    $[1] = res2;
    $[2] = res3;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: () => {},
  params: [],
};

// function useRLDSPrivateCalendarMeetingPickerHeader(
//   disabled: boolean,
//   onDateChange: (date: DateTime) => void
// ) {
//   const now = DateTime.localNow();

//   const {date} = useDate();

//   const previousDate = date.subtractDays(1);
//   const nextDate = date.addDays(1);

//   return (
//     <RLDSButton
//       disabled1={now.getSince(previousDate.getUnixTimestampSeconds())}
//       label={translatedServerString(getDate(previousDate))}
//       onPress={() => onDateChange(previousDate)}
//       disabled2={now.getSince(nextDate.getUnixTimestampSeconds())}
//       onPress={() => onDateChange(nextDate)}
//     />
//   );
// }

```
      
### Eval output
(kind: ok) 