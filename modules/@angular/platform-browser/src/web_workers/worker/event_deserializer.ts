// no deserialization is necessary in TS.
// This is only here to match dart interface
export function deserializeGenericEvent(serializedEvent: {[key: string]: any}):
    {[key: string]: any} {
  return serializedEvent;
}
