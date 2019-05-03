// test() is part of Jest's serializer API
export function test(maybeProfilingSummary) {
  return (
    typeof maybeProfilingSummary === 'object' &&
    maybeProfilingSummary !== null &&
    typeof maybeProfilingSummary.rootID === 'number' &&
    Array.isArray(maybeProfilingSummary.commitDurations) &&
    Array.isArray(maybeProfilingSummary.commitTimes) &&
    typeof maybeProfilingSummary.initialTreeBaseDurations === 'object' &&
    maybeProfilingSummary.initialTreeBaseDurations !== null &&
    typeof maybeProfilingSummary.interactionCount === 'number'
  );
}

// print() is part of Jest's serializer API
export function print(profilingSummary, serialize, indent) {
  return JSON.stringify(
    {
      ...profilingSummary,
      commitDurations: profilingSummary.commitDurations.map((_, i) => i),
      commitTimes: profilingSummary.commitTimes.map((_, i) => i),
      initialTreeBaseDurations: [
        ...profilingSummary.initialTreeBaseDurations,
      ].map(([id, _], index) => [id, index]),
    },
    null,
    2
  );
}
