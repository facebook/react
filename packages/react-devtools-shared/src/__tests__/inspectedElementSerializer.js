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
  // Don't stringify this object; that would break nested serializers.
  return serialize({
    context: inspectedElement.context,
    events: inspectedElement.events,
    hooks: inspectedElement.hooks,
    id: inspectedElement.id,
    owners: inspectedElement.owners,
    props: inspectedElement.props,
    state: inspectedElement.state,
  });
}
