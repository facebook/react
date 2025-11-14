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
