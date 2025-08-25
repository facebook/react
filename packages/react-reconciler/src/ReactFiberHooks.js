// Function to check if current fiber has a recursive parent of the same type
function isRecursiveComponent(currentFiber) {
  if (!currentFiber || !currentFiber.type) {
    return false;
  }
  
  const currentType = currentFiber.type;
  let parent = currentFiber.return;
  
  while (parent) {
    if (parent.type === currentType) {
      return true;
    }
    parent = parent.return;
  }
  
  return false;
}

}
// We can assume the previous dispatcher is always this one, since we set it
// at the beginning of the render phase and there's no re-entrance.
ReactSharedInternals.H = ContextOnlyDispatcher;
// This check uses currentHook so that it works the same in DEV and prod bundles.
// hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.
const didRenderTooFewHooks =
  currentHook !== null && currentHook.next !== null;
renderLanes = NoLanes;
currentlyRenderingFiber = (null: any);
currentHook = null;
workInProgressHook = null;
if (__DEV__) {
  currentHookNameInDev = null;
  hookTypesDev = null;
  hookTypesUpdateIndexDev = -1;
  // Confirm that a static flag was not added or removed since the last
  // render. If this fires, it suggests that we incorrectly reset the static
  // flags in some other part of the codebase. This has happened before, for
  // example, in the SuspenseList implementation.
  if (
    current !== null &&
    (current.flags & StaticMaskEffect) !==
      (workInProgress.flags & StaticMaskEffect) &&
    // Disable this warning in legacy mode, because legacy Suspense is weird
    // and creates false positives. To make this work in legacy mode, we'd
    // need to mark fibers that commit in an incomplete state, somehow. For
    // now I'll disable the warning that most of the bugs that would trigger
    // it are either exclusive to concurrent mode or exist in both.
    (disableLegacyMode || (current.mode & ConcurrentMode) !== NoMode) &&
    // Skip the error for recursive components
    !isRecursiveComponent(workInProgress)
  ) {
    console.error(
      'Internal React error: Expected static flag was missing. This often occurs if hooks are called conditionally or after early returns. Ensure all React hooks are called at the top level, without conditional logic. For help, see https://react.dev/link/rules-of-hooks',
    );
  }
}
