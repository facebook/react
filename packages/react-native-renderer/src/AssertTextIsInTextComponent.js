import invariant from 'shared/invariant';

export type HostContext = $ReadOnly<{|
  isInAParentText: boolean,
|}>;

function stripInformation(
  internalInstanceHandle: Object,
) {
  const possibleCause = '\n\nProbably result of a conditional rendering using boolean concatination as in `cond && <Component ...>`.';
  if (internalInstanceHandle && internalInstanceHandle.sibling) {
    const debugOwner = internalInstanceHandle.sibling._debugOwner;
    const debugSource = internalInstanceHandle.sibling._debugSource;
    if (debugOwner && debugSource) {
      const parentComponentName = debugOwner.type.name;
      const siblingSource = `"${debugSource.fileName}" line ${debugSource.lineNumber}, column ${debugSource.columnNumber}`;
      return ` Error may have occured in component <${parentComponentName}> near ${siblingSource}. ${possibleCause}`;
    }
  }
  return possibleCause;
}

export function assertTextInTextComponent(
  hostContext: HostContext,
  text: string,
  internalInstanceHandle: Object,
) {
  invariant(
    hostContext.isInAParentText,
    'Text string "%s" must be rendered within a <Text> component.%s',
    text,
    stripInformation(internalInstanceHandle),
  );
}
