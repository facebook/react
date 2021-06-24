// TODO (named hooks) Don't mutate hooks object
// This method should return a mirror object,
// and its return value should be used in `print()`
function serializeHookSourceFileNames(hooks) {
  if (!hooks.length) return;
  hooks.forEach(hook => {
    if (!hook.hookSource) return;
    const filename = hook.hookSource.fileName;
    const truncateIdx = filename.lastIndexOf('/react-devtools-shared/');
    hook.hookSource.fileName = filename.substring(truncateIdx + 1);
    if (hook.subHooks && hook.subHooks.length)
      serializeHookSourceFileNames(hook.subHooks);
  });
}

// test() is part of Jest's serializer API
export function test(maybeInspectedElement) {
  if (
    maybeInspectedElement === null ||
    typeof maybeInspectedElement !== 'object'
  ) {
    return false;
  }

  const hasOwnProperty = Object.prototype.hasOwnProperty.bind(
    maybeInspectedElement,
  );

  // TODO (named hooks) Remove this call
  if (hasOwnProperty('hooks') && maybeInspectedElement.hooks != null) {
    serializeHookSourceFileNames(maybeInspectedElement.hooks);
  }

  return (
    hasOwnProperty('canEditFunctionProps') &&
    hasOwnProperty('canEditHooks') &&
    hasOwnProperty('canToggleSuspense') &&
    hasOwnProperty('canToggleError') &&
    hasOwnProperty('canViewSource')
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
