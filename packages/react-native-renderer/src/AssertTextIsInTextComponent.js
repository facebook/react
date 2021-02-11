import invariant from 'shared/invariant';

function stripInformation(
  internalInstanceHandle: Object
) {
  var possibleCause = '\n\nProbably result of a conditional rendering using boolean concatination as in `cond && <Component ...>`.';
  if (internalInstanceHandle && internalInstanceHandle.sibling) {
    var debugOwner = internalInstanceHandle.sibling._debugOwner;
    var debugSource = internalInstanceHandle.sibling._debugSource;
    if (debugOwner && debugSource) {
      var parentComponentName = debugOwner.type.name;
      var siblingSource = '"' + debugSource.fileName + '" line ' + debugSource.lineNumber + ', column ' + debugSource.columnNumber;
      return ' Error may have occured in component <' + parentComponentName + '> near ' + siblingSource + '.' + possibleCause;
    }
  }
  return possibleCause;
}

export function assertTextInTextComponent(
  hostContext: HostContext,
  text: string,
  internalInstanceHandle: Object
) {
  invariant(
    hostContext.isInAParentText,
    'Text string "' + text + '" must be rendered within a <Text> component.' + stripInformation(internalInstanceHandle),
  );
}
