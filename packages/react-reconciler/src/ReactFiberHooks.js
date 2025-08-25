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
    (disableLegacyMode || (current.mode & ConcurrentMode) !== NoMode)
  ) {
    console.error(
      'Internal React error: Expected static flag was missing. This often occurs if hooks are called conditionally or after early returns. Ensure all React hooks are called at the top level, without conditional logic. For help, see https://react.dev/link/rules-of-hooks',
    );
  }
}
didScheduleRenderPhaseUpdate = false;
// This is reset by checkDidRenderIdHook
// localIdCounter = 0;
thenableIndexCounter = 0;
thenableState = null;
if (didRenderTooFewHooks) {
  throw new Error(
    'Rendered fewer hooks than expected. This may be caused by an accidental ' +
      'early return statement.',
  );
}
if (current !== null) {
  if (!checkIfWorkInProgressReceivedUpdate()) {
    // If there were no changes to props or state, we need to check if there
    // was a context change. We didn't already do this because there's no
    // 1:1 correspondence between dependencies and hooks. Although, because
    // there almost always is in the common case (`readContext` is an
    // internal API), we could compare in there. OTOH, we only hit this case
    // if everything else bails out, so on the whole it might be better to
    // keep the comparison out of the common path.
    const currentDependencies = current.dependencies;
    if (
      currentDependencies !== null &&
      checkIfContextChanged(currentDependencies)
    ) {
      markWorkInProgressReceivedUpdate();
    }
  }
}
