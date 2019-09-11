// test() is part of Jest's serializer API
export function test(maybeInspectedElement) {
  return (
    maybeInspectedElement !== null &&
    typeof maybeInspectedElement === 'object' &&
    maybeInspectedElement.hasOwnProperty('canEditFunctionProps') &&
    maybeInspectedElement.hasOwnProperty('canEditHooks') &&
    maybeInspectedElement.hasOwnProperty('canToggleSuspense') &&
    maybeInspectedElement.hasOwnProperty('canViewSource')
  );
}

// print() is part of Jest's serializer API
export function print(inspectedElement, serialize, indent) {
  return JSON.stringify(
    {
      id: inspectedElement.id,
      owners: inspectedElement.owners,
      context: inspectedElement.context,
      events: inspectedElement.events,
      hooks: inspectedElement.hooks,
      props: inspectedElement.props,
      state: inspectedElement.state,
    },
    null,
    2,
  );
}
