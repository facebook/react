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
